import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(
  request: Request,
  { params }: { params: { modelName: string } }
) {
  try {
    const { modelName } = params
    
    console.log("📥 Download request for model:", modelName)
    
    // Check if the model file exists
    const modelPath = path.join(process.cwd(), "api", "models", `${modelName}.pkl`)
    
    if (!fs.existsSync(modelPath)) {
      console.log("❌ Model file not found:", modelPath)
      return NextResponse.json(
        { 
          success: false, 
          error: `Model ${modelName} not found (file .pkl missing)` 
        },
        { status: 404 }
      )
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(modelPath)
    
    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${modelName}.pkl"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
    
  } catch (error) {
    console.error("❌ Error downloading model:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error downloading model"
      },
      { status: 500 }
    )
  }
}
