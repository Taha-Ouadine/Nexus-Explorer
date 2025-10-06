# test_models.py
import pandas as pd
import numpy as np
import pickle
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
from datetime import datetime
from typing import Dict, List, Optional, Any

# Variables globales
models_cache = {}
custom_models_cache = {}

def load_existing_models():
    """Charge les modèles .pkl existants"""
    print("Chargement des modèles existants...")
    
    if os.path.exists("models"):
        all_files = os.listdir("models")
        pkl_files = [f for f in all_files if f.endswith('.pkl')]
        
        print(f"Fichiers .pkl trouves: {pkl_files}")
        
        for file in pkl_files:
            print(f"\nTraitement de: {file}")
            try:
                model_name = file.replace('.pkl', '')
                with open(f"models/{file}", 'rb') as f:
                    model = pickle.load(f)
                
                custom_models_cache[model_name] = model
                print(f"SUCCES - Modele charge: {model_name}")
                print(f"   Type: {type(model)}")
                print(f"   Methodes predict: {[m for m in dir(model) if 'predict' in m]}")
                
                # Test rapide du modele
                if hasattr(model, 'predict'):
                    test_features = [[0.1] * 20]  # 20 features de test
                    try:
                        prediction = model.predict(test_features)
                        print(f"   Test prediction: {prediction[0]}")
                        
                        if hasattr(model, 'predict_proba'):
                            probabilities = model.predict_proba(test_features)
                            print(f"   Test probabilites: {probabilities[0]}")
                    except Exception as e:
                        print(f"   Erreur test prediction: {e}")
                
            except Exception as e:
                print(f"ECHEC - Erreur avec {file}: {e}")
                import traceback
                print(f"   Stack trace: {traceback.format_exc()}")
    else:
        print("Dossier 'models/' n'existe pas")

def test_prediction(model_name, features):
    """Teste une prediction avec un modele specifique"""
    print(f"\n" + "="*60)
    print(f"TEST PREDICTION")
    print(f"Modele demande: {model_name}")
    print(f"Nombre de features: {len(features)}")
    print(f"Features: {features}")
    
    all_models = {**models_cache, **custom_models_cache}
    print(f"Modeles disponibles: {list(all_models.keys())}")
    
    if model_name not in all_models:
        print(f"ERREUR: Modele {model_name} non trouve")
        return None
    
    model_data = all_models[model_name]
    print(f"Type des donnees du modele: {type(model_data)}")
    
    # Trouve le vrai modele
    if isinstance(model_data, dict) and 'model' in model_data:
        real_model = model_data['model']
        print("Utilisation du vrai modele depuis le dict")
    else:
        real_model = model_data
        print("Utilisation du modele direct")
    
    print(f"Type du modele reel: {type(real_model)}")
    
    if len(features) != 20:
        print(f"ERREUR: Nombre de features incorrect: {len(features)} au lieu de 20")
        return None
    
    features_array = np.array(features).reshape(1, -1)
    print(f"Features transformees en array: shape {features_array.shape}")
    
    # Utilise le vrai modele
    print("Lancement de la prediction...")
    prediction_result = real_model.predict(features_array)[0]
    print(f"Resultat prediction brute: {prediction_result}")
    
    probabilities = None
    if hasattr(real_model, 'predict_proba'):
        try:
            print("Calcul des probabilites...")
            probabilities = real_model.predict_proba(features_array)[0].tolist()
            print("PROBABILITES DETAILLEES:")
            print(f"   Classe 0 (Faux Positif): {probabilities[0]:.4f} ({probabilities[0]*100:.2f}%)")
            print(f"   Classe 1 (Candidat): {probabilities[1]:.4f} ({probabilities[1]*100:.2f}%)")
            print(f"   Classe 2 (Exoplanete): {probabilities[2]:.4f} ({probabilities[2]*100:.2f}%)")
            print(f"   Somme des probabilites: {sum(probabilities):.6f}")
        except Exception as e:
            print(f"Erreur calcul probabilites: {e}")
            probabilities = [0.0, 0.0, 0.0]
    else:
        print("Methode predict_proba non disponible pour ce modele")
        probabilities = [0.0, 0.0, 0.0]
    
    CLASS_MAPPING = {0: "Faux Positif", 1: "Candidat", 2: "Exoplanete"}
    prediction_label = CLASS_MAPPING.get(prediction_result, "Inconnu")
    
    print(f"Resultat final: {prediction_result} ({prediction_label})")
    print(f"Probabilites retournees: {probabilities}")
    print("Prediction terminee avec succes")
    
    return {
        "prediction": int(prediction_result),
        "prediction_label": prediction_label,
        "probabilities": probabilities,
        "model_used": model_name
    }

def main():
    """Fonction principale pour tester les modeles"""
    print("DEBUT DU TEST DES MODELES")
    print("=" * 60)
    
    # Charger tous les modeles
    load_existing_models()
    
    print("\n" + "="*60)
    print("RESUME DES MODELES CHARGES:")
    all_models = {**models_cache, **custom_models_cache}
    for name, model in all_models.items():
        print(f"- {name}: {type(model)}")
    
    # Tester une prediction avec chaque modele
    if all_models:
        print("\n" + "="*60)
        print("TEST DES PREDICTIONS AVEC CHAQUE MODELE")
        
        # Features de test
        test_features = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
                        1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]
        
        for model_name in all_models.keys():
            result = test_prediction(model_name, test_features)
            if result:
                print(f"\nRESULTAT POUR {model_name}:")
                print(f"  Prediction: {result['prediction']} ({result['prediction_label']})")
                print(f"  Probabilites: {result['probabilities']}")
            print("-" * 40)
    else:
        print("Aucun modele charge pour tester")

if __name__ == "__main__":
    main()