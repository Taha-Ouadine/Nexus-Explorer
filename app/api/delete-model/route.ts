import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get("name")
    
    if (!modelName) {
      return NextResponse.json(
        { success: false, error: "Model name is required" },
        { status: 400 }
      )
    }

    console.log("🗑️ Deleting model:", modelName)

    // Read existing custom models
    const metricsFile = path.join(process.cwd(), "api", "metrics", "custom_models_metrics.json")
    
    if (!fs.existsSync(metricsFile)) {
      return NextResponse.json(
        { success: false, error: "No custom models found" },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(metricsFile, "utf-8")
    const allModels = JSON.parse(content)
    
    // Filter out the model to delete
    const filteredModels = allModels.filter((model: any) => model.name !== modelName)
    
    if (filteredModels.length === allModels.length) {
      return NextResponse.json(
        { success: false, error: "Model not found" },
        { status: 404 }
      )
    }

    // Save the updated list
    fs.writeFileSync(metricsFile, JSON.stringify(filteredModels, null, 2))
    
    console.log("✅ Model deleted:", modelName)

    return NextResponse.json({
      success: true,
      message: `Model ${modelName} deleted successfully`
    })

  } catch (error) {
    console.error("❌ Error deleting model:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error deleting the model"
      },
      { status: 500 }
    )
  }
}
