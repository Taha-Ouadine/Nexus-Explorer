import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { model_name, features } = body
    
    console.log("🎯 PRÉDICTION - Données reçues:", { 
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

    // ✅ ENVOYER À FASTAPI POUR LA PRÉDICTION
    console.log("🔄 Envoi à FastAPI...")
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
      const errorText = await fastApiResponse.text()
      throw new Error(`FastAPI error: ${fastApiResponse.status} - ${errorText}`)
    }

    const result = await fastApiResponse.json()
    console.log("✅ Prédiction réussie:", result.prediction_label)
    
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