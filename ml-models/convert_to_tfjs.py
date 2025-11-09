"""
Convert Keras H5 model to TensorFlow.js format for browser deployment
Run this script to convert the model for use in the frontend
"""

import tensorflow as tf
import tensorflowjs as tfjs
from pathlib import Path

def convert_model():
    """Convert H5 model to TensorFlow.js format"""
    model_path = Path(__file__).parent / "models" / "gesture_classifier.h5"
    output_path = Path(__file__).parent / "models" / "tfjs_model"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    print(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(str(model_path))
    
    print(f"Converting to TensorFlow.js format...")
    print(f"Output directory: {output_path}")
    
    # Convert to TensorFlow.js format
    tfjs.converters.save_keras_model(model, str(output_path))
    
    print("✅ Model converted successfully!")
    print(f"TensorFlow.js model saved to: {output_path}")
    print("\nTo use in frontend:")
    print("1. Copy the tfjs_model folder to frontend/public/models/")
    print("2. The model will be loaded from the browser")

if __name__ == "__main__":
    try:
        convert_model()
    except ImportError:
        print("❌ tensorflowjs not installed. Install it with:")
        print("   pip install tensorflowjs")
    except Exception as e:
        print(f"❌ Error converting model: {e}")
        import traceback
        traceback.print_exc()

