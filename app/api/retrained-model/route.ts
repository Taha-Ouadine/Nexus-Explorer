import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const metricsFile = path.join(process.cwd(), "api", "metrics", "retrained_models_metrics.json")
    
    console.log("📁 Recherche métriques retrained:", metricsFile)

    if (fs.existsSync(metricsFile)) {
      const content = fs.readFileSync(metricsFile, "utf-8")
      const models = JSON.parse(content)
      
      console.log("✅ Modèles retrained chargés:", models.length)
      
      return NextResponse.json({
        success: true,
        models: models
      })
    }

    console.log("ℹ️ Aucun fichier de métriques retrained trouvé")
    return NextResponse.json({
      success: true,
      models: []
    })

  } catch (error) {
    console.error("❌ Erreur lecture modèles retrained:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lecture modèles retrained",
        models: [] 
      },
      { status: 500 }
    )
  }
}