"""
QUICK VIDEO RECORDER
====================
Record training videos directly from your webcam!

Usage:
    python record_videos.py

What it does:
    - Opens your webcam
    - Records videos for gesture training
    - Saves directly to the correct folders
    - Makes training data collection easy!

Controls:
    1 - Record YES gesture
    2 - Record NO gesture  
    3 - Record NEUTRAL gesture
    Q - Quit
    
Tips:
    - Each recording is 5 seconds
    - Perform your gesture when recording starts
    - Record 10-15 videos per gesture for best results
"""

import cv2
import time
from pathlib import Path
from datetime import datetime

class VideoRecorder:
    def __init__(self, videos_path="videos"):
        self.videos_path = Path(videos_path)
        self.categories = {
            '1': 'yes',
            '2': 'no',
            '3': 'neutral'
        }
        
        # Ensure directories exist
        for category in self.categories.values():
            (self.videos_path / category).mkdir(parents=True, exist_ok=True)
        
        # Video settings
        self.duration = 10  # seconds per recording
        self.fps = 30
        self.width = 640
        self.height = 480
        
    def record_video(self, category):
        """Record a video for the specified category"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{category}_{timestamp}.mp4"
        filepath = self.videos_path / category / filename
        
        print(f"\n{'='*60}")
        print(f"Recording {category.upper()} gesture for {self.duration} seconds...")
        print(f"{'='*60}")
        print(f"\nTIP: You can perform multiple gestures in {self.duration} seconds!")
        
        if category == 'yes':
            print("Perform: NOD HEAD UP/DOWN + TONGUE LICKING UPWARDS")
        elif category == 'no':
            print("Perform: SHAKE HEAD LEFT/RIGHT + HORIZONTAL TONGUE WAG")
        else:
            print("Perform: STAY STILL OR NEUTRAL")
        
        print("\nRecording starts in:")
        for i in range(3, 0, -1):
            print(f"  {i}...")
            time.sleep(1)
        
        print("\n*** RECORDING NOW! Perform your gesture! ***")
        
        # Open webcam
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        # Define codec and create VideoWriter
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(filepath), fourcc, self.fps, (self.width, self.height))
        
        start_time = time.time()
        frames_recorded = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Cannot read from webcam")
                break
            
            # Mirror the frame for natural interaction
            frame = cv2.flip(frame, 1)
            
            # Calculate elapsed time
            elapsed = time.time() - start_time
            remaining = self.duration - elapsed
            
            if remaining <= 0:
                break
            
            # Draw recording indicator
            cv2.circle(frame, (30, 30), 15, (0, 0, 255), -1)  # Red dot
            cv2.putText(frame, "RECORDING", (55, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Draw countdown
            cv2.putText(frame, f"Time: {remaining:.1f}s", (self.width - 150, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Draw gesture label
            cv2.putText(frame, f"Gesture: {category.upper()}", (self.width // 2 - 80, self.height - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
            
            # Write frame
            out.write(frame)
            frames_recorded += 1
            
            # Display
            cv2.imshow('Recording - Press Q to cancel', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\n[WARNING] Recording cancelled")
                cap.release()
                out.release()
                cv2.destroyAllWindows()
                filepath.unlink()  # Delete incomplete video
                return False
        
        # Clean up
        cap.release()
        out.release()
        cv2.destroyAllWindows()
        
        print(f"\n[SUCCESS] Recording complete!")
        print(f"   Saved: {filepath}")
        print(f"   Frames: {frames_recorded}")
        print(f"   Duration: {self.duration}s")
        
        return True
    
    def run(self):
        """Main recording loop"""
        print("\n" + "="*60)
        print(" "*15 + "GESTURE VIDEO RECORDER")
        print(" "*10 + "Record training videos from webcam")
        print("="*60)
        
        # Test webcam
        print("\nTesting webcam...")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[ERROR] Cannot open webcam!")
            print("   Make sure your webcam is connected and not in use.")
            return
        cap.release()
        print("[OK] Webcam is ready!")
        
        print("\n" + "-"*60)
        print("INSTRUCTIONS:")
        print("-"*60)
        print("  Press 1 - Record YES gesture (nod up/down + tongue lick up)")
        print("  Press 2 - Record NO gesture (shake left/right + tongue wag horizontal)")
        print("  Press 3 - Record NEUTRAL gesture (stay still)")
        print("  Press Q - Quit")
        print("\n  Each recording is 10 seconds long")
        print("  Record 10-15 videos per gesture for best results!")
        print("-"*60)
        
        # Count existing videos
        print("\nCurrent video count:")
        for category in self.categories.values():
            video_files = list((self.videos_path / category).glob("*"))
            video_files = [f for f in video_files if f.suffix.lower() in ['.mp4', '.mov', '.avi', '.webm']]
            print(f"  {category:8}: {len(video_files)} videos")
        
        print("\n" + "="*60)
        print("Ready to record! Press a number key to start...")
        print("="*60 + "\n")
        
        recordings_this_session = {'yes': 0, 'no': 0, 'neutral': 0}
        
        while True:
            # Wait for key press
            print("\nWaiting for command (1=YES, 2=NO, 3=NEUTRAL, Q=QUIT)...")
            
            # Open webcam for preview
            cap = cv2.VideoCapture(0)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            
            while True:
                ret, frame = cap.read()
                if ret:
                    frame = cv2.flip(frame, 1)
                    
                    # Instructions
                    cv2.putText(frame, "1=YES+LICK  2=NO+WAG  3=NEUTRAL  Q=QUIT",
                               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    cv2.putText(frame, f"Recorded: YES={recordings_this_session['yes']} NO={recordings_this_session['no']} NEUTRAL={recordings_this_session['neutral']}",
                               (10, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    
                    cv2.imshow('Video Recorder - Ready', frame)
                
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q'):
                    cap.release()
                    cv2.destroyAllWindows()
                    print("\n" + "="*60)
                    print("SESSION COMPLETE!")
                    print("="*60)
                    print("\nVideos recorded this session:")
                    for category, count in recordings_this_session.items():
                        print(f"  {category:8}: {count} videos")
                    print("\nNext steps:")
                    print("  1. python 2_extract_features.py")
                    print("  2. python 3_train_model.py")
                    print("  3. python quick_test.py")
                    print("\n" + "="*60)
                    return
                
                elif chr(key) in self.categories:
                    category = self.categories[chr(key)]
                    cap.release()
                    cv2.destroyAllWindows()
                    
                    success = self.record_video(category)
                    if success:
                        recordings_this_session[category] += 1
                    
                    # Brief pause before returning to preview
                    print("\nReturning to preview...")
                    time.sleep(1)
                    break
            
            if not cap.isOpened():
                break

def main():
    try:
        recorder = VideoRecorder()
        recorder.run()
    except KeyboardInterrupt:
        print("\n\nRecording interrupted. Goodbye!")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

