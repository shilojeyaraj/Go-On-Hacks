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

# Load model
print("Loading model...")
model = tf.keras.models.load_model("models/gesture_classifier.h5")

with open("models/model_info.json", 'r') as f:
    info = json.load(f)

label_names = {int(k): v for k, v in info['label_map'].items()}
sequence_length = info['input_shape'][0]

# Setup
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

key_landmarks = [1, 10, 152, 33, 263, 61, 291, 199]
frame_buffer = deque(maxlen=sequence_length)

# Colors
colors = {
    0: (0, 255, 0),   # YES - Green
    1: (0, 0, 255),   # NO - Red
    2: (255, 255, 0)  # NEUTRAL - Cyan
}

cap = cv2.VideoCapture(0)

print("✓ Ready! Press Q to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame = cv2.flip(frame, 1)
    
    # Detect face
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(rgb_frame)
    
    if results.multi_face_landmarks:
        # Extract landmarks
        face = results.multi_face_landmarks[0]
        landmarks = []
        for idx in key_landmarks:
            lm = face.landmark[idx]
            landmarks.extend([lm.x, lm.y, lm.z])
        
        frame_buffer.append(np.array(landmarks))
        
        # Predict
        if len(frame_buffer) == sequence_length:
            sequence = np.expand_dims(np.array(list(frame_buffer)), axis=0)
            predictions = model.predict(sequence, verbose=0)[0]
            predicted_class = np.argmax(predictions)
            confidence = predictions[predicted_class]
            
            if confidence > 0.5:
                gesture = label_names[predicted_class]
                color = colors.get(predicted_class, (255, 255, 255))
                
                # Show prediction
                cv2.rectangle(frame, (10, 10), (400, 100), color, -1)
                cv2.putText(frame, gesture, (30, 70),
                           cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
    
    cv2.imshow('Quick Test - Press Q to quit', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Done!")


