"""
STEP 4: REAL-TIME MODEL TESTING
================================
This script tests your trained model with real-time webcam input.

Usage:
    python 4_test_model.py

What it does:
    - Loads your trained model
    - Opens webcam
    - Detects your face in real-time
    - Recognizes your head gestures
    - Displays predictions with confidence scores

Controls:
    Q - Quit the application
    R - Reset frame buffer
    S - Toggle statistics display

Gesture Meanings:
    YES (GREEN)     - Nod head up and down
    NO (RED)        - Shake head side to side
    NEUTRAL (CYAN)  - Still or random movement

Tips for Testing:
    - Ensure good lighting
    - Keep your face clearly visible
    - Perform gestures naturally
    - Wait for buffer to fill (progress bar at bottom)
"""

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from pathlib import Path
import json
from collections import deque
import time

class GestureTester:
    def __init__(self, model_path="models"):
        self.model_path = Path(model_path)
        
        # Load trained model
        model_file = self.model_path / "gesture_classifier.h5"
        if not model_file.exists():
            raise FileNotFoundError(
                f"Model not found: {model_file}\n"
                "Please train the model first using '3_train_model.py'"
            )
        
        print("Loading model...")
        self.model = tf.keras.models.load_model(str(model_file))
        
        # Load model metadata
        info_file = self.model_path / "model_info.json"
        with open(str(info_file), 'r') as f:
            self.info = json.load(f)
        
        self.label_names = {int(k): v for k, v in self.info['label_map'].items()}
        self.sequence_length = self.info['input_shape'][0]
        
        # Setup MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Key landmarks (must match training)
        # Focused on movement-specific landmarks:
        # Vertical landmarks (YES - nodding): 1 (nose), 10 (forehead), 152 (chin)
        # Horizontal landmarks (NO - shaking): 1 (nose), 33 (left eye), 263 (right eye)
        self.vertical_landmarks = [1, 10, 152]
        self.horizontal_landmarks = [1, 33, 263]
        self.key_landmarks = sorted(list(set(self.vertical_landmarks + self.horizontal_landmarks)))
        
        # Frame buffer for sequences
        self.frame_buffer = deque(maxlen=self.sequence_length)
        
        # Statistics
        self.gesture_counts = {label: 0 for label in self.label_names.values()}
        self.total_predictions = 0
        self.show_stats = False
        
        print(f"[OK] Model loaded successfully")
        print(f"  Trained on: {self.info['training_date']}")
        print(f"  Validation accuracy: {self.info['val_accuracy']*100:.2f}%")
        print(f"  Sequence length: {self.sequence_length} frames")
    
    def extract_landmarks(self, frame):
        """Extract facial landmarks and compute movement-focused features (must match training)"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
        
        face_landmarks = results.multi_face_landmarks[0]
        
        # Extract raw landmark positions
        vertical_positions = []
        horizontal_positions = []
        
        for idx in self.vertical_landmarks:
            landmark = face_landmarks.landmark[idx]
            vertical_positions.append([landmark.x, landmark.y, landmark.z])
        
        for idx in self.horizontal_landmarks:
            landmark = face_landmarks.landmark[idx]
            horizontal_positions.append([landmark.x, landmark.y, landmark.z])
        
        vertical_positions = np.array(vertical_positions)
        horizontal_positions = np.array(horizontal_positions)
        
        # Compute movement-focused features (matching training):
        features = []
        
        # Vertical movement features (YES - up/down motion)
        vertical_y = vertical_positions[:, 1]  # y-coordinates
        features.extend(vertical_y.tolist())  # 3 features
        
        # Horizontal movement features (NO - left/right motion)
        horizontal_x = horizontal_positions[:, 0]  # x-coordinates
        features.extend(horizontal_x.tolist())  # 3 features
        
        # Add z-coordinates for depth
        vertical_z = vertical_positions[:, 2]  # z-coordinates
        features.extend(vertical_z.tolist())  # 3 features
        
        # Total: 9 features (matching training extraction)
        return np.array(features)
    
    def predict_gesture(self):
        """Predict gesture from frame buffer"""
        if len(self.frame_buffer) < self.sequence_length:
            return None, 0.0
        
        # Prepare sequence
        sequence = np.array(list(self.frame_buffer))
        sequence = np.expand_dims(sequence, axis=0)
        
        # Predict
        predictions = self.model.predict(sequence, verbose=0)[0]
        predicted_class = np.argmax(predictions)
        confidence = predictions[predicted_class]
        
        return predicted_class, confidence, predictions
    
    def draw_prediction_box(self, frame, gesture_name, confidence, color):
        """Draw prediction box with gesture name and confidence"""
        # Main prediction box
        cv2.rectangle(frame, (10, 10), (350, 110), color, -1)
        cv2.rectangle(frame, (10, 10), (350, 110), (255, 255, 255), 2)
        
        # Gesture name
        cv2.putText(frame, gesture_name, (25, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 4)
        
        # Confidence
        cv2.putText(frame, f"Confidence: {confidence*100:.1f}%",
                   (25, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    def draw_confidence_bars(self, frame, predictions):
        """Draw confidence bars for all classes"""
        x_start = 10
        y_start = 130
        bar_width = 340
        bar_height = 30
        spacing = 10
        
        colors = {
            0: (0, 255, 0),    # YES - Green
            1: (0, 0, 255),    # NO - Red
            2: (255, 255, 0)   # NEUTRAL - Cyan
        }
        
        cv2.putText(frame, "Confidence Breakdown:", (x_start, y_start - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        for i, (label_id, label_name) in enumerate(self.label_names.items()):
            y_pos = y_start + i * (bar_height + spacing) + 10
            confidence = predictions[label_id]
            
            # Background bar
            cv2.rectangle(frame, (x_start, y_pos), 
                         (x_start + bar_width, y_pos + bar_height),
                         (50, 50, 50), -1)
            
            # Confidence bar
            filled_width = int(bar_width * confidence)
            cv2.rectangle(frame, (x_start, y_pos),
                         (x_start + filled_width, y_pos + bar_height),
                         colors[label_id], -1)
            
            # Border
            cv2.rectangle(frame, (x_start, y_pos),
                         (x_start + bar_width, y_pos + bar_height),
                         (255, 255, 255), 2)
            
            # Label and percentage
            cv2.putText(frame, f"{label_name}", (x_start + 5, y_pos + 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, f"{confidence*100:.0f}%",
                       (x_start + bar_width - 45, y_pos + 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def draw_buffer_status(self, frame):
        """Draw buffer fill status"""
        h, w = frame.shape[:2]
        bar_width = w - 20
        bar_height = 20
        x_start = 10
        y_start = h - 60
        
        buffer_pct = len(self.frame_buffer) / self.sequence_length
        
        # Background
        cv2.rectangle(frame, (x_start, y_start),
                     (x_start + bar_width, y_start + bar_height),
                     (50, 50, 50), -1)
        
        # Fill
        filled_width = int(bar_width * buffer_pct)
        color = (0, 255, 0) if buffer_pct == 1.0 else (0, 165, 255)
        cv2.rectangle(frame, (x_start, y_start),
                     (x_start + filled_width, y_start + bar_height),
                     color, -1)
        
        # Border
        cv2.rectangle(frame, (x_start, y_start),
                     (x_start + bar_width, y_start + bar_height),
                     (255, 255, 255), 2)
        
        # Text
        status = "READY" if buffer_pct == 1.0 else "BUFFERING..."
        cv2.putText(frame, f"Buffer: {status} ({len(self.frame_buffer)}/{self.sequence_length})",
                   (x_start, y_start - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def draw_statistics(self, frame):
        """Draw gesture statistics"""
        if not self.show_stats or self.total_predictions == 0:
            return
        
        h, w = frame.shape[:2]
        x_start = w - 220
        y_start = 10
        
        cv2.rectangle(frame, (x_start, y_start), (w - 10, y_start + 130),
                     (0, 0, 0), -1)
        cv2.rectangle(frame, (x_start, y_start), (w - 10, y_start + 130),
                     (255, 255, 255), 2)
        
        cv2.putText(frame, "Statistics:", (x_start + 10, y_start + 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        y_offset = 50
        for gesture, count in self.gesture_counts.items():
            pct = (count / self.total_predictions * 100) if self.total_predictions > 0 else 0
            cv2.putText(frame, f"{gesture}: {count} ({pct:.1f}%)",
                       (x_start + 10, y_start + y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            y_offset += 20
        
        cv2.putText(frame, f"Total: {self.total_predictions}",
                   (x_start + 10, y_start + y_offset + 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    def draw_controls(self, frame):
        """Draw control instructions"""
        h, w = frame.shape[:2]
        y_start = h - 35
        
        controls = "Q: Quit  |  R: Reset  |  S: Stats"
        cv2.putText(frame, controls, (10, y_start),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def test_webcam(self, camera_index=0):
        """Test model with webcam"""
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            print("[ERROR] Cannot open webcam")
            print("   Make sure your webcam is connected and not in use")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        print("\n" + "="*60)
        print(" "*15 + "REAL-TIME GESTURE TESTING")
        print("="*60)
        print("\nControls:")
        print("  Q - Quit")
        print("  R - Reset buffer")
        print("  S - Toggle statistics")
        print("\nPerform gestures in front of the camera!")
        print("  - YES: Nod head up and down")
        print("  - NO: Shake head side to side")
        print("="*60 + "\n")
        
        gesture_colors = {
            0: (0, 255, 0),    # YES - Green
            1: (0, 0, 255),    # NO - Red
            2: (255, 255, 0)   # NEUTRAL - Cyan
        }
        
        fps_time = time.time()
        fps = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Mirror the frame for more natural interaction
            frame = cv2.flip(frame, 1)
            
            # Calculate FPS
            current_time = time.time()
            fps = 1 / (current_time - fps_time) if (current_time - fps_time) > 0 else fps
            fps_time = current_time
            
            # Extract landmarks
            landmarks = self.extract_landmarks(frame)
            
            if landmarks is not None:
                self.frame_buffer.append(landmarks)
                
                # Predict gesture
                result = self.predict_gesture()
                
                if result[0] is not None:
                    predicted_class, confidence, predictions = result
                    
                    # Only show prediction if confidence is high enough
                    if confidence > 0.5:
                        gesture_name = self.label_names[predicted_class]
                        color = gesture_colors.get(predicted_class, (255, 255, 255))
                        
                        # Update statistics
                        self.gesture_counts[gesture_name] += 1
                        self.total_predictions += 1
                        
                        # Draw prediction
                        self.draw_prediction_box(frame, gesture_name, confidence, color)
                        self.draw_confidence_bars(frame, predictions)
            else:
                # No face detected
                cv2.putText(frame, "No face detected", (10, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Draw UI elements
            self.draw_buffer_status(frame)
            self.draw_statistics(frame)
            self.draw_controls(frame)
            
            # Draw FPS
            cv2.putText(frame, f"FPS: {fps:.1f}", (frame.shape[1] - 100, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Display frame
            cv2.imshow('Gesture Testing - Feet Swipe App', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("\nQuitting...")
                break
            elif key == ord('r'):
                self.frame_buffer.clear()
                print("Buffer reset")
            elif key == ord('s'):
                self.show_stats = not self.show_stats
                print(f"Statistics {'enabled' if self.show_stats else 'disabled'}")
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Print final statistics
        print("\n" + "="*60)
        print(" "*20 + "SESSION SUMMARY")
        print("="*60)
        print(f"\nTotal predictions: {self.total_predictions}")
        if self.total_predictions > 0:
            print(f"\nGesture breakdown:")
            for gesture, count in self.gesture_counts.items():
                pct = count / self.total_predictions * 100
                print(f"  {gesture:8}: {count:4} ({pct:.1f}%)")
        print("\n" + "="*60)
        print("[OK] Testing complete")

def main():
    print("\n" + "="*60)
    print(" "*12 + "REAL-TIME GESTURE TESTING")
    print(" "*10 + "Gesture Recognition Model Testing")
    print("="*60)
    
    try:
        tester = GestureTester()
        
        print("\n" + "-"*60)
        print("Starting webcam testing...")
        print("(Press Q to quit when webcam window opens)")
        print("-"*60)
        
        tester.test_webcam()
        
    except FileNotFoundError as e:
        print(f"\n[ERROR] Error: {e}")
        print("\nPlease complete these steps first:")
        print("  1. python 2_extract_features.py")
        print("  2. python 3_train_model.py")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

