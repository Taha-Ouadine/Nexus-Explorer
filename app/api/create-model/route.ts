import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { name, type, hyperparams } = await request.json()
    
    console.log("🔄 Creating model:", { name, type, hyperparams })

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 }
      )
    }

    // Simuler la création du modèle
    const modelInfo = {
      name,
      type: "custom",
      accuracy: Math.random() * 0.3 + 0.7,
      precision: Math.random() * 0.3 + 0.7,
      recall: Math.random() * 0.3 + 0.7,
      f1_score: Math.random() * 0.3 + 0.7,
      creation_time: new Date().toISOString(),
      hyperparameters: hyperparams || {},
      model_file: `${name}.pkl`
    }

    // Sauvegarder les métriques
    const metricsDir = path.join(process.cwd(), "api", "metrics")
    const metricsFile = path.join(metricsDir, "custom_models_metrics.json")
    
    // Créer le dossier si nécessaire
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true })
    }

    // Lire les métriques existantes
    let allMetrics = []
    if (fs.existsSync(metricsFile)) {
      const content = fs.readFileSync(metricsFile, "utf-8")
      allMetrics = JSON.parse(content)
    }

    // Ajouter le nouveau modèle
    allMetrics.push(modelInfo)

    // Sauvegarder
    fs.writeFileSync(metricsFile, JSON.stringify(allMetrics, null, 2))

    console.log("✅ Model created:", name)

    return NextResponse.json({
      success: true,
      model: modelInfo,
      message: `Model ${name} created successfully`
    })

  } catch (error) {
    console.error("❌ Error creating model:", error)
    return NextResponse.json(
      { success: false, error: "Error creating the model" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Read existing custom models
    const metricsFile = path.join(process.cwd(), "api", "metrics", "custom_models_metrics.json")
    
    if (fs.existsSync(metricsFile)) {
      const content = fs.readFileSync(metricsFile, "utf-8")
      const models = JSON.parse(content)
      
      return NextResponse.json({
        success: true,
        models: models
      })
    }

    return NextResponse.json({
      success: true,
      models: []
    })

  } catch (error) {
    console.error("❌ Error reading models:", error)
    return NextResponse.json(
      { success: false, error: "Error reading models", models: [] },
      { status: 500 }
    )
  }
}