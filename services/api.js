// src/services/api.js
// Updated to use Next.js API routes instead of FastAPI

export const modelAPI = {
  // Créer un modèle
  async createModel(modelData) {
    const response = await fetch("/api/create-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modelData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API Error");
    }
    
    return await response.json();
  },

  // Lister les modèles
  async getModels() {
    const response = await fetch("/api/models");
    return await response.json();
  },

  // Supprimer un modèle
  async deleteModel(modelName) {
    const response = await fetch(`/api/models/${modelName}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // Prédiction
  async predict(modelName, features) {
    const response = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_name: modelName, features }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Prediction Error");
    }
    
    return await response.json();
  },

  // Nouveaux endpoints pour modèles personnalisés et réentraînés
  async getCustomModels() {
    const response = await fetch("/api/custom-model");
    if (!response.ok) throw new Error("Error retrieving custom models");
    return await response.json();
  },

  async getRetrainedModels() {
    const response = await fetch("/api/retrained-model");
    if (!response.ok) throw new Error("Error retrieving retrained models");
    return await response.json();
  }
};
