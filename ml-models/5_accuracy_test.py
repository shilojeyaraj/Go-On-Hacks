"""
STEP 5: ACCURACY TESTING SYSTEM
================================
This script helps you systematically test your model's accuracy.

Usage:
    python 5_accuracy_test.py

What it does:
    - Tests model with structured accuracy evaluation
    - Records predictions vs actual gestures
    - Calculates accuracy metrics
    - Saves results to CSV for analysis
    - Provides detailed performance report

Testing Protocol:
    1. Perform a gesture
    2. Wait for prediction
    3. Confirm if correct or incorrect
    4. Repeat for all gesture types
    5. Get accuracy report

Perfect for:
    - Evaluating model performance
    - Finding problem areas
    - Testing with multiple people
    - Collecting data for model improvement
"""

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from pathlib import Path
import json
from collections import deque
import time
import csv
from datetime import datetime

class AccuracyTester:
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
        
        # Setup MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.key_landmarks = [1, 10, 152, 33, 263, 61, 291, 199]
        
        # Frame buffer
        self.frame_buffer = deque(maxlen=self.sequence_length)
        
        # Test results
        self.test_results = []
        self.current_test = None
        
        print(f"✓ Model loaded successfully")
        print(f"  Classes: {', '.join(self.label_names.values())}")
        print(f"  Validation accuracy: {self.info['val_accuracy']*100:.2f}%")
    
    def extract_landmarks(self, frame):
        """Extract facial landmarks from a frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
        
        face_landmarks = results.multi_face_landmarks[0]
        landmarks = []
        
        for idx in self.key_landmarks:
            landmark = face_landmarks.landmark[idx]
            landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        return np.array(landmarks)
    
    def predict_gesture(self):
        """Predict gesture from frame buffer"""
        if len(self.frame_buffer) < self.sequence_length:
            return None, 0.0, None
        
        sequence = np.array(list(self.frame_buffer))
        sequence = np.expand_dims(sequence, axis=0)
        
        predictions = self.model.predict(sequence, verbose=0)[0]
        predicted_class = np.argmax(predictions)
        confidence = predictions[predicted_class]
        
        return predicted_class, confidence, predictions
    
    def run_accuracy_test(self):
        """Run structured accuracy testing"""
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot open webcam")
            return
        
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        print("\n" + "="*60)
        print(" "*15 + "ACCURACY TESTING MODE")
        print("="*60)
        print("\nInstructions:")
        print("  1. Select gesture type to test (press number key)")
        for i, name in self.label_names.items():
            print(f"     {i+1} - Test {name} gesture")
        print("  2. Perform the gesture when ready")
        print("  3. Press Y if prediction was CORRECT")
        print("  4. Press N if prediction was WRONG")
        print("  5. Press Q to quit and see results")
        print("="*60 + "\n")
        
        testing_mode = None
        waiting_for_prediction = False
        last_prediction = None
        prediction_time = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            
            # Extract landmarks
            landmarks = self.extract_landmarks(frame)
            
            if landmarks is not None:
                self.frame_buffer.append(landmarks)
                
                # Make prediction if in testing mode
                if testing_mode is not None and waiting_for_prediction:
                    result = self.predict_gesture()
                    
                    if result[0] is not None:
                        predicted_class, confidence, predictions = result
                        
                        if confidence > 0.5:
                            last_prediction = {
                                'predicted_class': predicted_class,
                                'predicted_name': self.label_names[predicted_class],
                                'confidence': confidence,
                                'expected_class': testing_mode,
                                'expected_name': self.label_names[testing_mode],
                                'timestamp': datetime.now().isoformat()
                            }
                            waiting_for_prediction = False
                            prediction_time = time.time()
            
            # Draw UI
            overlay = frame.copy()
            
            # Top panel - instructions
            cv2.rectangle(overlay, (10, 10), (w-10, 150), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
            
            if testing_mode is None:
                cv2.putText(frame, "Select Gesture to Test:", (20, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                y_pos = 70
                for i, name in self.label_names.items():
                    cv2.putText(frame, f"Press {i+1} for {name}", (30, y_pos),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    y_pos += 30
            else:
                expected_name = self.label_names[testing_mode]
                cv2.putText(frame, f"Testing: {expected_name} Gesture", (20, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                
                if waiting_for_prediction:
                    cv2.putText(frame, "Perform gesture now...", (20, 80),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                elif last_prediction is not None:
                    # Show prediction result
                    pred_name = last_prediction['predicted_name']
                    conf = last_prediction['confidence']
                    
                    color = (0, 255, 0) if pred_name == expected_name else (0, 0, 255)
                    
                    cv2.putText(frame, f"Predicted: {pred_name} ({conf*100:.1f}%)", 
                               (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                    cv2.putText(frame, "Was this correct? Y=Yes, N=No, R=Retry", 
                               (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Bottom panel - stats
            total_tests = len(self.test_results)
            if total_tests > 0:
                correct = sum(1 for r in self.test_results if r['correct'])
                accuracy = correct / total_tests * 100
                
                cv2.rectangle(overlay, (10, h-80), (w-10, h-10), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
                
                cv2.putText(frame, f"Tests: {total_tests} | Correct: {correct} | Accuracy: {accuracy:.1f}%",
                           (20, h-40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Buffer status
            buffer_pct = len(self.frame_buffer) / self.sequence_length
            bar_width = w - 20
            bar_height = 10
            x_start = 10
            y_start = h - 100
            
            cv2.rectangle(frame, (x_start, y_start),
                         (x_start + int(bar_width * buffer_pct), y_start + bar_height),
                         (0, 255, 0) if buffer_pct == 1.0 else (0, 165, 255), -1)
            
            cv2.imshow('Accuracy Testing - Press Q to quit', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            # Select testing mode
            for i in self.label_names.keys():
                if key == ord(str(i+1)):
                    testing_mode = i
                    waiting_for_prediction = True
                    last_prediction = None
                    self.frame_buffer.clear()
                    print(f"\n→ Testing {self.label_names[i]} gesture")
            
            # Confirm prediction
            if key == ord('y') and last_prediction is not None:
                last_prediction['correct'] = True
                last_prediction['user_confirmed'] = 'correct'
                self.test_results.append(last_prediction)
                print(f"✓ Correct prediction recorded")
                testing_mode = None
                last_prediction = None
            
            elif key == ord('n') and last_prediction is not None:
                last_prediction['correct'] = False
                last_prediction['user_confirmed'] = 'incorrect'
                self.test_results.append(last_prediction)
                print(f"✗ Incorrect prediction recorded")
                testing_mode = None
                last_prediction = None
            
            elif key == ord('r') and last_prediction is not None:
                # Retry
                waiting_for_prediction = True
                last_prediction = None
                self.frame_buffer.clear()
                print(f"↻ Retrying...")
            
            elif key == ord('q'):
                print("\nQuitting...")
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate accuracy report"""
        if len(self.test_results) == 0:
            print("\nNo test results to report.")
            return
        
        print("\n" + "="*60)
        print(" "*20 + "ACCURACY REPORT")
        print("="*60)
        
        # Overall accuracy
        total = len(self.test_results)
        correct = sum(1 for r in self.test_results if r['correct'])
        accuracy = correct / total * 100
        
        print(f"\nOverall Results:")
        print(f"  Total tests: {total}")
        print(f"  Correct: {correct}")
        print(f"  Incorrect: {total - correct}")
        print(f"  Accuracy: {accuracy:.2f}%")
        
        # Per-class accuracy
        print(f"\nPer-Class Results:")
        for class_id, class_name in self.label_names.items():
            class_tests = [r for r in self.test_results if r['expected_class'] == class_id]
            if len(class_tests) > 0:
                class_correct = sum(1 for r in class_tests if r['correct'])
                class_acc = class_correct / len(class_tests) * 100
                print(f"  {class_name}:")
                print(f"    Tests: {len(class_tests)}")
                print(f"    Correct: {class_correct}")
                print(f"    Accuracy: {class_acc:.2f}%")
        
        # Confusion information
        print(f"\nConfusion Analysis:")
        for class_id, class_name in self.label_names.items():
            class_tests = [r for r in self.test_results if r['expected_class'] == class_id]
            incorrect = [r for r in class_tests if not r['correct']]
            
            if len(incorrect) > 0:
                print(f"  {class_name} confused with:")
                confusion_counts = {}
                for r in incorrect:
                    pred = r['predicted_name']
                    confusion_counts[pred] = confusion_counts.get(pred, 0) + 1
                
                for pred, count in confusion_counts.items():
                    print(f"    - {pred}: {count} times")
        
        # Save to CSV
        results_file = Path("test_results") / f"accuracy_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        results_file.parent.mkdir(exist_ok=True)
        
        with open(str(results_file), 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.test_results[0].keys())
            writer.writeheader()
            writer.writerows(self.test_results)
        
        print(f"\n✓ Results saved to: {results_file}")
        print("\n" + "="*60)

def main():
    print("\n" + "="*60)
    print(" "*12 + "MODEL ACCURACY TESTING SYSTEM")
    print(" "*10 + "Systematic Gesture Recognition Testing")
    print("="*60)
    
    try:
        tester = AccuracyTester()
        
        print("\n" + "-"*60)
        input("Press Enter to start accuracy testing...")
        
        tester.run_accuracy_test()
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease train the model first:")
        print("  python 3_train_model.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()


