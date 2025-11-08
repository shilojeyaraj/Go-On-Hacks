"""
EXTRACT NEUTRAL FRAMES FROM EXISTING VIDEOS
============================================
Extracts neutral (still) frames from the beginning and end of gesture videos.

Usage:
    python extract_neutral_frames.py

What it does:
    - Looks at YES and NO videos
    - Extracts the first and last few seconds (before/after gestures)
    - Creates new NEUTRAL training videos
    - Saves them to videos/neutral/
"""

import cv2
from pathlib import Path
import numpy as np

def extract_neutral_segments(input_video, output_video, start_seconds=1.5, end_seconds=1.5):
    """
    Extract neutral segments from start and end of a video
    
    Args:
        input_video: Path to input video
        output_video: Path to output video
        start_seconds: Seconds to extract from beginning
        end_seconds: Seconds to extract from end
    """
    cap = cv2.VideoCapture(str(input_video))
    
    if not cap.isOpened():
        print(f"  [SKIP] Could not open: {input_video.name}")
        return False
    
    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if fps == 0 or total_frames == 0:
        print(f"  [SKIP] Invalid video: {input_video.name}")
        cap.release()
        return False
    
    # Calculate frame ranges
    start_frames = int(start_seconds * fps)
    end_frames = int(end_seconds * fps)
    
    if total_frames < (start_frames + end_frames):
        print(f"  [SKIP] Video too short: {input_video.name}")
        cap.release()
        return False
    
    # Setup video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_video), fourcc, fps, (width, height))
    
    frames_written = 0
    
    # Extract start frames
    for i in range(start_frames):
        ret, frame = cap.read()
        if ret:
            out.write(frame)
            frames_written += 1
        else:
            break
    
    # Jump to end segment
    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames - end_frames)
    
    # Extract end frames
    for i in range(end_frames):
        ret, frame = cap.read()
        if ret:
            out.write(frame)
            frames_written += 1
        else:
            break
    
    cap.release()
    out.release()
    
    print(f"  [OK] Created: {output_video.name} ({frames_written} frames)")
    return True

def main():
    print("\n" + "="*60)
    print(" "*10 + "EXTRACT NEUTRAL FRAMES")
    print(" "*5 + "Create NEUTRAL videos from existing footage")
    print("="*60)
    
    videos_path = Path("videos")
    neutral_path = videos_path / "neutral"
    neutral_path.mkdir(exist_ok=True)
    
    # Get YES and NO videos
    source_categories = ["yes", "no"]
    all_source_videos = []
    
    for category in source_categories:
        category_path = videos_path / category
        videos = list(category_path.glob("*.mp4")) + \
                list(category_path.glob("*.mov")) + \
                list(category_path.glob("*.MOV"))
        videos = list(set(videos))  # Remove duplicates
        all_source_videos.extend([(category, v) for v in videos])
    
    print(f"\nFound {len(all_source_videos)} source videos")
    print(f"Will extract neutral segments from:")
    print(f"  - First 1.5 seconds (before gesture starts)")
    print(f"  - Last 1.5 seconds (after gesture ends)")
    print()
    
    if len(all_source_videos) == 0:
        print("[ERROR] No source videos found!")
        return
    
    # Extract neutral segments
    created_count = 0
    
    for category, video_path in all_source_videos:
        # Create output filename
        base_name = video_path.stem
        output_name = f"neutral_from_{category}_{base_name}.mp4"
        output_path = neutral_path / output_name
        
        # Skip if already exists
        if output_path.exists():
            print(f"  [SKIP] Already exists: {output_name}")
            continue
        
        print(f"Processing: {video_path.name}")
        if extract_neutral_segments(video_path, output_path):
            created_count += 1
    
    print("\n" + "="*60)
    print(f"COMPLETE!")
    print("="*60)
    print(f"\nCreated {created_count} new NEUTRAL videos")
    
    # Count total neutral videos
    neutral_videos = list(neutral_path.glob("*.mp4")) + \
                    list(neutral_path.glob("*.mov")) + \
                    list(neutral_path.glob("*.MOV"))
    neutral_videos = list(set(neutral_videos))
    
    print(f"Total NEUTRAL videos now: {len(neutral_videos)}")
    print("\nNext steps:")
    print("  1. python 2_extract_features.py")
    print("  2. python 3_train_model.py")
    print("  3. python quick_test.py")
    print("\n" + "="*60)

if __name__ == "__main__":
    main()

