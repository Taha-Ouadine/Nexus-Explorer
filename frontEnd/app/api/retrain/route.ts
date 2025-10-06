// app/api/retrain/route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const modelName = formData.get("modelName") as string
    const originalModel = formData.get("originalModel") as string
    const removeDuplicates = formData.get("removeDuplicates") as string
    const removeNA = formData.get("removeNA") as string

    if (!file || !modelName || !originalModel) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants" },
        { status: 400 }
      )
    }

    // Forward to FastAPI backend
    const fastapiFormData = new FormData()
    fastapiFormData.append("file", file)
    fastapiFormData.append("modelName", modelName)
    fastapiFormData.append("originalModel", originalModel)
    fastapiFormData.append("removeDuplicates", removeDuplicates)
    fastapiFormData.append("removeNA", removeNA)

    const response = await fetch("http://localhost:8000/api/retrain", {
      method: "POST",
      body: fastapiFormData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.detail || "Erreur FastAPI" },
        { status: response.status }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("💥 Erreur réentraînement:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}