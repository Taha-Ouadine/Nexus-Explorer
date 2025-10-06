"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import ConfusionMatrixDisplay from "@/components/confusion-matrix-display"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

interface ModelsTabProps {
  models: any[]
  customModels: any[]
  modelsComparison: any[]
}

export default function ModelsTab({ models, customModels, modelsComparison }: ModelsTabProps) {
  const [selectedModel, setSelectedModel] = useState("")
  const [csvComparisonData, setCsvComparisonData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const allModels = [...models, ...customModels]

  // Load CSV data
  useEffect(() => {
    const loadCsvData = async () => {
      setLoading(true)
      try {
        console.log("🔄 Loading CSV data...")
        const response = await fetch("/api/models-comparison")
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.models.length > 0) {
            console.log("✅ CSV data loaded:", data.models.length, "models")
            setCsvComparisonData(data.models)
          } else {
            console.log("ℹ️ No CSV data available, using default data")
          }
        }
      } catch (error) {
        console.error("❌ CSV loading error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCsvData()
  }, [])

  // Utiliser les données CSV si disponibles, sinon les données props
  const comparisonData = csvComparisonData.length > 0 ? csvComparisonData : modelsComparison

  const chartData = comparisonData.slice(0, 10).map((m) => ({
    name: m.model_name,
    accuracy: Number.parseFloat(m.accuracy || 0),
    f1_macro: Number.parseFloat(m.f1_macro || 0),
    precision: Number.parseFloat(m.precision || 0),
    recall: Number.parseFloat(m.recall || 0),
  }))

  const selectedModelData = comparisonData.find((m) => m.model_name === selectedModel)

  // Safe JSON parsing function
  const safeJsonParse = (jsonString: string) => {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn("Failed to parse hyperparameters JSON:", jsonString, error)
      return jsonString
    }
  }

  // Format hyperparameters for display
  const formatHyperparameters = (hyperparams: any) => {
    if (typeof hyperparams === "string") {
      const parsed = safeJsonParse(hyperparams)
      return parsed
    }
    return hyperparams
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Model Comparison</CardTitle>
          <div className="text-slate-400 text-sm">
            {loading ? "Loading CSV data..." : `Source: ${csvComparisonData.length > 0 ? "CSV" : "API"}`}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The rest of your existing code remains exactly the same */}
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-2 text-slate-200">Model</th>
                  <th className="text-right p-2 text-slate-200">Accuracy</th>
                  <th className="text-right p-2 text-slate-200">Precision</th>
                  <th className="text-right p-2 text-slate-200">Recall</th>
                  <th className="text-right p-2 text-slate-200">F1 Macro</th>
                  <th className="text-right p-2 text-slate-200">F1 Weighted</th>
                  <th className="text-right p-2 text-slate-200">ROC AUC</th>
                  <th className="text-right p-2 text-slate-200">Rank</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.slice(0, 15).map((model, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-2 text-white">{model.model_name}</td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.accuracy || 0).toFixed(4)}</td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.precision || 0).toFixed(4)}</td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.recall || 0).toFixed(4)}</td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.f1_macro || 0).toFixed(4)}</td>
                    <td className="p-2 text-right text-white">
                      {Number.parseFloat(model.f1_weighted || 0).toFixed(4)}
                    </td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.roc_auc || 0).toFixed(4)}</td>
                    <td className="p-2 text-right text-white">{Number.parseFloat(model.rank || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">📈 Comparison Charts</h3>
            {loading ? (
              <div className="text-center text-slate-400 py-8">Loading CSV data...</div>
            ) : chartData.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No comparison data available.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-4 text-center">Accuracy Comparison by Model</h4>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 120, right: 20, top: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis type="number" stroke="#94a3b8" domain={[0, 1]} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="accuracy" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-4 text-center">F1-Score Comparison by Model</h4>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 120, right: 20, top: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis type="number" stroke="#94a3b8" domain={[0, 1]} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="f1_macro" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* The rest of your existing code remains unchanged */}
      {/* Detailed Model Analysis */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🔍 Detailed Analysis by Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Choose a model to view details" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {comparisonData.map((model) => (
                <SelectItem key={model.model_name} value={model.model_name} className="text-white">
                  {model.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedModelData && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.accuracy || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">Precision</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.precision || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">Recall</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.recall || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">F1 Macro</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.f1_macro || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">F1 Weighted</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.f1_weighted || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">ROC AUC</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.roc_auc || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">AUC Score</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.auc_score || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">Rang</p>
                    <p className="text-2xl font-bold text-white">
                      {Number.parseFloat(selectedModelData.rank || 0).toFixed(4)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Confusion Matrix */}
              {selectedModelData.confusion_matrix && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">📈 Confusion Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConfusionMatrixDisplay
                      confusionMatrix={selectedModelData.confusion_matrix}
                      modelName={selectedModel}
                    />
                  </CardContent>
                </Card>
              )}

              {selectedModelData.hyperparameters && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">⚙️ Hyperparameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-800 p-4 rounded-lg text-slate-300 text-sm overflow-x-auto">
                      {JSON.stringify(
                        formatHyperparameters(selectedModelData.hyperparameters),
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🔧 Loaded Models Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-slate-400 text-sm mb-1">Models loaded successfully</p>
                <p className="text-3xl font-bold text-green-400">{models.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-slate-400 text-sm mb-1">Models with probabilities</p>
                <p className="text-3xl font-bold text-blue-400">{models.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-slate-400 text-sm mb-1">Custom models</p>
                <p className="text-3xl font-bold text-purple-400">{customModels.length}</p>
              </CardContent>
            </Card>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors">
              <ChevronDown className="h-4 w-4" />
              <span className="font-semibold">📋 Model diagnostics details</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-2">
              {allModels.map((model) => (
                <div key={model.name} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-white font-medium">{model.name}</span>
                    <span className="text-slate-400 text-sm">- {model.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Probabilities:</span>
                    <span className="text-green-400">✅</span>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}