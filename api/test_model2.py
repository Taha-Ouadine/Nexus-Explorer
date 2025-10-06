import requests
import json

url = "http://localhost:8000/api/models"
data = {
    "model_name": "XGBoost_top1",
    "features": [0.5, 0.15, 0.3, 1.3, 2, 0.5, 0, 0, 0, 0.1, 
                 0.01, 0.01, 10.5, 500, 0.5, 0.01, 50, 50, 0.1, 1]
}

response = requests.post(url, json=data)
print("Status:", response.status_code)
print("Response:", response.json())