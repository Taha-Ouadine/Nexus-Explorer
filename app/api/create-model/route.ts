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

    // Save metrics
    const metricsDir = path.join(process.cwd(), "api", "metrics")
    const metricsFile = path.join(metricsDir, "custom_models_metrics.json")
    
    console.log("📁 Metrics directory:", metricsDir)
    console.log("📄 Metrics file:", metricsFile)
    
    // Create directory if necessary
    if (!fs.existsSync(metricsDir)) {
      console.log("📁 Creating metrics directory...")
      fs.mkdirSync(metricsDir, { recursive: true })
    }

    // Read existing metrics
    let allMetrics = []
    if (fs.existsSync(metricsFile)) {
      console.log("📖 Reading existing metrics...")
      const content = fs.readFileSync(metricsFile, "utf-8")
      allMetrics = JSON.parse(content)
      console.log("📊 Found", allMetrics.length, "existing models")
    } else {
      console.log("📄 No existing metrics file, starting fresh")
    }

    // Add the new model
    allMetrics.push(modelInfo)
    console.log("➕ Added new model, total models:", allMetrics.length)

    // Save
    console.log("💾 Saving metrics to file...")
    fs.writeFileSync(metricsFile, JSON.stringify(allMetrics, null, 2))
    console.log("✅ Metrics saved successfully")

    console.log("✅ Model created:", name)

    return NextResponse.json({
      success: true,
      model: modelInfo,
      message: `Model ${name} created successfully`
    })

  } catch (error) {
    console.error("❌ Error creating model:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error creating the model",
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
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