"""
Gesture Prediction Script
Called by the backend to make predictions using the trained model.
"""

import sys
import json
import os
import warnings
import numpy as np
import tensorflow as tf
from pathlib import Path

# Suppress all TensorFlow and numpy warnings/info messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # 0=all, 1=info, 2=warnings, 3=errors only
warnings.filterwarnings('ignore')
tf.get_logger().setLevel('ERROR')

def load_model():
    """Load the trained gesture recognition model"""
    model_path = Path(__file__).parent / "models" / "gesture_classifier.h5"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    # Handle TensorFlow version compatibility issues
    # The model was saved with time_major parameter which newer TF versions don't support
    
    try:
        # Create custom LSTM that handles time_major parameter
        # Override both __init__ and from_config to handle the compatibility issue
        class CompatibleLSTM(tf.keras.layers.LSTM):
            def __init__(self, *args, **kwargs):
                # Remove time_major if present (not supported in TF 2.15+)
                kwargs.pop('time_major', None)
                super().__init__(*args, **kwargs)
            
            @classmethod
            def from_config(cls, config):
                # Remove time_major from config dict if present
                if isinstance(config, dict):
                    config = config.copy()
                    if 'config' in config:
                        config['config'] = config['config'].copy()
                        config['config'].pop('time_major', None)
                    config.pop('time_major', None)
                return super().from_config(config)
        
        custom_objects = {'LSTM': CompatibleLSTM}
        
        # Try loading with custom objects
        model = tf.keras.models.load_model(
            str(model_path),
            custom_objects=custom_objects,
            compile=False
        )
        return model
        
    except Exception as e:
        error_msg = str(e)
        if 'time_major' in error_msg.lower():
            # If time_major error persists, try loading with safe_mode disabled
            try:
                model = tf.keras.models.load_model(
                    str(model_path),
                    safe_mode=False,
                    compile=False
                )
                return model
            except:
                raise Exception(
                    f"Model loading failed due to TensorFlow version compatibility. "
                    f"The model was saved with parameters not supported in your TensorFlow version. "
                    f"Error: {error_msg}"
                )
        else:
            raise Exception(f"Failed to load model: {error_msg}")

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

