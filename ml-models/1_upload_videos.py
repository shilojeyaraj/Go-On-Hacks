"""
STEP 1: VIDEO UPLOAD ORGANIZER
================================
This script helps you organize your training videos into the correct folders.

Usage:
    python 1_upload_videos.py

What it does:
    - Checks the directory structure
    - Scans for uploaded videos
    - Validates your dataset
    - Provides recommendations for data collection

Video Requirements:
    - Format: .mp4, .avi, .mov, .MOV
    - Duration: 3-10 seconds per video
    - Quality: Clear face, good lighting
    - Content: Natural gestures

Folder Structure:
    videos/
        yes/        Videos of nodding YES (head up-down)
        no/         Videos of shaking NO (head side-to-side)
        neutral/    Videos of neutral/still faces
"""

import os
from pathlib import Path

class VideoOrganizer:
    def __init__(self, base_path="videos"):
        self.base_path = Path(base_path)
        self.categories = ["yes", "no", "neutral"]
        self.setup_directories()
    
    def setup_directories(self):
        """Create directory structure if it doesn't exist"""
        for category in self.categories:
            category_path = self.base_path / category
            category_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Directory structure verified in {self.base_path}/")
        print(f"  - yes/     : Place videos of YES nods (up-down head movement)")
        print(f"  - no/      : Place videos of NO shakes (side-to-side head movement)")
        print(f"  - neutral/ : Place videos of neutral/still faces")
    
    def scan_videos(self):
        """Scan and display uploaded videos"""
        total = 0
        print("\n" + "="*60)
        print(" "*20 + "UPLOADED VIDEOS")
        print("="*60)
        
        for category in self.categories:
            category_path = self.base_path / category
            video_files = list(category_path.glob("*.mp4")) + \
                         list(category_path.glob("*.avi")) + \
                         list(category_path.glob("*.mov")) + \
                         list(category_path.glob("*.MOV"))
            
            count = len(video_files)
            total += count
            
            print(f"\n{category.upper()}: {count} videos")
            if count > 0:
                for i, video in enumerate(video_files[:5]):  # Show first 5
                    file_size = video.stat().st_size / (1024 * 1024)  # MB
                    print(f"  {i+1}. {video.name} ({file_size:.2f} MB)")
                if count > 5:
                    print(f"  ... and {count - 5} more videos")
            else:
                print(f"  ⚠ No videos found in {category_path}")
        
        print("\n" + "="*60)
        print(f"TOTAL: {total} videos")
        print("="*60)
        
        if total == 0:
            print("\n⚠ WARNING: No videos found!")
            print("\nPlease add videos to the folders:")
            print(f"  {self.base_path.absolute()}")
            print("\nVideo Requirements:")
            print("  - Supported formats: .mp4, .avi, .mov")
            print("  - Recommended: 20-50 videos per category")
            print("  - Duration: 3-10 seconds each")
            print("  - Content: Clear face with good lighting")
            return False
        
        return True
    
    def validate_dataset(self):
        """Check if dataset is balanced and sufficient"""
        counts = {}
        for category in self.categories:
            category_path = self.base_path / category
            video_files = list(category_path.glob("*.mp4")) + \
                         list(category_path.glob("*.avi")) + \
                         list(category_path.glob("*.mov")) + \
                         list(category_path.glob("*.MOV"))
            counts[category] = len(video_files)
        
        min_count = min(counts.values())
        max_count = max(counts.values())
        
        print(f"\n{'='*60}")
        print(" "*18 + "DATASET VALIDATION")
        print("="*60)
        
        print(f"\nDataset Balance:")
        for cat, count in counts.items():
            percentage = (count / sum(counts.values()) * 100) if sum(counts.values()) > 0 else 0
            bar = "█" * int(percentage / 2)
            print(f"  {cat.upper():8}: {count:3} videos  {bar} {percentage:.1f}%")
        
        # Check balance
        if max_count > min_count * 2:
            print("\n⚠ WARNING: Dataset is imbalanced!")
            print("  Recommendation: Aim for similar numbers in each category")
            print(f"  Suggestion: Add {max_count - min_count} more videos to '{min(counts, key=counts.get)}'")
        else:
            print("\n✓ Dataset is reasonably balanced")
        
        # Check minimum samples
        if min_count < 10:
            print(f"\n⚠ WARNING: Only {min_count} samples in smallest category")
            print("  Recommendation: Collect at least 20-30 videos per category")
            print("  More videos = Better model accuracy!")
        elif min_count < 20:
            print(f"\n⚠ Notice: {min_count} samples may be sufficient but more is better")
            print("  Recommendation: 30-50 videos per category for best results")
        else:
            print(f"\n✓ Good sample size: {min_count}+ videos per category")
        
        print("\n" + "="*60)
        
        return counts
    
    def provide_tips(self):
        """Provide tips for collecting good training data"""
        print("\n" + "="*60)
        print(" "*18 + "DATA COLLECTION TIPS")
        print("="*60)
        print("\n📹 Recording Good Training Videos:")
        print("  1. Clear Face Visibility")
        print("     - Face should be clearly visible")
        print("     - Avoid obstructions (hair, hands, objects)")
        print()
        print("  2. Good Lighting")
        print("     - Well-lit environment")
        print("     - Avoid backlighting")
        print("     - Natural or indoor lighting works best")
        print()
        print("  3. Natural Gestures")
        print("     - YES: Nod head up and down (2-3 times)")
        print("     - NO: Shake head side to side (2-3 times)")
        print("     - NEUTRAL: Look at camera, minimal movement")
        print()
        print("  4. Variety")
        print("     - Different people (if possible)")
        print("     - Different speeds of gesture")
        print("     - Different backgrounds")
        print("     - With/without glasses")
        print()
        print("  5. Video Length")
        print("     - 3-10 seconds per video")
        print("     - Perform gesture 2-3 times in video")
        print()
        print("="*60)

def main():
    print("\n" + "="*60)
    print(" "*15 + "VIDEO UPLOAD ORGANIZER")
    print(" "*10 + "Gesture Recognition Model Training")
    print("="*60)
    
    organizer = VideoOrganizer()
    
    print("\n📁 INSTRUCTIONS:")
    print("1. Add your training videos to these folders:")
    abs_path = Path("videos").absolute()
    print(f"   {abs_path}\\yes\\")
    print(f"   {abs_path}\\no\\")
    print(f"   {abs_path}\\neutral\\")
    print("\n2. Supported formats: .mp4, .avi, .mov")
    print("\n3. Run this script to verify your uploads")
    
    print("\n" + "-"*60)
    input("\nPress Enter to scan for videos...")
    
    if organizer.scan_videos():
        organizer.validate_dataset()
        organizer.provide_tips()
        
        print("\n" + "="*60)
        print("✓ READY FOR NEXT STEP!")
        print("="*60)
        print("\nYour videos are organized and ready for processing.")
        print("\nNext step: Run 'python 2_extract_features.py'")
        print("           This will process your videos and extract training data.")
        print("\n" + "="*60)
    else:
        organizer.provide_tips()
        print("\nPlease add videos and run this script again.")

if __name__ == "__main__":
    main()

