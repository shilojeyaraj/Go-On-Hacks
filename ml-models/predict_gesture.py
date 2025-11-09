"""
Gesture Prediction Script
Called by the backend to make predictions using the trained model.
"""

import sys
import json
import numpy as np
import tensorflow as tf
from pathlib import Path

def load_model():
    """Load the trained gesture recognition model"""
    model_path = Path(__file__).parent / "models" / "gesture_classifier.h5"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    model = tf.keras.models.load_model(str(model_path))
    return model

def predict(sequence):
    """
    Predict gesture from a sequence of features
    
    Args:
        sequence: List of lists, shape (sequence_length, 9)
                 Each frame has 9 features: [3 vertical_y, 3 horizontal_x, 3 vertical_z]
    
    Returns:
        Dictionary with gesture, confidence, and probabilities
    """
    model = load_model()
    
    # Convert to numpy array
    sequence_array = np.array(sequence, dtype=np.float32)
    
    # Reshape for model input: (1, sequence_length, 9)
    sequence_array = np.expand_dims(sequence_array, axis=0)
    
    # Make prediction
    predictions = model.predict(sequence_array, verbose=0)[0]
    
    # Get predicted class
    predicted_class = int(np.argmax(predictions))
    confidence = float(predictions[predicted_class])
    
    # Map class to label
    label_names = {0: "YES", 1: "NO", 2: "NEUTRAL"}
    gesture = label_names[predicted_class]
    
    # Create probabilities dictionary
    probabilities = {
        label_names[i]: float(predictions[i])
        for i in range(len(predictions))
    }
    
    return {
        "gesture": gesture,
        "confidence": confidence,
        "probabilities": probabilities
    }

if __name__ == "__main__":
    try:
        # Read sequence from command line argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No sequence provided"}))
            sys.exit(1)
        
        sequence = json.loads(sys.argv[1])
        result = predict(sequence)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

