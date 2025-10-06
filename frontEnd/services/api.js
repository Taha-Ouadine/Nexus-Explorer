// src/services/api.js
const API_BASE_URL = "http://localhost:8000";

export const modelAPI = {
  // Créer un modèle
  async createModel(modelData) {
    const response = await fetch(`${API_BASE_URL}/api/create-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modelData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erreur API");
    }
    
    return await response.json();
  },

  // Lister les modèles
  async getModels() {
    const response = await fetch(`${API_BASE_URL}/api/models`);
    return await response.json();
  },

  // Supprimer un modèle
  async deleteModel(modelName) {
    const response = await fetch(`${API_BASE_URL}/api/models/${modelName}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // Prédiction
  async predict(modelName, features) {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_name: modelName, features }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erreur prédiction");
    }
    
    return await response.json();
  },

  // Nouveaux endpoints pour modèles personnalisés et réentraînés
  async getCustomModels() {
    const response = await fetch(`${API_BASE_URL}/api/custom-models`);
    if (!response.ok) throw new Error("Erreur récupération modèles personnalisés");
    return await response.json();
  },

  async getRetrainedModels() {
    const response = await fetch(`${API_BASE_URL}/api/retrained-models`);
    if (!response.ok) throw new Error("Erreur récupération modèles réentraînés");
    return await response.json();
  }
};
