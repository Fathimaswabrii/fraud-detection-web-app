# 💳 Credit Card Fraud Detection Web App

A machine learning–powered web application that detects fraudulent credit card transactions using a trained classification model and a Flask-based backend.

The project demonstrates how fraud detection systems work when sensitive transaction data is anonymized using PCA transformation.

---

## 🔍 Project Overview

This application predicts whether a credit card transaction is **Fraudulent** or **Legitimate**.

Since real credit card datasets use **PCA-transformed features (V1–V28)** to protect user privacy, these features are **not entered manually** by users.  
Instead, the system **simulates transaction behavior internally**, while allowing the user to interact with meaningful inputs such as **transaction amount**.

This approach keeps the UI realistic and conceptually correct.

---

## ⚙️ Tech Stack

- **Python**
- **Flask**
- **Scikit-learn**
- **Random Forest Classifier**
- **Joblib**
- **HTML, CSS, JavaScript**

---

## 🧠 Machine Learning Model

- **Algorithm:** Random Forest Classifier  
- **Input Features:**
  - PCA Features (V1–V28) — internally simulated
  - Transaction Amount
- **Output:**
  - `1` → Fraud
  - `0` → Legitimate

The model is trained on a PCA-transformed credit card transactions dataset.

---

## 🖥️ Application Workflow

1. User enters a **transaction amount**
2. System **simulates PCA features** internally
3. Model evaluates the transaction
4. UI displays:
   - ✅ Legitimate Transaction  
   - 🚨 Fraud Detected
5. Fraud probability and transaction history are updated in real time

---

## 🚀 How to Run the Project

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Fathimaswabrii/fraud-detection-web-app.git
cd fraud-detection-web-app
