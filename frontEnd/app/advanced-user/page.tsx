"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import PredictionTab from "@/components/prediction-tab"
import ResultsTab from "@/components/results-tab"
import ModelsTab from "@/components/models-tab"
import HyperparameterTab from "@/components/hyperparameter-tab"
import { modelAPI } from "@/services/api"; 

export default function ExoplanetPrediction() {
  const [lastPrediction, setLastPrediction] = useState<any>(null)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [customModels, setCustomModels] = useState<any[]>([])
  const [modelsComparison, setModelsComparison] = useState<any[]>([])

  useEffect(() => {
    loadModelsData()
  }, [])
// make sure the path is correct

const loadModelsData = async () => {
  try {
    // Load models comparison from CSV (keep as is)
    const comparisonRes = await fetch("/models/models_comparison.csv")
    const comparisonText = await comparisonRes.text()
    const comparisonData = parseCSV(comparisonText)
    setModelsComparison(comparisonData)

    // Base models
    const baseModels = comparisonData.map((row: any) => ({
      name: row.model_name,
      type: "base",
      accuracy: Number.parseFloat(row.accuracy),
      metrics: row,
    }))
    setModels(baseModels)

    // Custom models from backend API
    // Custom models from backend API
    const customDataRes = await modelAPI.getCustomModels()
    if (customDataRes.success) {
      const customModelsList = customDataRes.models.map((m: any) => ({
        name: m.model_name,
        type: "custom",
        accuracy: m.accuracy,
        metrics: m,
      }))
      setCustomModels(customModelsList)
    }

  } catch (error) {
    console.error("[v0] Error loading models data:", error)
  }
}


  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    return lines.slice(1).map((line) => {
      const values: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"' && nextChar === '"' && inQuotes) {
          // This is an escaped quote (""), add a single quote to current
          current += '"'
          i++ // Skip the next quote
        } else if (char === '"') {
          // This is a field delimiter quote, toggle inQuotes
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          // Field separator
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Push the last value

      const obj: any = {}
      headers.forEach((header, i) => {
        obj[header] = values[i] || ""
      })
      return obj
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-2xl shadow-2xl mb-8">
              <h1 className="text-4xl font-bold text-center mb-2">🚀 NASA Exoplanet Prediction</h1>
              <p className="text-center text-lg opacity-90">
                Plateforme avancée d'analyse et de prédiction d'exoplanètes
              </p>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="prediction" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800/50 p-2 rounded-lg">
                <TabsTrigger
                  value="prediction"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
                >
                  🎯 Prédiction
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
                >
                  📊 Résultat & Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="models"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
                >
                  📈 Modèles & Métriques
                </TabsTrigger>
                <TabsTrigger
                  value="hyperparameter"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
                >
                  ⚙️ Hyperparameter Tuning
                </TabsTrigger>
              
              </TabsList>

              <TabsContent value="prediction">
                <PredictionTab
                  models={models}
                  customModels={customModels}
                  modelsComparison={modelsComparison}
                  onPredictionComplete={(prediction) => {
                    setLastPrediction(prediction)
                    setFeedbackGiven(false)
                  }}
                />
              </TabsContent>

              <TabsContent value="results">
                <ResultsTab
                  lastPrediction={lastPrediction}
                  feedbackGiven={feedbackGiven}
                  onFeedbackGiven={() => setFeedbackGiven(true)}
                />
              </TabsContent>

              <TabsContent value="models">
                <ModelsTab models={models} customModels={customModels} modelsComparison={modelsComparison} />
              </TabsContent>

              <TabsContent value="hyperparameter">
                <HyperparameterTab
                  onModelCreated={(model) => {
                    setCustomModels([...customModels, model])
                  }}
                  customModels={customModels}
                  onDeleteModel={(modelName) => {
                    setCustomModels(customModels.filter((m) => m.name !== modelName))
                  }}
                  onReload={loadModelsData}
                />
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
