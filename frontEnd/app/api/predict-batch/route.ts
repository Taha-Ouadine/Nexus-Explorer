import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const model = formData.get("model") as string

    console.log("📦 Prédiction par lot - Modèle:", model)
    console.log("📁 Fichier reçu:", file?.name)

    if (!file || !model) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fichier et modèle sont requis" 
        },
        { status: 400 }
      )
    }

    // Vérifier que le modèle existe
    const modelsDir = path.join(process.cwd(), "..", "backEnd", "models")
    const modelPath = path.join(modelsDir, `${model}.pkl`)
    
    if (!fs.existsSync(modelPath)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Modèle ${model} non trouvé` 
        },
        { status: 404 }
      )
    }

    // Lire le fichier CSV
    const fileBuffer = await file.arrayBuffer()
    const fileContent = new TextDecoder().decode(fileBuffer)
    
    console.log("📊 Contenu CSV (premières lignes):", fileContent.split('\n').slice(0, 3).join('\n'))

    // Parser le CSV
    const lines = fileContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length < 2) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fichier CSV vide ou invalide" 
        },
        { status: 400 }
      )
    }

    const headers = parseCSVLine(lines[0])
    console.log("🎯 En-têtes CSV:", headers)

    // VALIDATION comme dans Streamlit
    if (headers.length < 20) {
      return NextResponse.json(
        { 
          success: false,
          error: `Le CSV doit avoir au moins 20 colonnes de features (reçu: ${headers.length})` 
        },
        { status: 400 }
      )
    }

    // Vérifier les valeurs manquantes
    const batchData = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.some(val => !val || val.trim() === '')) {
        return NextResponse.json(
          { 
            success: false,
            error: `Valeurs manquantes détectées à la ligne ${i + 1}` 
          },
          { status: 400 }
        )
      }
      batchData.push(values)
    }

    // Traiter chaque ligne pour faire les prédictions
    const results = []
    const errors = []

    for (let i = 0; i < batchData.length; i++) {
      try {
        const values = batchData[i]
        const features = values.slice(0, 20).map(val => {
          const num = Number(val)
          return isNaN(num) ? 0 : num
        })

        // Faire la prédiction pour cette ligne via FastAPI
        const predictionResponse = await fetch("http://localhost:8000/api/predict", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model_name: model,
            features: features,
          }),
        })

        if (predictionResponse.ok) {
          const predictionResult = await predictionResponse.json()
          
          // FORMAT DES RÉSULTATS COMME STREAMLIT
          const resultRow: any = {
            row: i + 2, // +2 car ligne 1 = headers, ligne 2 = première donnée
            features: features,
            prediction: predictionResult.prediction,
            prediction_label: predictionResult.prediction_label,
            probabilities: predictionResult.probabilities,
            success: true
          }

          // Ajouter les probabilités par classe comme dans Streamlit
          if (predictionResult.probabilities) {
            resultRow.confidence_false_positive = predictionResult.probabilities[0]
            resultRow.confidence_candidate = predictionResult.probabilities[1] 
            resultRow.confidence_exoplanet = predictionResult.probabilities[2]
            resultRow.max_confidence = Math.max(...predictionResult.probabilities)
            resultRow.most_likely_class = predictionResult.prediction_label
          }

          results.push(resultRow)
        } else {
          errors.push({
            row: i + 2,
            error: `Erreur prédiction: ${predictionResponse.status}`
          })
        }

      } catch (error) {
        errors.push({
          row: i + 2,
          error: `Erreur ligne: ${error}`
        })
      }
    }

    console.log(`✅ Prédictions terminées: ${results.length} réussies, ${errors.length} erreurs`)

    // STATISTIQUES comme dans Streamlit
    const predictionStats = {
      total: results.length + errors.length,
      successful: results.length,
      failed: errors.length,
      class_distribution: {
        "Faux Positif": results.filter(r => r.prediction_label === "Faux Positif").length,
        "Candidat": results.filter(r => r.prediction_label === "Candidat").length,
        "Exoplanète": results.filter(r => r.prediction_label === "Exoplanète").length
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      errors: errors,
      stats: predictionStats,
      total_processed: results.length + errors.length,
      model_used: model
    })

  } catch (error) {
    console.error("💥 Erreur prédiction par lot:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors du traitement du fichier batch" 
      },
      { status: 500 }
    )
  }
}

// Fonction pour parser une ligne CSV (identique à models-comparison)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result.map(field => field.replace(/^"|"$/g, '').trim())
}