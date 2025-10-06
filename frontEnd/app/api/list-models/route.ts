import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const modelsDir = path.join(process.cwd(), "..", "backEnd", "models")
    console.log("📁 Recherche dans:", modelsDir)

    // Check if directory exists
    if (!fs.existsSync(modelsDir)) {
      console.log("❌ Dossier models non trouvé")
      return NextResponse.json({
        success: true,
        models: [],
        count: 0,
        message: "Aucun modèle trouvé"
      })
    }

    // Read all files in the models directory
    const files = fs.readdirSync(modelsDir)
    console.log("📄 Fichiers trouvés:", files)

    // Filter only .pkl files
    const pklFiles = files.filter((file) => file.endsWith(".pkl"))
    const modelNames = pklFiles.map(file => file.replace('.pkl', ''))
    
    console.log("✅ Modèles PKL:", modelNames)

    return NextResponse.json({
      success: true,
      models: modelNames,
      count: modelNames.length,
      files: pklFiles
    })
  } catch (error) {
    console.error("Error listing model files:", error)
    return NextResponse.json({
      success: false,
      models: [],
      error: "Erreur lors du chargement des modèles"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { model_name, features } = await request.json()
    console.log("🎯 Prédiction demandée:", { model_name, features_length: features?.length })

    // Validation des données
    if (!model_name || !features) {
      return NextResponse.json(
        { 
          success: false,
          error: "Model name and features are required" 
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Features must be an array" 
        },
        { status: 400 }
      )
    }

    if (features.length !== 20) {
      return NextResponse.json(
        { 
          success: false,
          error: "20 features are required" 
        },
        { status: 400 }
      )
    }

    // Vérifier que le modèle existe
    const modelsDir = path.join(process.cwd(), "..", "backEnd", "models")
    const modelPath = path.join(modelsDir, `${model_name}.pkl`)

    if (!fs.existsSync(modelPath)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Model ${model_name} not found` 
        },
        { status: 404 }
      )
    }

    // Simulation de prédiction
    const mockPrediction = Math.floor(Math.random() * 3)
    const CLASS_MAPPING: { [key: number]: string } = {
      0: "Faux Positif",
      1: "Candidat", 
      2: "Exoplanète"
    }
    
    const prediction_label = CLASS_MAPPING[mockPrediction] || 'Inconnu'
    
    // Simulation de probabilités
    const baseProbabilities = [Math.random(), Math.random(), Math.random()]
    const sum = baseProbabilities.reduce((a, b) => a + b, 0)
    const probabilities = baseProbabilities.map(p => Number((p / sum).toFixed(4)))

    console.log(`Prediction for ${model_name}: ${mockPrediction} (${prediction_label})`)

    return NextResponse.json({
      success: true,
      prediction: mockPrediction,
      prediction_label,
      probabilities,
      model_used: model_name,
      features_count: features.length
    })

  } catch (error) {
    console.error("💥 Erreur globale prediction:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error during prediction" 
      },
      { status: 500 }
    )
  }
}