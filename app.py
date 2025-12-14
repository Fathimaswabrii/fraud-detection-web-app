from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import json
import os
from datetime import datetime
import pandas as pd

app = Flask(__name__)

# Load the trained model
model = joblib.load("random_forest_fraud_model.pkl")

# File to store transaction history
TRANSACTIONS_FILE = 'transactions.json'

# Initialize transactions file if it doesn't exist
if not os.path.exists(TRANSACTIONS_FILE):
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump([], f)

def load_transactions():
    with open(TRANSACTIONS_FILE, 'r') as f:
        return json.load(f)

def save_transaction(transaction):
    transactions = load_transactions()
    transactions.append(transaction)
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump(transactions, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

def generate_pca_features():
    """
    Generate 28 PCA-transformed features internally.
    These simulate PCA values that would come from real transaction data.
    """
    # Generate 28 PCA features with realistic ranges (typical PCA values range from -5 to 5)
    pca_features = np.random.normal(0, 2, 28).tolist()
    return [round(val, 6) for val in pca_features]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get Amount from user input
        amount = float(request.form.get("Amount", 0))
        
        if amount <= 0:
            return jsonify({
                "success": False,
                "error": "Amount must be greater than 0"
            })
        
        # Generate 28 PCA features internally (hidden from user)
        pca_features = generate_pca_features()
        
        # Create feature array: 28 PCA features + Amount = 29 features total
        # Order: V1, V2, ..., V28, Amount
        features_array = np.array(pca_features + [amount]).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(features_array)
        probability = model.predict_proba(features_array)
        
        # Get fraud probability
        fraud_probability = probability[0][1] * 100  # Probability of class 1 (fraud)
        
        # Determine result
        is_fraud = bool(prediction[0])
        result_text = "Fraud Detected" if is_fraud else "Transaction is Legitimate"
        
        # Create transaction record (only store Amount for history, not PCA values)
        transaction = {
            "id": len(load_transactions()) + 1,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Amount": amount,
            "is_fraud": is_fraud,
            "fraud_probability": round(fraud_probability, 2),
            "result": result_text
        }
        
        # Save transaction to history
        save_transaction(transaction)
        
        return jsonify({
            "success": True,
            "prediction": result_text,
            "is_fraud": is_fraud,
            "fraud_probability": round(fraud_probability, 2),
            "transaction_id": transaction["id"]
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route('/history')
def history():
    transactions = load_transactions()
    return render_template('history.html', transactions=transactions)

@app.route('/api/transactions')
def api_transactions():
    transactions = load_transactions()
    return jsonify(transactions)

@app.route('/api/stats')
def api_stats():
    transactions = load_transactions()
    
    if not transactions:
        return jsonify({
            "total": 0,
            "fraud_count": 0,
            "legitimate_count": 0,
            "fraud_percentage": 0,
            "avg_amount": 0,
            "avg_fraud_amount": 0
        })
    
    df = pd.DataFrame(transactions)
    
    total = len(transactions)
    fraud_count = df['is_fraud'].sum()
    legitimate_count = total - fraud_count
    fraud_percentage = (fraud_count / total * 100) if total > 0 else 0
    
    avg_amount = df['Amount'].mean()
    avg_fraud_amount = df[df['is_fraud']]['Amount'].mean() if fraud_count > 0 else 0
    
    return jsonify({
        "total": total,
        "fraud_count": int(fraud_count),
        "legitimate_count": int(legitimate_count),
        "fraud_percentage": round(fraud_percentage, 2),
        "avg_amount": round(avg_amount, 2),
        "avg_fraud_amount": round(avg_fraud_amount, 2)
    })

@app.route('/clear_history', methods=['POST'])
def clear_history():
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump([], f)
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)