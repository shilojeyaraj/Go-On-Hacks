"""
Convert Keras H5 model to TensorFlow.js format for browser deployment
Run this script to convert the model for use in the frontend

Note: This requires tensorflowjs to be installed. If conversion fails,
the frontend will automatically fall back to backend Python prediction.
"""

import tensorflow as tf
from pathlib import Path
import shutil
import os
import sys

# Try to import tensorflowjs, handle compatibility issues
try:
    import tensorflowjs as tfjs
except ImportError:
    print("❌ tensorflowjs not installed. Install it with:")
    print("   pip install tensorflowjs")
    print("\nNote: The frontend will use backend Python prediction as fallback.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error importing tensorflowjs: {e}")
    print("\nThis may be due to numpy compatibility issues.")
    print("Try: pip install 'numpy<2.0' tensorflowjs")
    print("\nNote: The frontend will use backend Python prediction as fallback.")
    sys.exit(1)

def convert_model():
    """Convert H5 model to TensorFlow.js format and deploy to frontend"""
    script_dir = Path(__file__).parent
    model_path = script_dir / "models" / "gesture_classifier.h5"
    output_path = script_dir / "models" / "tfjs_model"
    
    # Frontend target directory
    frontend_public = script_dir.parent / "frontend" / "public" / "models"
    
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
    
    # Copy to frontend/public/models/
    print(f"\nDeploying to frontend...")
    print(f"Target directory: {frontend_public}")
    
    # Create frontend/public/models directory if it doesn't exist
    frontend_public.mkdir(parents=True, exist_ok=True)
    
    # Remove old model if it exists
    target_model_path = frontend_public / "tfjs_model"
    if target_model_path.exists():
        print(f"Removing old model at {target_model_path}...")
        shutil.rmtree(target_model_path)
    
    # Copy the converted model
    print(f"Copying model to {target_model_path}...")
    shutil.copytree(output_path, target_model_path)
    
    print("\n✅ Model deployed successfully!")
    print(f"✅ Model available at: {target_model_path}")
    print(f"✅ Frontend will load from: /models/tfjs_model/model.json")
    print("\nThe model is now ready to use in the browser!")

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

