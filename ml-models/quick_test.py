"""
QUICK TEST - Minimal Testing Script
====================================
Simplest possible test of your model.

Usage:
    python quick_test.py

What it does:
    - Opens webcam
    - Shows predictions
    - That's it!

Perfect for:
    - Quick checks
    - Demos
    - Showing friends
"""

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from pathlib import Path
import json
from collections import deque
import time

# Load model
print("\n" + "="*60)
print("GESTURE RECOGNITION - DEBUG MODE")
print("="*60)
print("\nLoading model...")
model = tf.keras.models.load_model("models/gesture_classifier.h5")
print(f"[OK] Model loaded: {model.input_shape} -> {model.output_shape}")

with open("models/model_info.json", 'r') as f:
    info = json.load(f)

label_names = {int(k): v for k, v in info['label_map'].items()}
sequence_length = info['input_shape'][0]

# Handle legacy 3-class models
if len(label_names) == 3:
    label_names = {0: "YES", 1: "NO", 2: "NEUTRAL"}

print(f"[OK] Classes: {label_names}")
print(f"[OK] Sequence length: {sequence_length} frames")

# Prediction counter
frame_count = 0
prediction_count = 0
last_log_time = time.time()

# Setup
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Focused landmarks for movement detection (must match training)
# Vertical landmarks (YES - nodding): 1 (nose), 10 (forehead), 152 (chin)
# Horizontal landmarks (NO - shaking): 1 (nose), 33 (left eye), 263 (right eye)
vertical_landmarks = [1, 10, 152]
horizontal_landmarks = [1, 33, 263]
key_landmarks = sorted(list(set(vertical_landmarks + horizontal_landmarks)))
frame_buffer = deque(maxlen=sequence_length)

# Colors
colors = {
    0: (0, 255, 0),   # YES - Green
    1: (0, 0, 255),   # NO - Red
    2: (255, 255, 0)  # NEUTRAL - Cyan
}

cap = cv2.VideoCapture(0)

print("\n" + "-"*60)
print("STARTING WEBCAM TEST")
print("-"*60)
print("Ready! Press Q to quit\n")
print("LIVE PREDICTIONS (updating every 0.5 seconds):")
print("-"*60)

while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Cannot read frame from webcam")
        break
    
    frame_count += 1
    frame = cv2.flip(frame, 1)
    
    # Detect face
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(rgb_frame)
    
    if results.multi_face_landmarks:
        # Extract movement-focused features (matching training)
        face = results.multi_face_landmarks[0]
        
        # Extract raw positions
        vertical_positions = []
        horizontal_positions = []
        
        for idx in vertical_landmarks:
            lm = face.landmark[idx]
            vertical_positions.append([lm.x, lm.y, lm.z])
        
        for idx in horizontal_landmarks:
            lm = face.landmark[idx]
            horizontal_positions.append([lm.x, lm.y, lm.z])
        
        vertical_positions = np.array(vertical_positions)
        horizontal_positions = np.array(horizontal_positions)
        
        # Compute movement-focused features
        features = []
        features.extend(vertical_positions[:, 1].tolist())  # vertical y-coords (YES)
        features.extend(horizontal_positions[:, 0].tolist())  # horizontal x-coords (NO)
        features.extend(vertical_positions[:, 2].tolist())  # z-coords (depth)
        
        frame_buffer.append(np.array(features))
        
        # Predict
        if len(frame_buffer) == sequence_length:
            sequence = np.expand_dims(np.array(list(frame_buffer)), axis=0)
            predictions = model.predict(sequence, verbose=0)[0]
            predicted_class = np.argmax(predictions)
            confidence = predictions[predicted_class]
            
            prediction_count += 1
            
            # Log predictions every 0.5 seconds
            current_time = time.time()
            if current_time - last_log_time >= 0.5:
                print(f"\n[Frame {frame_count}] Prediction #{prediction_count}:")
                print(f"  YES:     {predictions[0]*100:5.1f}%")
                print(f"  NO:      {predictions[1]*100:5.1f}%")
                print(f"  NEUTRAL: {predictions[2]*100:5.1f}%")
                print(f"  -> PREDICTED: {label_names[predicted_class]} ({confidence*100:.1f}% confident)")
                last_log_time = current_time
            
            # ALWAYS show prediction (removed confidence threshold)
            gesture = label_names[predicted_class]
            color = colors.get(predicted_class, (255, 255, 255))
            
            # Main prediction box
            cv2.rectangle(frame, (10, 10), (450, 100), color, -1)
            cv2.putText(frame, gesture, (30, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
            cv2.putText(frame, f"{confidence*100:.0f}%", (350, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3)
            
            # Show all probabilities on screen
            y_pos = 120
            cv2.putText(frame, f"YES: {predictions[0]*100:.0f}%", (10, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            y_pos += 30
            cv2.putText(frame, f"NO: {predictions[1]*100:.0f}%", (10, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            y_pos += 30
            cv2.putText(frame, f"NEUTRAL: {predictions[2]*100:.0f}%", (10, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    else:
        # Log when face is not detected
        current_time = time.time()
        if current_time - last_log_time >= 1.0:
            print(f"\n[Frame {frame_count}] [WARNING] No face detected - buffer: {len(frame_buffer)}/{sequence_length}")
            last_log_time = current_time
    
    cv2.imshow('Quick Test - Press Q to quit', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)
print(f"Total frames processed: {frame_count}")
print(f"Total predictions made: {prediction_count}")
print("="*60 + "\n")


