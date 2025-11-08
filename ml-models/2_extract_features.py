"""
STEP 2: FEATURE EXTRACTION
===========================
This script processes your training videos and extracts facial landmark features.

Usage:
    python 2_extract_features.py

What it does:
    - Loads videos from videos/ folder
    - Uses MediaPipe to detect facial landmarks
    - Extracts key points from each frame
    - Creates training sequences
    - Saves processed data to data/training_data.npz

Technical Details:
    - Uses MediaPipe Face Mesh for landmark detection
    - Tracks 8 key facial points: nose, forehead, chin, eyes, mouth
    - Creates 30-frame sequences for temporal analysis
    - Uses sliding window with 10-frame overlap for more training data

Output:
    - data/training_data.npz: Processed features ready for training
    - data/extraction_stats.json: Statistics about the extraction process
"""

import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path
from tqdm import tqdm
import json
import time

class FeatureExtractor:
    def __init__(self, video_path="videos", output_path="data"):
        self.video_path = Path(video_path)
        self.output_path = Path(output_path)
        self.output_path.mkdir(exist_ok=True)
        
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Focused landmarks for head movement detection
        # YES (vertical nod): Track points that move up/down
        # NO (horizontal shake): Track points that move left/right
        # NEUTRAL: Same points but with minimal movement
        
        # Vertical movement landmarks (for YES - nodding up/down):
        # 1: nose tip, 10: forehead center, 152: chin center
        self.vertical_landmarks = [1, 10, 152]
        
        # Horizontal movement landmarks (for NO - shaking left/right):
        # 33: left eye outer corner, 263: right eye outer corner
        # 1: nose tip (also moves horizontally when shaking)
        self.horizontal_landmarks = [1, 33, 263]
        
        # All key landmarks (union of both sets)
        self.key_landmarks = sorted(list(set(self.vertical_landmarks + self.horizontal_landmarks)))
        
        self.categories = ["yes", "no", "neutral"]
        self.label_map = {"yes": 0, "no": 1, "neutral": 2}
    
    def extract_landmarks_from_frame(self, frame):
        """
        Extract facial landmarks and compute movement-focused features
        
        Args:
            frame: BGR image from OpenCV
            
        Returns:
            numpy array of shape (feature_dim,) containing movement features
            or None if no face detected
        """
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
        
        # Compute movement-focused features:
        # Focus on coordinates that change most for each gesture type
        
        features = []
        
        # Vertical movement features (YES - up/down motion)
        # Use y-coordinates of vertical landmarks (nose, forehead, chin)
        # These move up/down when nodding
        vertical_y = vertical_positions[:, 1]  # y-coordinates
        features.extend(vertical_y.tolist())  # 3 features: nose_y, forehead_y, chin_y
        
        # Horizontal movement features (NO - left/right motion)
        # Use x-coordinates of horizontal landmarks (nose, left eye, right eye)
        # These move left/right when shaking head
        horizontal_x = horizontal_positions[:, 0]  # x-coordinates
        features.extend(horizontal_x.tolist())  # 3 features: nose_x, left_eye_x, right_eye_x
        
        # Add z-coordinates for depth (helps with 3D movement)
        vertical_z = vertical_positions[:, 2]  # z-coordinates (depth)
        features.extend(vertical_z.tolist())  # 3 features: nose_z, forehead_z, chin_z
        
        # Total: 9 features (3 vertical_y + 3 horizontal_x + 3 vertical_z)
        # This focuses the model on:
        # - YES: High variance in vertical_y coordinates
        # - NO: High variance in horizontal_x coordinates  
        # - NEUTRAL: Low variance in all coordinates
        
        return np.array(features)
    
    def process_video(self, video_path, sequence_length=30):
        """
        Process a video and extract landmark sequences
        
        Args:
            video_path: Path to video file
            sequence_length: Number of frames per sequence (default 30, ~1 second at 30fps)
            
        Returns:
            List of numpy arrays, each of shape (sequence_length, 24)
        """
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            print(f"Error opening video: {video_path}")
            return None
        
        sequences = []
        current_sequence = []
        frames_processed = 0
        frames_with_face = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frames_processed += 1
            landmarks = self.extract_landmarks_from_frame(frame)
            
            if landmarks is not None:
                frames_with_face += 1
                current_sequence.append(landmarks)
                
                # Create overlapping sequences for more training data
                if len(current_sequence) == sequence_length:
                    sequences.append(np.array(current_sequence))
                    # Slide window by 10 frames (overlap)
                    current_sequence = current_sequence[10:]
        
        cap.release()
        
        # Handle videos shorter than sequence_length
        if len(sequences) == 0 and len(current_sequence) > sequence_length // 2:
            # Pad short sequences by repeating last frame
            while len(current_sequence) < sequence_length:
                current_sequence.append(current_sequence[-1])
            sequences.append(np.array(current_sequence))
        
        # Calculate face detection rate
        detection_rate = (frames_with_face / frames_processed * 100) if frames_processed > 0 else 0
        
        return sequences, detection_rate
    
    def extract_all_features(self, sequence_length=30):
        """
        Extract features from all videos in the dataset
        
        Args:
            sequence_length: Number of frames per sequence
            
        Returns:
            X: numpy array of shape (num_sequences, sequence_length, 24)
            y: numpy array of shape (num_sequences,) containing labels
        """
        all_sequences = []
        all_labels = []
        stats = {
            "extraction_time": None,
            "sequence_length": sequence_length,
            "categories": {}
        }
        
        print("\n" + "="*60)
        print(" "*15 + "FEATURE EXTRACTION")
        print("="*60)
        print(f"\nSequence length: {sequence_length} frames (~{sequence_length/30:.2f} seconds at 30fps)")
        print(f"Feature extraction strategy:")
        print(f"  - Vertical landmarks (YES): {len(self.vertical_landmarks)} points")
        print(f"  - Horizontal landmarks (NO): {len(self.horizontal_landmarks)} points")
        print(f"  - Focus: Movement patterns (vertical for YES, horizontal for NO)")
        
        start_time = time.time()
        
        for category in self.categories:
            category_path = self.video_path / category
            video_files = list(category_path.glob("*.mp4")) + \
                         list(category_path.glob("*.avi")) + \
                         list(category_path.glob("*.mov")) + \
                         list(category_path.glob("*.MOV"))
            
            # Remove duplicates (Windows is case-insensitive)
            video_files = list(set(video_files))
            
            if len(video_files) == 0:
                print(f"\n[WARNING] No videos found in {category}/")
                continue
            
            print(f"\n{category.upper()}: Processing {len(video_files)} videos...")
            sequences_count = 0
            total_detection_rate = 0
            
            for video_file in tqdm(video_files, desc=f"  {category}"):
                result = self.process_video(video_file, sequence_length)
                
                if result is not None:
                    sequences, detection_rate = result
                    total_detection_rate += detection_rate
                    
                    if sequences:
                        all_sequences.extend(sequences)
                        label = self.label_map[category]
                        all_labels.extend([label] * len(sequences))
                        sequences_count += len(sequences)
            
            avg_detection_rate = total_detection_rate / len(video_files) if len(video_files) > 0 else 0
            
            stats["categories"][category] = {
                "videos": len(video_files),
                "sequences": sequences_count,
                "avg_face_detection_rate": f"{avg_detection_rate:.1f}%"
            }
            
            print(f"  {len(video_files)} videos -> {sequences_count} training sequences")
            print(f"    Average face detection rate: {avg_detection_rate:.1f}%")
        
        extraction_time = time.time() - start_time
        stats["extraction_time"] = f"{extraction_time:.2f} seconds"
        
        if len(all_sequences) == 0:
            print("\n[ERROR] No features extracted!")
            print("   Please check your videos and ensure faces are visible.")
            return None
        
        # Convert to numpy arrays
        X = np.array(all_sequences)
        y = np.array(all_labels)
        
        # Save processed data
        output_file = self.output_path / "training_data.npz"
        np.savez_compressed(
            str(output_file),
            X=X,
            y=y,
            sequence_length=sequence_length,
            label_map=self.label_map
        )
        
        # Save statistics
        stats_file = self.output_path / "extraction_stats.json"
        with open(str(stats_file), 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n" + "="*60)
        print(" "*17 + "EXTRACTION COMPLETE")
        print("="*60)
        print(f"\nTotal sequences extracted: {len(X)}")
        print(f"Sequence shape: {X.shape}")
        print(f"  - {X.shape[0]} samples")
        print(f"  - {X.shape[1]} frames per sequence")
        print(f"  - {X.shape[2]} features per frame")
        print(f"\nData saved to: {output_file}")
        print(f"Statistics saved to: {stats_file}")
        print(f"Extraction time: {extraction_time:.2f} seconds")
        
        # Display label distribution
        unique, counts = np.unique(y, return_counts=True)
        print(f"\nLabel distribution:")
        for label, count in zip(unique, counts):
            label_name = [k for k, v in self.label_map.items() if v == label][0]
            percentage = count / len(y) * 100
            print(f"  {label_name.upper():8}: {count:4} samples ({percentage:.1f}%)")
        
        print("\n" + "="*60)
        print("READY FOR TRAINING!")
        print("="*60)
        print("\nNext step: Run 'python 3_train_model.py'")
        print("           This will train the gesture recognition model.")
        print("\n" + "="*60)
        
        return X, y

def main():
    print("\n" + "="*60)
    print(" "*12 + "FEATURE EXTRACTION PIPELINE")
    print(" "*10 + "Gesture Recognition Model Training")
    print("="*60)
    
    print("\nThis script will:")
    print("  1. Load all videos from the videos/ folder")
    print("  2. Detect faces and extract facial landmarks")
    print("  3. Create training sequences")
    print("  4. Save processed data for model training")
    
    print("\n" + "-"*60)
    # input("Press Enter to start extraction...")
    
    extractor = FeatureExtractor()
    # OPTIMIZED FOR FAST + ACCURATE DETECTION: 15 frames = ~0.5 seconds
    # This is the sweet spot: fast enough for Tinder-style apps, long enough to capture full gesture
    result = extractor.extract_all_features(sequence_length=15)
    
    if result is not None:
        print("\nFeature extraction completed successfully!")
    else:
        print("\n[ERROR] Feature extraction failed!")
        print("   Please check the error messages above.")

if __name__ == "__main__":
    main()

