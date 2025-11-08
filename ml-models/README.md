# Gesture Recognition Model Training Pipeline

This directory contains the complete machine learning pipeline for training head gesture recognition models for the Feet Swipe App.

## 📋 Overview

The gesture recognition system uses computer vision and deep learning to detect head movements:
- **YES (Swipe Left)**: Nod head up and down
- **NO (Swipe Right)**: Shake head side to side  
- **NEUTRAL**: No gesture or random movement

## 🏗️ Architecture

### Technology Stack
- **OpenCV**: Video processing and camera interface
- **MediaPipe**: Real-time face mesh detection (468 landmarks)
- **TensorFlow/Keras**: LSTM neural network for gesture classification
- **NumPy**: Numerical computations
- **scikit-learn**: Data splitting and evaluation metrics

### Model Architecture
```
Input: (30 frames, 24 features)
    ↓
LSTM(128 units) + BatchNorm + Dropout(0.3)
    ↓
LSTM(64 units) + BatchNorm + Dropout(0.3)
    ↓
LSTM(32 units) + BatchNorm + Dropout(0.3)
    ↓
Dense(64, relu) + Dropout(0.2)
    ↓
Dense(32, relu)
    ↓
Output: Dense(3, softmax) → [YES, NO, NEUTRAL]
```

**Key Features:**
- 24 features per frame (8 facial landmarks × 3 coordinates)
- 30-frame sequences (~1 second at 30fps)
- Temporal learning with LSTM layers
- Regularization with dropout and batch normalization

## 📁 Directory Structure

```
ml-models/
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── 1_upload_videos.py           # Step 1: Organize training videos
├── 2_extract_features.py        # Step 2: Extract facial landmarks
├── 3_train_model.py             # Step 3: Train LSTM model
├── 4_test_model.py              # Step 4: Test with webcam
│
├── videos/                       # Training videos
│   ├── yes/                     # YES gesture videos
│   ├── no/                      # NO gesture videos
│   └── neutral/                 # NEUTRAL videos
│
├── data/                         # Processed features
│   ├── training_data.npz        # Extracted features (generated)
│   └── extraction_stats.json    # Extraction statistics (generated)
│
└── models/                       # Trained models
    ├── gesture_classifier.h5    # Final trained model (generated)
    ├── best_model.h5            # Best model checkpoint (generated)
    ├── model_info.json          # Training metadata (generated)
    └── training_history.png     # Training curves (generated)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml-models
pip install -r requirements.txt
```

**Requirements:**
- Python 3.8 or higher
- Webcam for testing
- Windows/Mac/Linux

### 2. Collect Training Videos

Place your training videos in the appropriate folders:

```bash
videos/
├── yes/        # Videos of nodding YES (up-down movement)
├── no/         # Videos of shaking NO (side-to-side movement)
└── neutral/    # Videos of neutral/still faces
```

**Video Guidelines:**
- **Format**: .mp4, .avi, or .mov
- **Duration**: 3-10 seconds per video
- **Quantity**: 20-50 videos per category (minimum 10)
- **Quality**: Clear face, good lighting, minimal occlusion
- **Content**: Natural gestures, 2-3 repetitions per video

### 3. Run the Training Pipeline

#### Step 1: Organize Videos
```bash
python 1_upload_videos.py
```
- Validates video uploads
- Checks dataset balance
- Provides recommendations

#### Step 2: Extract Features
```bash
python 2_extract_features.py
```
- Processes all videos
- Extracts facial landmarks using MediaPipe
- Creates training sequences
- Saves to `data/training_data.npz`

**Processing time**: ~5-10 minutes for 100 videos

#### Step 3: Train Model
```bash
python 3_train_model.py
```
- Trains LSTM neural network
- Validates on 20% holdout set
- Saves best model
- Generates performance metrics

**Training time**: ~10-30 minutes depending on dataset size

#### Step 4: Test Model
```bash
python 4_test_model.py
```
- Opens webcam
- Real-time gesture recognition
- Shows confidence scores
- Statistics tracking

**Controls:**
- `Q`: Quit
- `R`: Reset buffer
- `S`: Toggle statistics

## 📊 Expected Performance

With good training data (30+ videos per class):
- **Training Accuracy**: 90-98%
- **Validation Accuracy**: 85-95%
- **Real-time FPS**: 20-30 fps
- **Latency**: < 100ms per prediction

## 🎥 Data Collection Tips

### Recording Environment
✅ **Good:**
- Well-lit room with even lighting
- Clear background
- Face clearly visible
- Natural head movements
- Steady camera position

❌ **Avoid:**
- Dim lighting or backlighting
- Busy/distracting backgrounds
- Face partially covered
- Exaggerated movements
- Shaky camera

### Gesture Guidelines

**YES Gesture (Nod):**
- Natural up-down head movement
- 2-3 nods per video
- Moderate speed (not too fast/slow)
- Keep face visible throughout

**NO Gesture (Shake):**
- Natural side-to-side head movement
- 2-3 shakes per video
- Moderate speed
- Keep face centered

**NEUTRAL:**
- Look at camera
- Minimal movement (blinking, slight shifts OK)
- Natural facial expression
- Random small movements

### Increasing Diversity

For better model generalization, include:
- Multiple people (if available)
- Different lighting conditions
- Various backgrounds
- Different angles (slightly left/right)
- With and without glasses
- Different gesture speeds

## 🔧 Troubleshooting

### Problem: Low accuracy during training

**Solutions:**
- Collect more training data (50+ videos per class)
- Ensure dataset is balanced
- Check video quality (lighting, face visibility)
- Increase training epochs
- Verify gestures are distinct

### Problem: "No face detected" during testing

**Solutions:**
- Improve lighting
- Move closer to camera
- Ensure face is clearly visible
- Check webcam is working
- Adjust MediaPipe confidence thresholds

### Problem: Slow training

**Solutions:**
- Reduce batch size
- Use GPU if available
- Reduce sequence length
- Decrease model size

### Problem: Model saved but test fails

**Solutions:**
- Check model files exist in `models/`
- Verify `model_info.json` is present
- Reinstall TensorFlow: `pip install --upgrade tensorflow`
- Check model file is not corrupted

## 📈 Advanced Configuration

### Adjusting Sequence Length

Edit in `2_extract_features.py` and `3_train_model.py`:
```python
sequence_length = 30  # Default: 1 second at 30fps
# Increase for slower gestures: 45-60
# Decrease for faster response: 15-20
```

### Modifying Model Architecture

Edit `create_model()` in `3_train_model.py`:
- Adjust LSTM units (128 → 256 for more capacity)
- Add/remove layers
- Change dropout rates (0.3 → 0.2 for less regularization)

### Training Hyperparameters

Edit in `3_train_model.py`:
```python
epochs = 50          # Max training epochs
batch_size = 32      # Samples per batch
validation_split = 0.2  # Validation percentage
learning_rate = 0.001   # Adam optimizer learning rate
```

## 🧪 Model Evaluation

After training, check these metrics:

### 1. Accuracy
- **Training**: Should be 90%+
- **Validation**: Should be 85%+
- **Gap**: < 10% difference (indicates overfitting if larger)

### 2. Confusion Matrix
Look for:
- High diagonal values (correct predictions)
- Low off-diagonal values (misclassifications)

### 3. Per-Class Metrics
- **Precision**: % of predictions that were correct
- **Recall**: % of actual gestures detected
- **F1-Score**: Balance between precision and recall

## 🔬 Technical Details

### Facial Landmarks Used

We track 8 key landmarks (24 features total):
1. **Nose tip** (landmark #1): Primary head position
2. **Forehead** (landmark #10): Vertical movement
3. **Chin** (landmark #152): Vertical movement
4. **Left eye outer** (landmark #33): Horizontal movement
5. **Right eye outer** (landmark #263): Horizontal movement
6. **Left mouth** (landmark #61): Additional reference
7. **Right mouth** (landmark #291): Additional reference
8. **Mouth center** (landmark #199): Additional reference

Each landmark provides x, y, z coordinates (normalized 0-1).

### Sequence Processing

**Sliding Window:**
- Creates overlapping sequences from videos
- Window size: 30 frames
- Slide step: 10 frames
- Increases training data 3x

**Benefits:**
- More training samples from limited videos
- Better temporal coverage
- Improved model generalization

## 📚 API Documentation

### Loading a Trained Model

```python
import tensorflow as tf
import json

# Load model
model = tf.keras.models.load_model('models/gesture_classifier.h5')

# Load metadata
with open('models/model_info.json', 'r') as f:
    info = json.load(f)

# Make predictions
predictions = model.predict(sequence)  # sequence: (1, 30, 24)
predicted_class = np.argmax(predictions)
```

### Integrating into Your App

```python
from collections import deque
import mediapipe as mp
import cv2
import numpy as np

# Initialize
face_mesh = mp.solutions.face_mesh.FaceMesh()
frame_buffer = deque(maxlen=30)

# Process frame
results = face_mesh.process(frame)
landmarks = extract_landmarks(results)  # Your extraction function
frame_buffer.append(landmarks)

# Predict when buffer is full
if len(frame_buffer) == 30:
    sequence = np.array(frame_buffer)
    sequence = np.expand_dims(sequence, axis=0)
    prediction = model.predict(sequence)
```

## 🤝 Contributing

To improve the model:
1. Collect more diverse training data
2. Experiment with model architectures
3. Try different hyperparameters
4. Add data augmentation
5. Implement ensemble methods

## 📝 Notes

- **Model Size**: ~2-5 MB (easy to deploy)
- **Inference Time**: ~20-50ms per prediction
- **Memory Usage**: ~200MB during inference
- **Platform**: Cross-platform (Windows, Mac, Linux, mobile with TFLite)

## 🆘 Support

If you encounter issues:
1. Check this README thoroughly
2. Review error messages in console
3. Verify all dependencies are installed
4. Ensure video quality is good
5. Check webcam functionality

## 📄 License

This code is part of the Feet Swipe App project. See main project LICENSE file.

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Maintainer**: Go-On-Hacks Team

