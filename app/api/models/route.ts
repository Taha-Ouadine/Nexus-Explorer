import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const metricsFile = path.join(process.cwd(), "api", "metrics", "custom_models_metrics.json")
    const modelsDir = path.join(process.cwd(), "api", "models")
    
    console.log("📊 Recherche métriques dans:", metricsFile)
    console.log("📁 Dossier modèles:", modelsDir)

    // ✅ VÉRIFIER SI LE FICHIER JSON EXISTE
    if (!fs.existsSync(metricsFile)) {
      console.log("ℹ️ Fichier de métriques non trouvé")
      return NextResponse.json({
        success: true,
        metrics: []
      })
    }

    // ✅ LIRE LE FICHIER JSON
    const content = fs.readFileSync(metricsFile, "utf-8")
    
    if (!content.trim()) {
      console.log("ℹ️ Fichier de métriques vide")
      return NextResponse.json({
        success: true,
        metrics: []
      })
    }

    // ✅ PARSER LE JSON
    const allMetrics = JSON.parse(content)
    console.log("📋 Métriques brutes chargées:", allMetrics.length, "entrées")

    // ✅ FILTRER POUR GARDER SEULEMENT LES MODÈLES AVEC FICHIER .PKL EXISTANT
    const validMetrics = allMetrics.filter((model: any) => {
      const modelFileName = model.model_file || `${model.name || model.model_name}.pkl`
      const modelPath = path.join(modelsDir, modelFileName)
      const pklExists = fs.existsSync(modelPath)
      
      if (!pklExists) {
        console.log(`❌ Fichier manquant: ${modelFileName} pour le modèle ${model.name || model.model_name}`)
      }
      
      return pklExists
    })

    console.log("✅ Métriques valides après filtrage:", validMetrics.length, "modèles")

    // ✅ METTRE À JOUR LE FICHIER JSON SI NÉCESSAIRE
    if (validMetrics.length !== allMetrics.length) {
      console.log("🔄 Mise à jour du fichier JSON - suppression des modèles manquants")
      fs.writeFileSync(metricsFile, JSON.stringify(validMetrics, null, 2))
    }

    return NextResponse.json({
      success: true,
      metrics: validMetrics,
      original_count: allMetrics.length,
      valid_count: validMetrics.length,
      removed_count: allMetrics.length - validMetrics.length
    })

  } catch (error) {
    console.error("❌ Erreur chargement métriques:", error)
    
    return NextResponse.json({
      success: true,
      metrics: [],
      error: "Erreur lors du chargement des métriques"
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { model_name, features } = body
    
    console.log("🎯 Prédiction via /api/models - Données:", { 
      model_name, 
      features_length: features?.length 
    })

    // Validation
    if (!model_name || !features) {
      return NextResponse.json(
        { 
          success: false,
          error: "Model name and features are required" 
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(features) || features.length !== 20) {
      return NextResponse.json(
        { 
          success: false,
          error: "20 features are required" 
        },
        { status: 400 }
      )
    }

    // ✅ VÉRIFIER QUE LE MODÈLE EXISTE PHYSIQUEMENT
    const modelsDir = path.join(process.cwd(), "api", "models")
    const modelPath = path.join(modelsDir, `${model_name}.pkl`)
    
    if (!fs.existsSync(modelPath)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Modèle ${model_name} non trouvé (fichier .pkl manquant)` 
        },
        { status: 404 }
      )
    }

    // ✅ ENVOYER À FASTAPI
    const fastApiResponse = await fetch("http://localhost:8000/api/models", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: model_name,
        features: features,
      }),
    })

    console.log("📡 Statut FastAPI:", fastApiResponse.status)

    if (!fastApiResponse.ok) {
      throw new Error(`FastAPI error: ${fastApiResponse.status}`)
    }

    const result = await fastApiResponse.json()
    console.log("✅ Prédiction réussie via FastAPI")
    
    return NextResponse.json(result)

  } catch (error) {
    console.error("💥 Erreur prédiction:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur lors de la prédiction"
      },
      { status: 500 }
    )
  }
}