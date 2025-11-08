"""
STEP 6: TEAM ACCURACY TESTING
==============================
Test model accuracy with multiple team members.

Usage:
    python 6_team_accuracy_test.py

What it does:
    - Collects tester information (name, age, etc.)
    - Runs systematic gesture tests
    - Records results per person
    - Generates team-wide accuracy report
    - Identifies demographic patterns

Perfect for:
    - Testing model generalization
    - Finding bias in training data
    - Collecting data for model improvement
    - Team collaboration
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

class TeamAccuracyTester:
    def __init__(self, model_path="models"):
        self.model_path = Path(model_path)
        
        # Load model
        model_file = self.model_path / "gesture_classifier.h5"
        print("Loading model...")
        self.model = tf.keras.models.load_model(str(model_file))
        
        info_file = self.model_path / "model_info.json"
        with open(str(info_file), 'r') as f:
            self.info = json.load(f)
        
        self.label_names = {int(k): v for k, v in self.info['label_map'].items()}
        self.sequence_length = self.info['input_shape'][0]
        
        # MediaPipe setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.key_landmarks = [1, 10, 152, 33, 263, 61, 291, 199]
        self.frame_buffer = deque(maxlen=self.sequence_length)
        
        print(f"✓ Model loaded")
    
    def collect_tester_info(self):
        """Collect information about the tester"""
        print("\n" + "="*60)
        print(" "*20 + "TESTER INFORMATION")
        print("="*60)
        
        info = {}
        info['name'] = input("\nYour name: ").strip()
        info['age'] = input("Age (optional, press Enter to skip): ").strip()
        info['glasses'] = input("Wearing glasses? (y/n, optional): ").strip().lower() == 'y'
        info['testing_date'] = datetime.now().isoformat()
        
        return info
    
    def extract_landmarks(self, frame):
        """Extract facial landmarks"""
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
        """Predict gesture"""
        if len(self.frame_buffer) < self.sequence_length:
            return None, 0.0, None
        
        sequence = np.array(list(self.frame_buffer))
        sequence = np.expand_dims(sequence, axis=0)
        
        predictions = self.model.predict(sequence, verbose=0)[0]
        predicted_class = np.argmax(predictions)
        confidence = predictions[predicted_class]
        
        return predicted_class, confidence, predictions
    
    def run_tests_for_person(self, tester_info, tests_per_gesture=5):
        """Run systematic tests for one person"""
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot open webcam")
            return []
        
        results = []
        
        print(f"\n\nTesting {tester_info['name']}...")
        print(f"You will perform {tests_per_gesture} tests for each gesture type.")
        print("Follow the on-screen instructions.")
        input("Press Enter when ready...")
        
        # Test each gesture type
        for class_id, class_name in self.label_names.items():
            print(f"\n→ Testing {class_name} gesture ({tests_per_gesture} times)")
            
            for test_num in range(tests_per_gesture):
                print(f"  Test {test_num + 1}/{tests_per_gesture}...")
                
                self.frame_buffer.clear()
                prediction_made = False
                start_time = time.time()
                
                while not prediction_made:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    frame = cv2.flip(frame, 1)
                    h, w = frame.shape[:2]
                    
                    # Extract and predict
                    landmarks = self.extract_landmarks(frame)
                    if landmarks is not None:
                        self.frame_buffer.append(landmarks)
                        
                        result = self.predict_gesture()
                        if result[0] is not None:
                            predicted_class, confidence, _ = result
                            
                            if confidence > 0.5:
                                # Record result
                                test_result = {
                                    'tester_name': tester_info['name'],
                                    'tester_age': tester_info.get('age', ''),
                                    'tester_glasses': tester_info.get('glasses', ''),
                                    'expected_class': class_id,
                                    'expected_name': class_name,
                                    'predicted_class': predicted_class,
                                    'predicted_name': self.label_names[predicted_class],
                                    'confidence': confidence,
                                    'correct': predicted_class == class_id,
                                    'test_number': test_num + 1,
                                    'timestamp': datetime.now().isoformat(),
                                    'response_time': time.time() - start_time
                                }
                                results.append(test_result)
                                prediction_made = True
                                
                                # Visual feedback
                                color = (0, 255, 0) if test_result['correct'] else (0, 0, 255)
                                status = "✓ CORRECT" if test_result['correct'] else "✗ INCORRECT"
                                
                                cv2.rectangle(frame, (0, 0), (w, 150), color, -1)
                                cv2.putText(frame, status, (20, 80),
                                           cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 4)
                                cv2.imshow('Team Testing', frame)
                                cv2.waitKey(1500)  # Show for 1.5 seconds
                                
                                print(f"    {status} - Predicted: {test_result['predicted_name']} ({confidence*100:.1f}%)")
                    
                    # Draw UI
                    overlay = frame.copy()
                    cv2.rectangle(overlay, (10, 10), (w-10, 120), (0, 0, 0), -1)
                    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
                    
                    cv2.putText(frame, f"Perform: {class_name}", (20, 50),
                               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
                    cv2.putText(frame, f"Test {test_num + 1}/{tests_per_gesture}", (20, 90),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
                    # Buffer status
                    buffer_pct = len(self.frame_buffer) / self.sequence_length
                    cv2.rectangle(frame, (10, h-30), (10 + int((w-20) * buffer_pct), h-10),
                                 (0, 255, 0), -1)
                    
                    cv2.imshow('Team Testing', frame)
                    
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        cap.release()
                        cv2.destroyAllWindows()
                        return results
                
                # Brief pause between tests
                time.sleep(0.5)
        
        cap.release()
        cv2.destroyAllWindows()
        
        return results
    
    def generate_team_report(self, all_results):
        """Generate comprehensive team report"""
        if len(all_results) == 0:
            print("\nNo results to report.")
            return
        
        print("\n" + "="*60)
        print(" "*20 + "TEAM ACCURACY REPORT")
        print("="*60)
        
        # Overall statistics
        total = len(all_results)
        correct = sum(1 for r in all_results if r['correct'])
        accuracy = correct / total * 100
        
        print(f"\nOverall Team Results:")
        print(f"  Total tests: {total}")
        print(f"  Correct: {correct}")
        print(f"  Accuracy: {accuracy:.2f}%")
        
        # Per-person results
        print(f"\nPer-Person Results:")
        testers = set(r['tester_name'] for r in all_results)
        
        for tester in sorted(testers):
            tester_results = [r for r in all_results if r['tester_name'] == tester]
            tester_correct = sum(1 for r in tester_results if r['correct'])
            tester_acc = tester_correct / len(tester_results) * 100
            
            print(f"\n  {tester}:")
            print(f"    Tests: {len(tester_results)}")
            print(f"    Correct: {tester_correct}")
            print(f"    Accuracy: {tester_acc:.2f}%")
            
            # Per-gesture for this person
            for class_id, class_name in self.label_names.items():
                class_tests = [r for r in tester_results if r['expected_class'] == class_id]
                if len(class_tests) > 0:
                    class_correct = sum(1 for r in class_tests if r['correct'])
                    class_acc = class_correct / len(class_tests) * 100
                    print(f"      {class_name}: {class_correct}/{len(class_tests)} ({class_acc:.1f}%)")
        
        # Save results
        results_file = Path("test_results") / f"team_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        results_file.parent.mkdir(exist_ok=True)
        
        with open(str(results_file), 'w', newline='') as f:
            if len(all_results) > 0:
                writer = csv.DictWriter(f, fieldnames=all_results[0].keys())
                writer.writeheader()
                writer.writerows(all_results)
        
        print(f"\n✓ Results saved to: {results_file}")
        print("="*60)

def main():
    print("\n" + "="*60)
    print(" "*15 + "TEAM ACCURACY TESTING")
    print(" "*12 + "Multi-Person Model Evaluation")
    print("="*60)
    
    try:
        tester = TeamAccuracyTester()
        
        all_results = []
        
        while True:
            # Collect tester info
            tester_info = tester.collect_tester_info()
            
            if not tester_info['name']:
                print("No name provided. Exiting tester collection.")
                break
            
            # Run tests
            results = tester.run_tests_for_person(tester_info, tests_per_gesture=5)
            all_results.extend(results)
            
            # Ask if more testers
            more = input("\nTest another person? (y/n): ").strip().lower()
            if more != 'y':
                break
        
        # Generate report
        if all_results:
            tester.generate_team_report(all_results)
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()


