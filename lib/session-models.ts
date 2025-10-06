// Session-based model storage for browser-side model management

export interface SessionModel {
  name: string
  type: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  creation_time: string
  hyperparameters: Record<string, any>
  model_file: string
  pklData?: ArrayBuffer // Store the actual .pkl file data
}

const SESSION_MODELS_KEY = 'nexus_explorers_session_models'

export class SessionModelManager {
  // Get all session models
  static getSessionModels(): SessionModel[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(SESSION_MODELS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading session models:', error)
      return []
    }
  }

  // Save a model to session storage
  static saveSessionModel(model: SessionModel): void {
    if (typeof window === 'undefined') return
    
    try {
      const existingModels = this.getSessionModels()
      const updatedModels = existingModels.filter(m => m.name !== model.name)
      updatedModels.push(model)
      
      localStorage.setItem(SESSION_MODELS_KEY, JSON.stringify(updatedModels))
      console.log('✅ Model saved to session:', model.name)
    } catch (error) {
      console.error('Error saving session model:', error)
    }
  }

  // Delete a model from session storage
  static deleteSessionModel(modelName: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const existingModels = this.getSessionModels()
      const updatedModels = existingModels.filter(m => m.name !== modelName)
      
      localStorage.setItem(SESSION_MODELS_KEY, JSON.stringify(updatedModels))
      console.log('✅ Model deleted from session:', modelName)
    } catch (error) {
      console.error('Error deleting session model:', error)
    }
  }

  // Generate a mock .pkl file for a model
  static generateMockPklFile(modelName: string, hyperparams: Record<string, any>): ArrayBuffer {
    // Create a mock .pkl file structure
    const mockData = {
      model_name: modelName,
      model_type: 'sklearn_model',
      hyperparameters: hyperparams,
      created_at: new Date().toISOString(),
      version: '1.0.0',
      // Add some mock model data
      coefficients: Array.from({length: 20}, () => Math.random()),
      intercept: Math.random(),
      feature_names: Array.from({length: 20}, (_, i) => `feature_${i}`)
    }
    
    // Convert to a binary-like format (simulating .pkl)
    const jsonString = JSON.stringify(mockData)
    const encoder = new TextEncoder()
    return encoder.encode(jsonString).buffer
  }

  // Get model .pkl data for download
  static getModelPklData(modelName: string): ArrayBuffer | null {
    const models = this.getSessionModels()
    const model = models.find(m => m.name === modelName)
    return model?.pklData || null
  }

  // Create a downloadable blob from model data
  static createDownloadableBlob(modelName: string): Blob | null {
    const pklData = this.getModelPklData(modelName)
    if (!pklData) return null
    
    return new Blob([pklData], { type: 'application/octet-stream' })
  }

  // Download model file
  static downloadModel(modelName: string): void {
    const blob = this.createDownloadableBlob(modelName)
    if (!blob) {
      alert(`❌ Model ${modelName} not found in session`)
      return
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${modelName}.pkl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('📥 Model downloaded:', modelName)
  }
}
