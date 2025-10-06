"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload } from "lucide-react"
import { FEATURE_GROUPS, CLASS_MAPPING } from "@/lib/constants"
import ConfusionMatrixDisplay from "@/components/confusion-matrix-display"

interface PredictionTabProps {
  models: any[]
  customModels: any[]
  modelsComparison: any[]
  onPredictionComplete: (prediction: any) => void
}



export default function PredictionTab({
  models,
  customModels,
  modelsComparison,
  onPredictionComplete,
}: PredictionTabProps) {
  const [pklModels, setPklModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [features, setFeatures] = useState<Record<string, number>>({})
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModelMetrics, setSelectedModelMetrics] = useState<any>(null)

  const allModels = [...pklModels]
  
  // Debug: Log all models
  console.log("🔍 All models for prediction:", allModels)
  console.log("📋 PKL models:", pklModels)

  // ========== INITIALIZATION OF FEATURES WITH DEFAULT VALUES ==========
  useEffect(() => {
    const initialFeatures: Record<string, number> = {};
    
    Object.entries(FEATURE_GROUPS).forEach(([groupName, groupFeatures]) => {
      groupFeatures.forEach(([key, name, min, max, defaultVal]) => {
        initialFeatures[key] = defaultVal;
      });
    });
    
    setFeatures(initialFeatures);
    console.log("✅ Features initialized:", initialFeatures);
  }, []);

  useEffect(() => {
    if (selectedModel) {
      loadModelMetrics(selectedModel)
    }
  }, [selectedModel])

  // Load PKL models
  // Load PKL models - REPLACE this useEffect:
useEffect(() => {
  const loadPklModels = async () => {
    try {
      const response = await fetch("/api/list-models")
      if (response.ok) {
        const data = await response.json() // ✅ Now it's an object, not an array
        console.log("📋 Received models data:", data)
        
        if (data.success && data.models) {
          const pklModelList = data.models.map((name: string) => ({
            name: name,
            type: "pkl",
            model_file: `${name}.pkl`
          }))
          setPklModels(pklModelList)
          console.log("✅ PKL models loaded:", pklModelList)
        } else {
          console.error("❌ Unexpected response format:", data)
        }
      } else {
        console.error("❌ HTTP Error:", response.status)
      }
    } catch (error) {
      console.error("Error loading pkl files:", error)
    }
  }
  loadPklModels()
}, [])

  const loadModelMetrics = async (modelName: string) => {
  try {
    console.log("📊 Loading metrics for:", modelName)
    
    // First search in custom models
    const customModel = customModels.find((m) => m.name === modelName)
    if (customModel) {
      console.log("✅ Metrics found in customModels")
      setSelectedModelMetrics(customModel.metrics || customModel)
      return
    }

    // Search in comparison data
    const baseMetrics = modelsComparison.find((m) => m.model_name === modelName)
    if (baseMetrics) {
      console.log("✅ Metrics found in modelsComparison")
      setSelectedModelMetrics(baseMetrics)
      return
    }

    // If not found, try to load from the API
    try {
      const response = await fetch(`/api/custom-models`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.models) {
          const modelMetrics = data.models.find((m: any) => m.model_name === modelName)
          if (modelMetrics) {
            console.log("✅ Metrics loaded from API")
            setSelectedModelMetrics(modelMetrics)
            return
          }
        }
      }
    } catch (apiError) {
      console.log("ℹ️ No metrics found in the API")
    }

    console.log("❌ No metrics found for:", modelName)
    setSelectedModelMetrics(null)
    
  } catch (error) {
    console.error("Error loading model metrics:", error)
    setSelectedModelMetrics(null)
  }
}

  const handlePredict = async () => {
  setLoading(true)
  try {
    const featuresArray = Object.values(features)
    
    console.log("🚀 ===== START PREDICTION =====")
    console.log("📋 Selected model:", selectedModel)
    console.log("🔢 Sent features:", featuresArray)

    // ✅ Use Next.js API route instead of FastAPI
    const response = await fetch("/api/models", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: selectedModel,
        features: featuresArray,
      }),
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ FastAPI Error:", errorData)
      alert(`❌ Error: ${errorData.detail || "Error during prediction"}`)
      setLoading(false)
      return
    }

    const result = await response.json()
    
    console.log("✅ FastAPI response received:", result)
    
    if (result.success) {
      console.log("🔮 Prediction:", result.prediction, "->", result.prediction_label)
      console.log("📈 Probabilities:", result.probabilities)
      
      onPredictionComplete({
        model: selectedModel,
        prediction: result.prediction,
        prediction_label: result.prediction_label,
        probabilities: result.probabilities,
        features: featuresArray,
        feature_values: features,
        model_type: "Base",
        success: true
      })
    } else {
      throw new Error(result.error || "Error during prediction")
    }
    
    console.log("===== END PREDICTION =====")

  } catch (error) {
    console.error("💥 Global error:", error)
    alert(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
  } finally {
    setLoading(false)
  }
}

  const handleBatchPredict = async () => {
  if (!batchFile || !selectedModel) {
    alert("Please select a file and a model")
    return
  }

  setLoading(true)
  try {
    console.log("📦 Starting batch prediction...")
    
    const formData = new FormData()
    formData.append("file", batchFile)
    formData.append("model", selectedModel)

    const response = await fetch("/api/predict-batch", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error during batch prediction")
    }

    const result = await response.json()
    
    console.log("✅ Batch prediction succeeded:", result)
    
    if (result.success) {
      // DISPLAY STATS LIKE STREAMLIT
      const stats = result.stats
      const classDist = stats.class_distribution
      
      const message = `
✅ Batch prediction finished!

📊 Stats:
• Total processed: ${stats.total} rows
• Successful: ${stats.successful}
• Failed: ${stats.failed}

🎯 Class distribution:
• False Positive: ${classDist["Faux Positif"]}
• Candidate: ${classDist["Candidat"]} 
• Exoplanet: ${classDist["Exoplanète"]}

📥 You can download the results below.
      `
      
      alert(message)
      
      // Stocker les résultats pour affichage détaillé
      setBatchResults(result.results)
      
      // Téléchargement automatique des résultats
      downloadBatchResults(result.results, selectedModel)
    } else {
      throw new Error(result.error || "Erreur inconnue")
    }

  } catch (error) {
    console.error("❌ Batch prediction error:", error)
    alert(`❌ Error: ${error instanceof Error ? error.message : "Error during batch prediction"}`)
  } finally {
    setLoading(false)
  }
}

// Fonction améliorée pour télécharger les résultats
const downloadBatchResults = (results: any[], modelName: string) => {
  const headers = "Row,Prediction,Label,Probability_False_Positive,Probability_Candidate,Probability_Exoplanet,Max_Confidence,Most_Likely_Class\n"
  
  const csvContent = results.map(result => 
    `${result.row},${result.prediction},${result.prediction_label},${result.confidence_false_positive},${result.confidence_candidate},${result.confidence_exoplanet},${result.max_confidence},${result.most_likely_class}`
  ).join('\n')
  
  const blob = new Blob([headers + csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `predictions_${modelName}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Ajoutez cet état pour stocker les résultats batch
const [batchResults, setBatchResults] = useState<any[]>([])

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🎯 Exoplanet Prediction</CardTitle>
          <CardDescription className="text-slate-400">
            Select a model and enter features to predict
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection */}
          <div>
            <Label htmlFor="model" className="text-white mb-4">
              Choose the model for prediction
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-96">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {allModels.map((model) => (
                  <SelectItem key={model.name} value={model.name} className="text-white">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 1. Main Metrics */}
      {selectedModelMetrics && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">🎯 Main Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.accuracy || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">Precision</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.precision || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">Recall</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.recall || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">F1 Macro</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.f1_macro || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">F1 Weighted</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.f1_weighted || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">ROC AUC</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.roc_auc || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">AUC Score</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.auc_score || 0).toFixed(4)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 text-sm mb-1">Rank</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(selectedModelMetrics.rank || 0).toFixed(0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Confusion matrix analysis */}
      {selectedModelMetrics && selectedModelMetrics.confusion_matrix && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📈 Confusion Matrix Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfusionMatrixAnalysis confusionMatrix={selectedModelMetrics.confusion_matrix} />
          </CardContent>
        </Card>
      )}

      {/* 3. Confusion Matrix visualization */}
      {selectedModelMetrics && selectedModelMetrics.confusion_matrix && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">🎯 Confusion Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfusionMatrixDisplay confusionMatrix={selectedModelMetrics.confusion_matrix} modelName={selectedModel} />
          </CardContent>
        </Card>
      )}

      {/* 4. Model hyperparameters */}
      {selectedModelMetrics && selectedModelMetrics.hyperparameters && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">⚙️ Model Hyperparameters</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded-lg text-slate-300 text-sm overflow-x-auto">
              {(() => {
                try {
                  const params =
                    typeof selectedModelMetrics.hyperparameters === "string"
                      ? JSON.parse(selectedModelMetrics.hyperparameters)
                      : selectedModelMetrics.hyperparameters
                  return JSON.stringify(params, null, 2)
                } catch (error) {
                  // If parsing fails, display the raw string
                  return selectedModelMetrics.hyperparameters
                }
              })()}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Input Features</CardTitle>
          <CardDescription className="text-slate-400">
            Please enter values for exoplanet features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(FEATURE_GROUPS).map(([groupName, groupFeatures]) => (
            <Card key={groupName} className="bg-slate-900/50 border-l-4 border-purple-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">{groupName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {groupFeatures.map(([key, name, min, max, defaultVal]) => (
                    <div key={key}>
                      <Label htmlFor={key} className="text-slate-300 text-sm">
                        {name}
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        min={min}
                        max={max}
                        step={max > 10 ? 0.1 : 0.01}
                        value={features[key] || defaultVal} // ← Utilise value au lieu de defaultValue
                        onChange={(e) => setFeatures({ ...features, [key]: Number.parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={handlePredict}
            disabled={!selectedModel || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {loading ? "Prediction in progress..." : "🚀 Run Prediction"}
          </Button>
          
          {batchResults.length > 0 && (
  <Card className="bg-slate-800/50 border-slate-700 mt-6">
    <CardHeader>
      <CardTitle className="text-white">📋 Batch Prediction Results</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="bg-slate-900/50">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{batchResults.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-sm">False Positives</p>
              <p className="text-2xl font-bold text-red-400">
                {batchResults.filter(r => r.prediction_label === "Faux Positif").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-sm">Candidates</p>
              <p className="text-2xl font-bold text-yellow-400">
                {batchResults.filter(r => r.prediction_label === "Candidat").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-sm">Exoplanets</p>
              <p className="text-2xl font-bold text-green-400">
                {batchResults.filter(r => r.prediction_label === "Exoplanète").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-2 text-slate-200">Row</th>
                <th className="text-left p-2 text-slate-200">Prediction</th>
                <th className="text-left p-2 text-slate-200">Class</th>
                <th className="text-right p-2 text-slate-200">Max Confidence</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.slice(0, 10).map((result, index) => (
                <tr key={index} className="border-b border-slate-700/50">
                  <td className="p-2 text-white">{result.row}</td>
                  <td className="p-2 text-white">{result.prediction}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.prediction_label === "Exoplanète" ? "bg-green-500/20 text-green-300" :
                      result.prediction_label === "Candidat" ? "bg-yellow-500/20 text-yellow-300" :
                      "bg-red-500/20 text-red-300"
                    }`}>
                      {result.prediction_label}
                    </span>
                  </td>
                  <td className="p-2 text-right text-white">
                    {(result.max_confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {batchResults.length > 10 && (
          <p className="text-slate-400 text-sm text-center">
            Showing first 10 results of {batchResults.length}
          </p>
        )}

        <Button
          onClick={() => downloadBatchResults(batchResults, selectedModel)}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          📥 Download all results ({batchResults.length} rows)
        </Button>
      </div>
    </CardContent>
  </Card>
)}
        </CardContent>
      </Card>

      {/* Batch Prediction */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📁 Batch Prediction (CSV)</CardTitle>
          <CardDescription className="text-slate-400">
            Upload a CSV file with at least 20 feature columns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6 rounded-xl text-white my-4"
  style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }}>
            <AlertDescription className="text-white">
              <strong>Required format:</strong> CSV file with 20 feature columns in the specified order
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Button
              onClick={handleBatchPredict}
              disabled={!batchFile || !selectedModel || loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Run Batch Predictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfusionMatrixAnalysis({ confusionMatrix }: { confusionMatrix: string | number[][] }) {
  let cm: number[][]
  try {
    cm = typeof confusionMatrix === "string" ? JSON.parse(confusionMatrix) : confusionMatrix
  } catch (error) {
    return <div className="text-slate-400 p-4">Error while loading confusion matrix</div>
  }

  const classes = ["False Positive", "Candidate", "Exoplanet"]

  // Calculate metrics per class
  const calculateMetrics = () => {
    const metrics = []
    for (let i = 0; i < 3; i++) {
      const truePositive = cm[i][i]
      const falsePositive = cm.reduce((sum: number, row: number[], idx: number) => (idx !== i ? sum + row[i] : sum), 0)
      const falseNegative = cm[i].reduce((sum: number, val: number, idx: number) => (idx !== i ? sum + val : sum), 0)

      const precision = truePositive / (truePositive + falsePositive) || 0
      const recall = truePositive / (truePositive + falseNegative) || 0
      const f1Score = (2 * precision * recall) / (precision + recall) || 0

      metrics.push({ className: classes[i], precision, recall, f1Score })
    }
    return metrics
  }

  const metrics = calculateMetrics()

  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <h4 className="font-semibold text-white mb-3">{metric.className}</h4>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Precision</p>
                <p className="text-lg font-bold text-white">{metric.precision.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Recall</p>
                <p className="text-lg font-bold text-white">{metric.recall.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">F1-Score</p>
                <p className="text-lg font-bold text-white">{metric.f1Score.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}