from flask import Flask, request, jsonify
import pandas as pd
import joblib
import os
import json

app = Flask(__name__)

# Load models
models = {}
model_paths = {
    'KNN': 'models/KNN_top1.pkl',
    'RandomForest': 'models/RandomForest_top1.pkl',
    'SVM': 'models/SVM_top1.pkl',
    'XGBoost': 'models/XGBoost_top1.pkl',
    'LogisticRegression': 'models/LogisticRegression_top1.pkl'
}

def load_models():
    """Load all available models"""
    for name, path in model_paths.items():
        try:
            if os.path.exists(path):
                models[name] = joblib.load(path)
                print(f"Loaded {name} model successfully")
        except Exception as e:
            print(f"Error loading {name} model: {e}")

# Load models on startup
load_models()

@app.route('/api/predict', methods=['POST'])
def predict():
    """Make predictions using the selected model"""
    try:
        data = request.get_json()
        model_name = data.get('model', 'KNN')
        features = data.get('features', [])
        
        if model_name not in models:
            return jsonify({'error': f'Model {model_name} not found'}), 400
        
        # Convert features to DataFrame
        df = pd.DataFrame([features])
        
        # Make prediction
        prediction = models[model_name].predict(df)
        probability = models[model_name].predict_proba(df)
        
        return jsonify({
            'prediction': prediction[0],
            'probability': probability[0].tolist(),
            'model_used': model_name
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'models': list(models.keys()),
        'status': 'success'
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(models),
        'available_models': list(models.keys())
    })

if __name__ == '__main__':
    app.run(debug=True)
