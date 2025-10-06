"use client"

interface ConfusionMatrixDisplayProps {
  confusionMatrix: string | number[][]
  modelName: string
}

export default function ConfusionMatrixDisplay({ confusionMatrix, modelName }: ConfusionMatrixDisplayProps) {
  const cm = typeof confusionMatrix === "string" ? JSON.parse(confusionMatrix) : confusionMatrix
  const classes = ["Faux Positif", "Candidat", "Exoplanète"]

  // Find max value for color scaling
  const maxValue = Math.max(...cm.flat())

  // Calculate color intensity based on value (using Blues colormap like Python)
  const getColor = (value: number) => {
    const intensity = value / maxValue
    // Blues colormap: light blue to dark blue
    const r = Math.round(247 - intensity * 139)
    const g = Math.round(251 - intensity * 151)
    const b = 255
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="flex flex-col items-center">
      <div className="inline-block">
        <div className="grid grid-cols-4 gap-1">
          {/* Empty top-left corner */}
          <div />

          {/* Column headers */}
          {classes.map((className, i) => (
            <div key={`col-${i}`} className="text-center text-sm font-semibold text-white p-2">
              {className}
            </div>
          ))}

          {/* Rows with row headers */}
          {cm.map((row: number[], i: number) => (
            <div key={`row-container-${i}`} className="contents">
              {/* Row header */}
              <div
                className="text-right text-sm font-semibold text-white p-2 flex items-center justify-end"
              >
                {classes[i]}
              </div>

              {/* Matrix cells */}
              {row.map((value: number, j: number) => (
                <div
                  key={`cell-${i}-${j}`}
                  className="aspect-square flex items-center justify-center text-lg font-bold rounded"
                  style={{
                    backgroundColor: getColor(value),
                    color: value / maxValue > 0.5 ? "white" : "black",
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Axis labels */}
        <div className="mt-4 text-center">
          <p className="text-white font-semibold">Prédit</p>
        </div>
      </div>

      <div className="mt-2 -ml-12">
        <p className="text-white font-semibold transform -rotate-90 origin-center">Réel</p>
      </div>

      <p className="text-white text-lg font-semibold mt-4">Matrice de Confusion - {modelName}</p>
    </div>
  )
}