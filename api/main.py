

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np
import pickle
import os
import json
import glob
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
from datetime import datetime
from typing import Dict, List, Optional, Any
import uvicorn

# Variables globales
models_cache = {}
custom_models_cache = {}

app = FastAPI(title="NASA Exoplanet Prediction API", version="1.0.0")

# CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic
class ModelConfig(BaseModel):
    name: str
    type: str
    hyperparams: Dict[str, Any]

class PredictionRequest(BaseModel):
    model_name: str
    features: List[float]

# ==================== ROUTES API ====================

@app.get("/")
async def root():
    return {"message": "NASA Exoplanet Prediction API", "version": "1.0.0"}

@app.get("/api/list-models")
async def get_models():
    """Liste tous les modèles disponibles"""
    try:
        # Charger les modèles .pkl du dossier models/
        pkl_models = load_pkl_models()
        
        # Combiner avec les modèles en cache
        all_models = {**models_cache, **custom_models_cache, **pkl_models}
        working_models = [name for name, model in all_models.items() 
                         if model is not None and hasattr(model, 'predict')]
        
        return {
            "success": True,
            "models": working_models,
            "base_models_count": len(models_cache),
            "custom_models_count": len(custom_models_cache),
            "pkl_models_count": len(pkl_models)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/predict")
async def predict(prediction: PredictionRequest):
    """Fait une prédiction avec un modèle"""
    try:
        print("=" * 80)
        print("DEBUT DE LA PREDICTION")
        print(f"Modele demande: {prediction.model_name}")
        print(f"Nombre de features recues: {len(prediction.features)}")
        
        # Charger tous les modèles disponibles
        pkl_models = load_pkl_models()
        all_models = {**models_cache, **custom_models_cache, **pkl_models}
        print(f"Modeles disponibles: {list(all_models.keys())}")
        
        if prediction.model_name not in all_models:
            print(f"ERREUR: Modele {prediction.model_name} non trouve")
            raise HTTPException(status_code=404, detail="Modèle non trouvé")
        
        model_data = all_models[prediction.model_name]
        
        # Trouve le vrai modele dans le dict
        if isinstance(model_data, dict) and 'model' in model_data:
            real_model = model_data['model']
        else:
            real_model = model_data
        
        if len(prediction.features) != 20:
            print(f"ERREUR: Nombre de features incorrect: {len(prediction.features)} au lieu de 20")
            raise HTTPException(status_code=400, detail="20 caractéristiques requises")
        
        features_array = np.array(prediction.features).reshape(1, -1)
        
        # Prédiction
        prediction_result = real_model.predict(features_array)[0]
        print(f"Resultat prediction brute: {prediction_result}")
        
        # Probabilités
        probabilities = None
        if hasattr(real_model, 'predict_proba'):
            try:
                probabilities = real_model.predict_proba(features_array)[0].tolist()
                print("PROBABILITES DETAILLEES:")
                print(f"   Classe 0 (Faux Positif): {probabilities[0]:.4f}")
                print(f"   Classe 1 (Candidat): {probabilities[1]:.4f}")
                print(f"   Classe 2 (Exoplanete): {probabilities[2]:.4f}")
            except Exception as e:
                print(f"Erreur calcul probabilites: {e}")
                probabilities = [0.0, 0.0, 0.0]
        else:
            probabilities = [0.0, 0.0, 0.0]
        
        CLASS_MAPPING = {0: "Faux Positif", 1: "Candidat", 2: "Exoplanete"}
        prediction_label = CLASS_MAPPING.get(prediction_result, "Inconnu")
        
        print(f"Resultat final: {prediction_result} ({prediction_label})")
        print("Prediction terminee avec succes")
        print("=" * 80)
        
        return {
            "success": True,
            "prediction": int(prediction_result),
            "prediction_label": prediction_label,
            "probabilities": probabilities,
            "model_used": prediction.model_name,
            "features_used": prediction.features,
            "features_count": len(prediction.features)
        }
        
    except Exception as e:
        print(f"ERREUR lors de la prediction: {e}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/create-model")
async def create_model(config: ModelConfig):
    """Crée un nouveau modèle personnalisé"""
    try:
        print(f"🔄 Création du modèle: {config.name} ({config.type})")
        
        # Créer le modèle
        model = create_custom_model(config.type, config.hyperparams)
        if model is None:
            raise HTTPException(status_code=400, detail="Type de modèle non supporté")
        
        # Charger et préparer les données
        X_train, X_test, y_train, y_test = load_training_data()
        if X_train is None:
            raise HTTPException(status_code=500, detail="Données d'entraînement non disponibles")
        
        # Entraîner et évaluer
        metrics = train_and_evaluate_model(model, X_train, X_test, y_train, y_test)
        if not metrics:
            raise HTTPException(status_code=500, detail="Erreur lors de l'entraînement")
        
        # Sauvegarder le modèle
        model_path = f"models/{config.name}.pkl"
        os.makedirs("models", exist_ok=True)
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Sauvegarder les métriques
        save_success = save_custom_model_metrics(config.name, metrics, config.hyperparams)
        
        # Mettre à jour le cache
        custom_models_cache[config.name] = model
        
        # Réponse
        response = {
            "success": True,
            "model": {
                "name": config.name,
                "type": "custom",
                "accuracy": metrics['accuracy'],
                "precision": metrics['precision'],
                "recall": metrics['recall'],
                "f1_score": metrics['f1_weighted'],
                "creation_time": datetime.now().isoformat(),
                "hyperparameters": config.hyperparams,
                "model_file": f"{config.name}.pkl"
            },
            "metrics": {
                "confusion_matrix": metrics['confusion_matrix'],
                "classification_report": metrics['classification_report'],
                "training_samples": len(X_train),
                "testing_samples": len(X_test)
            }
        }
        
        print(f"✅ Modèle {config.name} créé avec accuracy: {metrics['accuracy']:.4f}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.delete("/api/models/{model_name}")
async def delete_model(model_name: str):
    """Supprime un modèle personnalisé"""
    try:
        metrics_file = 'metrics/custom_models_metrics.json'
        models_path = 'models'

        # Supprimer le fichier .pkl
        model_file_path = os.path.join(models_path, f"{model_name}.pkl")
        if os.path.exists(model_file_path):
            os.remove(model_file_path)
            print(f"✅ Fichier modèle supprimé: {model_file_path}")
        else:
            print(f"⚠️ Fichier modèle non trouvé: {model_file_path}")

        # Mettre à jour le cache
        custom_models_cache.pop(model_name, None)

        # ✅ NETTOYER LE JSON APRÈS SUPPRESSION
        clean_metrics_json()

        return {
            "success": True, 
            "detail": f"Model {model_name} deleted successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur suppression modèle: {str(e)}")

@app.get("/api/custom-models")
async def get_custom_models():
    """Retourne les modèles personnalisés"""
    try:
        # ✅ NETTOYER AVANT DE RETOURNER LES DONNÉES
        valid_metrics = clean_metrics_json()
        
        if valid_metrics is not None:
            return {"success": True, "models": valid_metrics}
        
        # Fallback si le nettoyage échoue
        metrics_file = "metrics/custom_models_metrics.json"


        if os.path.exists(metrics_file):
            with open(metrics_file, "r") as f:
                data = json.load(f)
            return {"success": True, "models": data}
        
        return {"success": True, "models": []}
        
    except Exception as e:
        return {"success": True, "models": []}
@app.get("/api/retrained-models")
async def get_retrained_models():
    """Retourne les modèles réentraînés"""
    metrics_file = "metrics/retrained_models_metrics.json"
    if os.path.exists(metrics_file):
        with open(metrics_file, "r") as f:
            data = json.load(f)
        return {"success": True, "models": data}
    return {"success": True, "models": []}

# Ajoutez cette route dans votre main.py
@app.post("/api/retrain")
async def retrain_model(request: dict):
    """Réentraîne un modèle avec de nouvelles données"""
    try:
        original_model_name = request.get('original_model')
        new_data = request.get('new_data', [])
        new_model_name = request.get('model_name')
        options = request.get('options', {})
        
        print(f"🔄 Réentraînement de {original_model_name} vers {new_model_name}")
        print(f"📊 Nouvelles données: {len(new_data)} lignes")
        
        # Charger le modèle original
        pkl_models = load_pkl_models()
        all_models = {**models_cache, **custom_models_cache, **pkl_models}
        
        if original_model_name not in all_models:
            raise HTTPException(status_code=404, detail="Modèle original non trouvé")
        
        original_model = all_models[original_model_name]
        
        # Convertir les nouvelles données en DataFrame
        import pandas as pd
        new_df = pd.DataFrame(new_data)
        
        # Charger le dataset original
        original_df = pd.read_csv('data/kepler_preprocessed.csv')
        
        # Fusionner les datasets
        merged_df = pd.concat([original_df, new_df], ignore_index=True)
        
        # Nettoyer selon les options
        if options.get('remove_duplicates', True):
            before_dedup = len(merged_df)
            merged_df = merged_df.drop_duplicates()
            duplicates_removed = before_dedup - len(merged_df)
            print(f"🧹 Doublons supprimés: {duplicates_removed}")
        
        if options.get('remove_na', True):
            before_na = len(merged_df)
            merged_df = merged_df.dropna()
            na_removed = before_na - len(merged_df)
            print(f"🧹 NA supprimés: {na_removed}")
        
        # Préparer les données pour l'entraînement
        X = merged_df.iloc[:, :-1].values
        y = merged_df.iloc[:, -1].values
        
        # Split train-test
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Réentraîner le modèle
        print("🎯 Réentraînement du modèle...")
        original_model.fit(X_train, y_train)
        
        # Évaluation
        y_pred = original_model.predict(X_test)
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
        
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        cm = confusion_matrix(y_test, y_pred)
        
        metrics = {
            'accuracy': accuracy,
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_weighted': report['weighted avg']['f1-score'],
            'f1_macro': report['macro avg']['f1-score'],
            'confusion_matrix': cm.tolist(),
            'training_samples': len(X_train),
            'testing_samples': len(X_test)
        }
        
        # Sauvegarder le nouveau modèle
        model_path = f"models/{new_model_name}.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(original_model, f)
        
        # Sauvegarder les métriques
        retrained_metrics_file = 'metrics/retrained_models_metrics.json'
        if os.path.exists(retrained_metrics_file):
            with open(retrained_metrics_file, 'r') as f:
                all_metrics = json.load(f)
        else:
            all_metrics = []
        
        model_metrics = {
            'model_name': new_model_name,
            'original_model': original_model_name,
            **metrics,
            'dataset_stats': {
                'original_size': len(merged_df),
                'final_size': len(merged_df)
            },
            'retrain_time': datetime.now().isoformat()
        }
        
        all_metrics.append(model_metrics)
        
        with open(retrained_metrics_file, 'w') as f:
            json.dump(all_metrics, f, indent=2)
        
        print(f"✅ Réentraînement terminé - Accuracy: {accuracy:.4f}")
        
        return {
            "success": True,
            "metrics": metrics,
            "model_saved": new_model_name
        }
        
    except Exception as e:
        print(f"❌ Erreur réentraînement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur réentraînement: {str(e)}")

# ==================== FONCTIONS UTILITAIRES ====================

def load_pkl_models():
    """Charge tous les modèles .pkl du dossier models/"""
    pkl_models = {}
    models_dir = "models"
    
    if os.path.exists(models_dir):
        for file in os.listdir(models_dir):
            if file.endswith('.pkl'):
                try:
                    model_name = file.replace('.pkl', '')
                    with open(f"{models_dir}/{file}", 'rb') as f:
                        model = pickle.load(f)
                    pkl_models[model_name] = model
                    print(f"✅ Modèle PKL chargé: {model_name}")
                except Exception as e:
                    print(f"❌ Erreur chargement {file}: {e}")
    else:
        print("📁 Aucun dossier 'models' trouvé")
    
    return pkl_models

def create_custom_model(model_type: str, hyperparams: Dict[str, Any]):
    try:
        if model_type == "RandomForest":
            return RandomForestClassifier(
                n_estimators=hyperparams.get('n_estimators', 100),
                max_depth=hyperparams.get('max_depth', None),
                random_state=42
            )
        elif model_type == "XGBoost":
            return XGBClassifier(
                n_estimators=hyperparams.get('n_estimators', 100),
                max_depth=hyperparams.get('max_depth', 6),
                random_state=42
            )
        elif model_type == "SVM":
            return SVC(
                C=hyperparams.get('C', 1.0),
                kernel=hyperparams.get('kernel', 'rbf'),
                probability=True,
                random_state=42
            )
        return None
    except Exception as e:
        print(f"❌ Erreur création modèle: {e}")
        return None

def load_training_data():
    try:
        df = pd.read_csv('data/kepler_preprocessed.csv')
        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        return X_train, X_test, y_train, y_test
    except Exception as e:
        print(f"❌ Erreur chargement données: {e}")
        return None, None, None, None

def train_and_evaluate_model(model, X_train, X_test, y_train, y_test):
    try:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        cm = confusion_matrix(y_test, y_pred)
        
        return {
            'accuracy': accuracy,
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_weighted': report['weighted avg']['f1-score'],
            'f1_macro': report['macro avg']['f1-score'],
            'confusion_matrix': cm.tolist(),
            'classification_report': report
        }
    except Exception as e:
        print(f"❌ Erreur entraînement: {e}")
        return None

def save_custom_model_metrics(model_name: str, metrics: Dict, hyperparams: Dict) -> bool:
    try:
        os.makedirs("metrics", exist_ok=True)
        metrics_file = 'metrics/custom_models_metrics.json'
        
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                all_metrics = json.load(f)
        else:
            all_metrics = []
        
        model_metrics = {
            'model_name': model_name,
            **metrics,
            'hyperparameters': hyperparams,
            'creation_time': datetime.now().isoformat()
        }
        
        all_metrics.append(model_metrics)
        
        with open(metrics_file, 'w') as f:
            json.dump(all_metrics, f, indent=2)
        
        return True
    except Exception as e:
        print(f"❌ Erreur sauvegarde métriques: {e}")
        return False

def create_mock_models():
    """Crée des modèles mock pour le test"""
    try:
        # Mock XGBoost
        xgb_model = XGBClassifier(n_estimators=10, random_state=42)
        X_dummy = np.random.rand(100, 20)
        y_dummy = np.random.randint(0, 3, 100)
        xgb_model.fit(X_dummy, y_dummy)
        models_cache["XGBoost_top1"] = xgb_model
        
        # Mock RandomForest
        rf_model = RandomForestClassifier(n_estimators=10, random_state=42)
        rf_model.fit(X_dummy, y_dummy)
        models_cache["RandomForest_top1"] = rf_model
        
        print("✅ Modèles mock créés avec succès")
    except Exception as e:
        print(f"❌ Erreur création modèles mock: {e}")

# Initialisation
@app.on_event("startup")
async def startup_event():
    print("🚀 NASA Exoplanet API démarrée")
    print("📊 Chargement des modèles existants...")
    create_mock_models()  # Créer les modèles de base
    load_pkl_models()     # Charger les modèles .pkl

def clean_metrics_json():
    """Nettoie le fichier JSON des modèles qui n'ont plus de fichier .pkl"""
    try:
        metrics_file = 'metrics/custom_models_metrics.json'
        models_dir = 'models'
        
        if not os.path.exists(metrics_file):
            return
        
        with open(metrics_file, 'r') as f:
            all_metrics = json.load(f)
        
        # Filtrer pour garder seulement les modèles avec fichier .pkl existant
        valid_metrics = []
        removed_count = 0
        
        for model in all_metrics:
            model_name = model.get('model_name')
            model_file = model.get('model_file', f"{model_name}.pkl")
            model_path = os.path.join(models_dir, model_file)
            
            if os.path.exists(model_path):
                valid_metrics.append(model)
            else:
                print(f"🧹 Suppression du modèle {model_name} - fichier .pkl manquant")
                removed_count += 1
        
        # Mettre à jour le fichier si nécessaire
        if removed_count > 0:
            with open(metrics_file, 'w') as f:
                json.dump(valid_metrics, f, indent=2)
            print(f"✅ Fichier JSON nettoyé: {removed_count} modèles supprimés")
            
        return valid_metrics
        
    except Exception as e:
        print(f"❌ Erreur nettoyage JSON: {e}")
        return None

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)