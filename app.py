from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
import os
import json

app = Flask(__name__)

# Load the trained model
MODEL_PATH = 'classification_model.pkl'

def load_model():
    """Load the pre-trained model"""
    try:
        with open(MODEL_PATH, 'rb') as file:
            model = pickle.load(file)
        
        print("=" * 60)
        print("🚀 DIABETES PREDICTION MODEL LOADED")
        print("=" * 60)
        print(f"📊 Model Type: {type(model).__name__}")
        print(f"🎯 Classes: {model.classes_}")
        print(f"📈 Accuracy: 72% (from training)")
        print("=" * 60)
        
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return None

# Load model at startup
model = load_model()

def preprocess_features(features):
    """
    Preprocess features for the model
    Based on diabetes dataset characteristics
    """
    # Convert to numpy array
    features_array = np.array(features).reshape(1, -1)
    
    # Handle biologically impossible 0 values
    # In diabetes dataset, 0 values in certain columns are actually missing
    processed_features = features_array.copy()
    
    # These are median values from the PIMA dataset
    training_medians = {
        1: 117.0,  # Glucose
        2: 72.0,   # BloodPressure
        3: 29.0,   # SkinThickness
        4: 125.0,  # Insulin
        5: 32.0    # BMI
    }
    
    # Apply median imputation for biologically impossible 0 values
    for idx, median in training_medians.items():
        if idx < len(processed_features[0]) and processed_features[0, idx] == 0:
            processed_features[0, idx] = median
    
    # Standardize features (important for logistic regression)
    # Using statistics from the PIMA dataset
    means = [3.8, 120.9, 69.1, 20.5, 79.8, 32.0, 0.47, 33.2]
    stds = [3.4, 31.9, 19.4, 16.0, 115.2, 7.9, 0.33, 11.8]
    
    for i in range(len(processed_features[0])):
        if stds[i] > 0:  # Avoid division by zero
            processed_features[0, i] = (processed_features[0, i] - means[i]) / stds[i]
    
    return processed_features

@app.route('/')
def home():
    """Render the main page"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction requests"""
    try:
        # Get data from form
        data = request.json
        
        # Extract features in the correct order
        features = [
            float(data.get('Pregnancies', 0)),
            float(data.get('Glucose', 0)),
            float(data.get('BloodPressure', 0)),
            float(data.get('SkinThickness', 0)),
            float(data.get('Insulin', 0)),
            float(data.get('BMI', 0)),
            float(data.get('DiabetesPedigreeFunction', 0)),
            float(data.get('Age', 0))
        ]
        
        # Preprocess features
        processed_features = preprocess_features(features)
        
        # Make prediction
        if model:
            # Get probabilities
            probability = model.predict_proba(processed_features)[0]
            
            # Get prediction (threshold at 0.5)
            prediction = 1 if probability[1] > 0.5 else 0
            
            # Calculate risk percentage (0-100)
            risk_percentage = probability[1] * 100
            
            # Determine risk level with better thresholds
            if risk_percentage < 30:
                risk_level = "very_low"
                risk_label = "Very Low Risk"
                confidence_text = "Confident"
            elif risk_percentage < 50:
                risk_level = "low"
                risk_label = "Low Risk"
                confidence_text = "Moderately Confident"
            elif risk_percentage < 70:
                risk_level = "moderate"
                risk_label = "Moderate Risk"
                confidence_text = "Caution Advised"
            else:
                risk_level = "high"
                risk_label = "High Risk"
                confidence_text = "High Concern"
            
            # Prepare response
            result = {
                'success': True,
                'prediction': int(prediction),
                'probability_diabetes': float(probability[1]),
                'probability_no_diabetes': float(probability[0]),
                'risk_percentage': float(risk_percentage),
                'risk_level': risk_level,
                'risk_label': risk_label,
                'confidence_text': confidence_text,
                'message': 'Diabetes Detected' if prediction == 1 else 'No Diabetes Detected',
                'model_accuracy': 0.72,
                'features': features
            }
        else:
            result = {
                'success': False,
                'error': 'Model not loaded properly'
            }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error in prediction: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/sample_data')
def sample_data():
    """Provide sample data for demonstration"""
    samples = [
        {
            'id': 'low_risk_1',
            'name': 'Healthy Adult',
            'description': 'Young individual with normal glucose levels',
            'Pregnancies': 2,
            'Glucose': 110,
            'BloodPressure': 72,
            'SkinThickness': 28,
            'Insulin': 85,
            'BMI': 24.5,
            'DiabetesPedigreeFunction': 0.3,
            'Age': 28,
            'expected_result': 'Low Risk',
            'color': '#2ecc71'
        },
        {
            'id': 'high_risk_1',
            'name': 'Pre-diabetic',
            'description': 'Elevated glucose and BMI',
            'Pregnancies': 4,
            'Glucose': 165,
            'BloodPressure': 85,
            'SkinThickness': 35,
            'Insulin': 0,
            'BMI': 34.2,
            'DiabetesPedigreeFunction': 0.8,
            'Age': 48,
            'expected_result': 'High Risk',
            'color': '#e74c3c'
        },
        {
            'id': 'moderate_risk_1',
            'name': 'Borderline Case',
            'description': 'Mixed indicators, requires monitoring',
            'Pregnancies': 3,
            'Glucose': 140,
            'BloodPressure': 78,
            'SkinThickness': 32,
            'Insulin': 120,
            'BMI': 29.8,
            'DiabetesPedigreeFunction': 0.6,
            'Age': 42,
            'expected_result': 'Moderate Risk',
            'color': '#f39c12'
        },
        {
            'id': 'very_low_risk_1',
            'name': 'Optimal Health',
            'description': 'All parameters in healthy ranges',
            'Pregnancies': 1,
            'Glucose': 95,
            'BloodPressure': 68,
            'SkinThickness': 25,
            'Insulin': 75,
            'BMI': 22.3,
            'DiabetesPedigreeFunction': 0.2,
            'Age': 25,
            'expected_result': 'Very Low Risk',
            'color': '#27ae60'
        }
    ]
    return jsonify(samples)

@app.route('/health_stats')
def health_stats():
    """Provide health statistics and insights"""
    stats = {
        'global_diabetes_cases': '537 million',
        'predicted_2045': '783 million',
        'annual_deaths': '6.7 million',
        'undiagnosed_percentage': '44%',
        'prevention_success': '58%',
        'model_accuracy': '72%',
        'early_detection_impact': 'Reduces complications by 70%'
    }
    return jsonify(stats)


# driver code
if __name__ == "__main__":
    app.run(host='0.0.0.0' , debug=True)