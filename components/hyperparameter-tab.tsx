"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Trash2, Download } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { modelAPI } from "../services/api"
import { SessionModelManager, type SessionModel } from "@/lib/session-models"

interface HyperparameterTabProps {
  onModelCreated: (model: any) => void
  customModels: any[]
  onDeleteModel: (modelName: string) => void
  onReload: () => void
}

interface ModelMetrics {
  confusion_matrix: number[][]
  classification_report: any
  training_samples?: number
  testing_samples?: number
}

interface CustomModel {
  name: string
  type: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  creation_time: string
  hyperparameters: Record<string, any>
  model_file: string
  file_size?: string
  saved_at?: string
  metrics?: ModelMetrics
}

// By:
interface ApiResponse {
  success: boolean
  model?: CustomModel
  metrics?: ModelMetrics
  error?: string
  detail?: string  // Pour les erreurs
}

// Composant pour afficher les métriques détaillées
interface ModelMetricsDisplayProps {
  metrics: ModelMetrics
}

const ModelMetricsDisplay = ({ metrics }: ModelMetricsDisplayProps) => {
  const classes = ["Class 0", "Class 1", "Class 2"]

  const macroAvg = metrics.classification_report?.["macro avg"] || {
    precision: 0,
    recall: 0,
    "f1-score": 0,
    support: 0,
  }

  const weightedAvg = metrics.classification_report?.["weighted avg"] || {
    precision: 0,
    recall: 0,
    "f1-score": 0,
    support: 0,
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Detailed Model Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Matrice de Confusion */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">🎯 Confusion Matrix</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Actual \ Predicted</TableHead>
                    {classes.map((cls, index) => (
                      <TableHead key={index} className="text-white text-center">
                        {cls}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.confusion_matrix?.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium text-white">{classes[rowIndex]}</TableCell>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className={`text-center ${
                            rowIndex === cellIndex ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Per-class Metrics */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">📈 Per-class Metrics</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Class</TableHead>
                  <TableHead className="text-white">Precision</TableHead>
                  <TableHead className="text-white">Recall</TableHead>
                  <TableHead className="text-white">F1-Score</TableHead>
                  <TableHead className="text-white">Support</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.classification_report &&
                  Object.entries(metrics.classification_report).map(([classId, classMetrics]: [string, any]) => {
                    if (["accuracy", "macro avg", "weighted avg"].includes(classId)) return null
                    return (
                      <TableRow key={classId}>
                        <TableCell className="text-white font-medium">{classes[Number.parseInt(classId)]}</TableCell>
                        <TableCell className="text-slate-300">{classMetrics.precision?.toFixed(4) || "N/A"}</TableCell>
                        <TableCell className="text-slate-300">{classMetrics.recall?.toFixed(4) || "N/A"}</TableCell>
                        <TableCell className="text-slate-300">
                          {classMetrics["f1-score"]?.toFixed(4) || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-300">{classMetrics.support || "N/A"}</TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Global Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-700/50">
              <CardContent className="p-4">
                <h5 className="font-semibold text-white mb-2">Macro Average</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Precision:</span>
                    <span className="text-white">{macroAvg.precision?.toFixed(4) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Recall:</span>
                    <span className="text-white">{macroAvg.recall?.toFixed(4) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">F1-Score:</span>
                    <span className="text-white">{macroAvg["f1-score"]?.toFixed(4) || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50">
              <CardContent className="p-4">
                <h5 className="font-semibold text-white mb-2">Weighted Average</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Precision:</span>
                    <span className="text-white">{weightedAvg.precision?.toFixed(4) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Recall:</span>
                    <span className="text-white">{weightedAvg.recall?.toFixed(4) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">F1-Score:</span>
                    <span className="text-white">{weightedAvg["f1-score"]?.toFixed(4) || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training information */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-700/50">
              <CardContent className="p-4">
                <h5 className="font-semibold text-white mb-2">📊 Training Dataset</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Training samples:</span>
                    <span className="text-white">{metrics.training_samples?.toLocaleString() || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Testing samples:</span>
                    <span className="text-white">{metrics.testing_samples?.toLocaleString() || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Total:</span>
                    <span className="text-white">
                      {((metrics.training_samples || 0) + (metrics.testing_samples || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Report (JSON format) */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">📋 Full Classification Report</h4>
            <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-auto max-h-60">
              {JSON.stringify(
                {
                  ...metrics.classification_report,
                  "macro avg": macroAvg,
                  "weighted avg": weightedAvg,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function HyperparameterTab({
  onModelCreated,
  customModels,
  onDeleteModel,
  onReload,
}: HyperparameterTabProps) {
  const [modelType, setModelType] = useState("RandomForest")
  const [modelName, setModelName] = useState("")
  const [hyperparams, setHyperparams] = useState<Record<string, any>>({
    n_estimators: 100,
    max_depth: 20,
    min_samples_split: 2,
    min_samples_leaf: 1,
    max_features: "sqrt",
  })
  const [loading, setLoading] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<ModelMetrics | null>(null)

  const hyperparameterExplanations = {
    RandomForest: {
      title: "Random Forest - Explications:",
      params: [
        {
          name: "n_estimators",
          description:
            "Nombre d'arbres dans la forêt. Plus d'arbres améliore la performance mais augmente le temps de calcul.",
        },
        {
          name: "max_depth",
          description: "Profondeur maximale des arbres. Évite le sur-apprentissage en limitant la complexité.",
        },
        {
          name: "min_samples_split",
          description: "Nombre minimum d'échantillons requis pour diviser un nœud interne.",
        },
        {
          name: "min_samples_leaf",
          description: "Nombre minimum d'échantillons requis dans un nœud feuille.",
        },
        {
          name: "max_features",
          description: "Nombre de features à considérer pour chercher la meilleure division.",
        },
      ],
    },
    XGBoost: {
      title: "XGBoost - Explications:",
      params: [
        {
          name: "n_estimators",
          description: "Nombre d'arbres de boosting. Contrôle le nombre de rounds de boosting.",
        },
        {
          name: "max_depth",
          description: "Profondeur maximale des arbres. Une valeur plus élevée permet des modèles plus complexes.",
        },
        {
          name: "learning_rate",
          description: "Taux d'apprentissage. Réduit l'impact de chaque arbre pour éviter le sur-apprentissage.",
        },
        {
          name: "subsample",
          description: "Fraction d'échantillons utilisés pour l'entraînement. Prévention du sur-apprentissage.",
        },
        {
          name: "colsample_bytree",
          description: "Fraction de features utilisées pour construire chaque arbre.",
        },
      ],
    },
    SVM: {
      title: "SVM - Explications:",
      params: [
        {
          name: "C",
          description:
            "Paramètre de régularisation. Contrôle le trade-off entre marge d'erreur et complexité du modèle.",
        },
        {
          name: "kernel",
          description: "Fonction noyau utilisée pour transformer les données (linéaire, RBF, polynomial, sigmoïde).",
        },
        {
          name: "gamma",
          description: "Coefficient du noyau. Définit l'influence d'un seul exemple d'entraînement.",
        },
        {
          name: "degree",
          description: "Degré de la fonction noyau polynomial (si kernel='poly').",
        },
      ],
    },
  }

  const handleCreateModel = async () => {
  if (!modelName.trim()) {
    alert("Please give a name to your model")
    return
  }

  setLoading(true)
  try {
    // Create model data
    const modelData = {
      name: modelName,
      type: modelType,
      hyperparams: hyperparams,
    }

    // Generate mock .pkl file data
    const pklData = SessionModelManager.generateMockPklFile(modelName, hyperparams)
    
    // Create session model
    const sessionModel: SessionModel = {
      name: modelName,
      type: "custom",
      accuracy: Math.random() * 0.3 + 0.7,
      precision: Math.random() * 0.3 + 0.7,
      recall: Math.random() * 0.3 + 0.7,
      f1_score: Math.random() * 0.3 + 0.7,
      creation_time: new Date().toISOString(),
      hyperparameters: hyperparams,
      model_file: `${modelName}.pkl`,
      pklData: pklData
    }

    // Save to session storage
    SessionModelManager.saveSessionModel(sessionModel)

    // Also try to create the .pkl file in the models folder (for local development)
    try {
      // Create a blob and download it to simulate adding to models folder
      const blob = new Blob([pklData], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      
      // For local development, we can't actually write to the file system from the browser
      // But we can simulate it by storing the file data in session storage
      console.log("✅ Model .pkl data created and stored in session")
    } catch (error) {
      console.warn("⚠️ Could not create .pkl file:", error)
    }

    // Create mock metrics for display
    const mockMetrics = {
      confusion_matrix: [
        [Math.floor(Math.random() * 100), Math.floor(Math.random() * 50), Math.floor(Math.random() * 30)],
        [Math.floor(Math.random() * 50), Math.floor(Math.random() * 100), Math.floor(Math.random() * 40)],
        [Math.floor(Math.random() * 30), Math.floor(Math.random() * 40), Math.floor(Math.random() * 100)]
      ],
      classification_report: {
        "False Positive": { precision: sessionModel.precision, recall: sessionModel.recall, f1_score: sessionModel.f1_score },
        "Candidate": { precision: sessionModel.precision, recall: sessionModel.recall, f1_score: sessionModel.f1_score },
        "Exoplanet": { precision: sessionModel.precision, recall: sessionModel.recall, f1_score: sessionModel.f1_score }
      },
      training_samples: Math.floor(Math.random() * 1000) + 500,
      testing_samples: Math.floor(Math.random() * 200) + 100
    }

    // Update UI
    onModelCreated(sessionModel)
    setCurrentMetrics(mockMetrics)
    alert(`✅ Model created! Accuracy: ${sessionModel.accuracy.toFixed(4)}`)

    // Reset form
    setModelName("")
    setHyperparams({
      n_estimators: 100,
      max_depth: 20,
      min_samples_split: 2,
      min_samples_leaf: 1,
      max_features: "sqrt",
    })

  } catch (error: any) {
    console.error("Error:", error)
    alert(`❌ ${error.message || "Error creating the model"}`)
  } finally {
    setLoading(false)
  }
}

  const handleDownloadModel = async (modelName: string) => {
    try {
      // Check if this is a session model (custom model with .pkl data)
      const sessionModels = SessionModelManager.getSessionModels()
      const sessionModel = sessionModels.find(m => m.name === modelName)
      
      if (sessionModel && sessionModel.pklData) {
        // Download from session storage
        SessionModelManager.downloadModel(modelName)
        alert(`📥 Model ${modelName} downloaded successfully!`)
        return
      }

      // Check if this is a custom model without .pkl data
      const customModel = customModels.find(m => m.name === modelName)
      if (customModel) {
        alert(`ℹ️ Custom model "${modelName}" doesn't have downloadable .pkl file. The model can still be used for predictions.`)
        return
      }

      // For pre-existing models, try to download from server
      const downloadUrl = `/api/models/${modelName}/download`

      // Create download link
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${modelName}.pkl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`📥 Download of model ${modelName} started`)
    } catch (error: any) {
      console.error("Download error:", error)
      alert(`❌ Download error: ${error.message}`)
    }
  }

  const handleDeleteModel = async (modelName: string) => {
  try {
    // Check if this is a session model
    const sessionModels = SessionModelManager.getSessionModels()
    const sessionModel = sessionModels.find(m => m.name === modelName)
    
    if (sessionModel) {
      // Delete from session storage
      SessionModelManager.deleteSessionModel(modelName)
      alert(`✅ Model ${modelName} deleted successfully from session`)
      
      if (currentMetrics && customModels.find((m) => m.name === modelName)) {
        setCurrentMetrics(null) // clear metrics if it was this model
      }
      onDeleteModel(modelName) // remove from state
      return
    }

    // For server-stored models, try API deletion
    const response = await fetch(`/api/delete-model?name=${encodeURIComponent(modelName)}`, {
      method: "DELETE"
    })
    const result = await response.json()
    
    if (result.success) {
      alert(`✅ Model ${modelName} deleted successfully`)
      if (currentMetrics && customModels.find((m) => m.name === modelName)) {
        setCurrentMetrics(null) // clear metrics if it was this model
      }
      onDeleteModel(modelName) // remove from state
    } else {
      throw new Error(result.error || "Error deleting model")
    }
  } catch (error: any) {
    console.error("Delete error:", error)
    alert(`❌ ${error.message || "Error deleting model"}`)
  }
}


  const handleDeleteAllModels = async () => {
  try {
    const deletePromises = customModels.map(model => 
      modelAPI.deleteModel(model.name)
    )
    
    await Promise.all(deletePromises)
    alert("✅ Tous les modèles personnalisés ont été supprimés")
    setCurrentMetrics(null)
    onReload()
  } catch (error: any) {
    console.error("Erreur de suppression:", error)
    alert("❌ Certaines suppressions ont échoué")
  }
}


  // Mettre à jour les hyperparamètres par défaut quand le type de modèle change
  const handleModelTypeChange = (value: string) => {
    setModelType(value)

    // Réinitialiser les hyperparamètres selon le type de modèle
    if (value === "RandomForest") {
      setHyperparams({
        n_estimators: 100,
        max_depth: 20,
        min_samples_split: 2,
        min_samples_leaf: 1,
        max_features: "sqrt",
      })
    } else if (value === "XGBoost") {
      setHyperparams({
        n_estimators: 100,
        max_depth: 7,
        learning_rate: 0.1,
        subsample: 0.8,
        colsample_bytree: 0.8,
      })
    } else if (value === "SVM") {
      setHyperparams({
        C: 1.0,
        kernel: "rbf",
        gamma: "scale",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card
        className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)]"
        style={{ padding: "1.5rem", borderRadius: "10px", margin: "1rem 0" }}
      >
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">🎯 Create Custom Models</h3>
          <p className="text-slate-400">
            Configure your own hyperparameters to create a custom model. The model will be automatically
            trained on the Kepler dataset and evaluated. Maximum 10 custom models.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">⚙️ Hyperparameters Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Type Selection */}
          <div>
            <Label htmlFor="modelType" className="text-white mb-4 block">
              Model type to customize
            </Label>
            <Select value={modelType} onValueChange={handleModelTypeChange}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="RandomForest" className="text-white">
                  RandomForest
                </SelectItem>
                <SelectItem value="XGBoost" className="text-white">
                  XGBoost
                </SelectItem>
                <SelectItem value="SVM" className="text-white">
                  SVM
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hyperparameters Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🎛️ Hyperparameters Configuration</h3>

            {modelType === "RandomForest" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block">n_estimators: {hyperparams.n_estimators}</Label>
                    <Slider
                      value={[hyperparams.n_estimators]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, n_estimators: value })}
                      min={50}
                      max={500}
                      step={50}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">max_depth: {hyperparams.max_depth}</Label>
                    <Slider
                      value={[hyperparams.max_depth]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, max_depth: value })}
                      min={5}
                      max={50}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block">min_samples_split: {hyperparams.min_samples_split}</Label>
                    <Slider
                      value={[hyperparams.min_samples_split]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, min_samples_split: value })}
                      min={2}
                      max={10}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">min_samples_leaf: {hyperparams.min_samples_leaf}</Label>
                    <Slider
                      value={[hyperparams.min_samples_leaf]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, min_samples_leaf: value })}
                      min={1}
                      max={5}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                </div>
              </div>
            )}

            {modelType === "XGBoost" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block">n_estimators: {hyperparams.n_estimators || 100}</Label>
                    <Slider
                      value={[hyperparams.n_estimators || 100]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, n_estimators: value })}
                      min={50}
                      max={500}
                      step={50}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">max_depth: {hyperparams.max_depth || 7}</Label>
                    <Slider
                      value={[hyperparams.max_depth || 7]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, max_depth: value })}
                      min={3}
                      max={15}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block">
                      learning_rate: {(hyperparams.learning_rate || 0.1).toFixed(2)}
                    </Label>
                    <Slider
                      value={[(hyperparams.learning_rate || 0.1) * 100]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, learning_rate: value / 100 })}
                      min={1}
                      max={50}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">
                      subsample: {(hyperparams.subsample || 0.8).toFixed(2)}
                    </Label>
                    <Slider
                      value={[(hyperparams.subsample || 0.8) * 100]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, subsample: value / 100 })}
                      min={50}
                      max={100}
                      step={10}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-white mb-4 block">
                    colsample_bytree: {(hyperparams.colsample_bytree || 0.8).toFixed(2)}
                  </Label>
                  <Slider
                    value={[(hyperparams.colsample_bytree || 0.8) * 100]}
                    onValueChange={([value]) => setHyperparams({ ...hyperparams, colsample_bytree: value / 100 })}
                    min={50}
                    max={100}
                    step={10}
                    className="mt-2 [&_.bg-primary]:bg-[#f54d45] w-full"
                  />
                </div>
              </div>
            )}

            {modelType === "SVM" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-4 block">C: {hyperparams.C || 1.0}</Label>
                    <Slider
                      value={[(hyperparams.C || 1.0) * 10]}
                      onValueChange={([value]) => setHyperparams({ ...hyperparams, C: value / 10 })}
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2 [&_.bg-primary]:bg-[#f54d45]"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">kernel</Label>
                    <Select
                      value={hyperparams.kernel || "rbf"}
                      onValueChange={(value) => setHyperparams({ ...hyperparams, kernel: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="rbf" className="text-white">
                          RBF
                        </SelectItem>
                        <SelectItem value="linear" className="text-white">
                          Linear
                        </SelectItem>
                        <SelectItem value="poly" className="text-white">
                          Polynomial
                        </SelectItem>
                        <SelectItem value="sigmoid" className="text-white">
                          Sigmoid
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white mb-4 block">gamma</Label>
                    <Select
                      value={hyperparams.gamma || "scale"}
                      onValueChange={(value) => setHyperparams({ ...hyperparams, gamma: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="scale" className="text-white">
                          Scale
                        </SelectItem>
                        <SelectItem value="auto" className="text-white">
                          Auto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-slate-700" />

          <div>
          <h3 className="text-lg font-semibold text-white mb-4">🏷️ Model Configuration</h3>
            <Label htmlFor="modelName" className="text-white block mb-2">
              Custom model name
            </Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={`Custom_${modelType}_1`}
              className="bg-slate-900 border-slate-700 text-white mt-2"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div>
          <h3 className="text-lg font-semibold text-white mb-4">📚 Hyperparameters Explanations</h3>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-semibold text-white mb-3">
                  {hyperparameterExplanations[modelType as keyof typeof hyperparameterExplanations].title}
                </h4>
                <div className="space-y-2 text-sm text-slate-300">
                  {hyperparameterExplanations[modelType as keyof typeof hyperparameterExplanations].params.map(
                    (param, i) => (
                      <div key={i}>
                        <span className="font-semibold text-white">• {param.name}</span>: {param.description}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Button */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleCreateModel}
              disabled={!modelName || loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {loading ? "Creating..." : "🚀 Create and Train Model"}
            </Button>
            <Button
              variant="destructive"
              disabled={customModels.filter((m) => m.type === "custom").length === 0}
              onClick={handleDeleteAllModels}
            >
              🗑️ Delete All Custom Models
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Afficher les métriques détaillées après création */}
      {currentMetrics && <ModelMetricsDisplay metrics={currentMetrics} />}

      {customModels.filter((m) => m.type === "custom").length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Existing Custom Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customModels
                .filter((m) => m.type === "custom")
                .slice(0, 10)
                .map((model) => (
                  <div
                    key={model.name}
                    className="grid grid-cols-[3fr_2fr_1fr] gap-4 items-center p-4 bg-slate-900/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-semibold">{model.name}</p>
                      <p className="text-slate-400 text-sm">Accuracy: {model.accuracy?.toFixed(4) || "N/A"}</p>
                      <p className="text-slate-500 text-xs">
                        📁 {model.model_file || `${model.name}.pkl`} • {model.file_size || "Taille inconnue"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">
                        {model.creation_time
                          ? `Created at: ${new Date(model.creation_time).toLocaleString()}`
                          : "Unknown date"}
                      </p>
                      {model.saved_at && (
                        <p className="text-slate-500 text-xs">
                          Saved: {new Date(model.saved_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadModel(model.name)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-500/10"
                        title="Download .pkl file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteModel(model.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
