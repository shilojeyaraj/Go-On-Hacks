"""
TEST LAUNCHER
=============
Interactive menu to choose and launch testing scripts.

Usage:
    python test_launcher.py

What it does:
    - Shows menu of testing options
    - Launches selected test script
    - Provides guidance and tips
"""

import subprocess
import sys
from pathlib import Path

def print_banner():
    print("\n" + "="*60)
    print(" "*15 + "🧪 TESTING SYSTEM LAUNCHER")
    print(" "*10 + "Gesture Recognition Model Testing")
    print("="*60)

def check_model_exists():
    """Check if model file exists"""
    model_file = Path("models/gesture_classifier.h5")
    return model_file.exists()

def print_menu():
    print("\n📋 Available Tests:\n")
    print("  1. Quick Test          - Minimal demo (fastest)")
    print("  2. Real-time Test      - Full-featured testing")
    print("  3. Accuracy Test       - Systematic evaluation")
    print("  4. Team Test           - Multi-person testing")
    print("  5. Analyze Results     - View saved results")
    print()
    print("  6. View Test Guide     - Open testing documentation")
    print("  7. Check System Status - Verify setup")
    print()
    print("  Q. Quit")
    print()

def quick_test():
    """Launch quick test"""
    print("\n🚀 Launching Quick Test...")
    print("\nControls:")
    print("  Q - Quit")
    print("\nJust perform gestures in front of camera!")
    input("\nPress Enter to start...")
    
    subprocess.run([sys.executable, "quick_test.py"])

def realtime_test():
    """Launch real-time test"""
    print("\n🎥 Launching Real-time Test...")
    print("\nControls:")
    print("  Q - Quit")
    print("  R - Reset buffer")
    print("  S - Toggle statistics")
    print("\nFull-featured testing with detailed feedback!")
    input("\nPress Enter to start...")
    
    subprocess.run([sys.executable, "4_test_model.py"])

def accuracy_test():
    """Launch accuracy test"""
    print("\n📊 Launching Accuracy Test...")
    print("\nHow it works:")
    print("  1. Press 1-3 to select gesture to test")
    print("  2. Perform the gesture")
    print("  3. Press Y if correct, N if wrong")
    print("  4. Repeat for different gestures")
    print("  5. Press Q to see accuracy report")
    print("\nRecommendation: Test each gesture 10+ times")
    input("\nPress Enter to start...")
    
    subprocess.run([sys.executable, "5_accuracy_test.py"])

def team_test():
    """Launch team test"""
    print("\n👥 Launching Team Test...")
    print("\nHow it works:")
    print("  1. Enter tester name and info")
    print("  2. Follow on-screen prompts")
    print("  3. Perform 5 tests per gesture")
    print("  4. System auto-calculates accuracy")
    print("  5. Test next person or view report")
    print("\nBest with 3-5 team members!")
    input("\nPress Enter to start...")
    
    subprocess.run([sys.executable, "6_team_accuracy_test.py"])

def analyze_results():
    """Launch results analyzer"""
    print("\n📈 Launching Results Analyzer...")
    print("\nThis will:")
    print("  - Load all CSV files from test_results/")
    print("  - Calculate comprehensive statistics")
    print("  - Generate visualization charts")
    print("  - Save analysis plot")
    
    results_dir = Path("test_results")
    csv_files = list(results_dir.glob("*.csv"))
    
    if not csv_files:
        print("\n⚠️  No test results found!")
        print("    Run some tests first (options 1-4)")
        input("\nPress Enter to return to menu...")
        return
    
    print(f"\nFound {len(csv_files)} result files to analyze")
    input("\nPress Enter to start...")
    
    subprocess.run([sys.executable, "analyze_results.py"])

def view_guide():
    """Open testing guide"""
    print("\n📖 Opening Testing Guide...")
    guide_file = Path("TESTING_GUIDE.md")
    
    if not guide_file.exists():
        print("❌ Testing guide not found!")
        input("\nPress Enter to continue...")
        return
    
    print(f"\nGuide location: {guide_file.absolute()}")
    print("\nKey sections:")
    print("  - Testing Scripts Overview")
    print("  - Testing Protocol")
    print("  - Understanding Results")
    print("  - Troubleshooting")
    print("  - Best Practices")
    
    choice = input("\nOpen in default editor? (y/n): ").strip().lower()
    if choice == 'y':
        import os
        os.startfile(str(guide_file))
    
    input("\nPress Enter to return to menu...")

def check_status():
    """Check system status"""
    print("\n🔍 Checking System Status...")
    print("\n" + "-"*60)
    
    # Check Python version
    import sys
    py_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"Python Version: {py_version}")
    
    if sys.version_info.major == 3 and sys.version_info.minor == 13:
        print("  ⚠️  Python 3.13 detected - may cause issues!")
        print("  Recommendation: Use Python 3.11 or 3.12")
    else:
        print("  ✅ Python version OK")
    
    # Check model
    print(f"\nModel Status:")
    if check_model_exists():
        model_file = Path("models/gesture_classifier.h5")
        size_mb = model_file.stat().st_size / (1024 * 1024)
        print(f"  ✅ Model found: {size_mb:.2f} MB")
        
        # Check model info
        info_file = Path("models/model_info.json")
        if info_file.exists():
            import json
            with open(info_file, 'r') as f:
                info = json.load(f)
            print(f"  ✅ Validation accuracy: {info['val_accuracy']*100:.2f}%")
            print(f"  ✅ Classes: {', '.join(info['label_map'].values())}")
        else:
            print("  ⚠️  Model info not found")
    else:
        print("  ❌ Model not found!")
        print("  Action: Run 'python 3_train_model.py'")
    
    # Check test results
    print(f"\nTest Results:")
    results_dir = Path("test_results")
    if results_dir.exists():
        csv_files = list(results_dir.glob("*.csv"))
        print(f"  Saved tests: {len(csv_files)}")
        if csv_files:
            print("  ✅ Can run analysis")
        else:
            print("  ℹ️  No test results yet")
    else:
        print("  ℹ️  Test results directory not found")
    
    # Check packages
    print(f"\nRequired Packages:")
    required = ['cv2', 'mediapipe', 'tensorflow', 'numpy', 'sklearn', 'matplotlib']
    
    for package in required:
        try:
            if package == 'cv2':
                import cv2
                name = 'opencv-python'
            elif package == 'sklearn':
                import sklearn
                name = 'scikit-learn'
            else:
                __import__(package)
                name = package
            print(f"  ✅ {name}")
        except ImportError:
            print(f"  ❌ {package} not installed")
    
    print("\n" + "-"*60)
    input("\nPress Enter to return to menu...")

def main():
    """Main menu loop"""
    print_banner()
    
    # Check if model exists
    if not check_model_exists():
        print("\n⚠️  WARNING: Model not found!")
        print("   You need to train the model first:")
        print("   python 3_train_model.py")
        print()
        choice = input("Continue anyway? (y/n): ").strip().lower()
        if choice != 'y':
            print("\nExiting...")
            return
    
    while True:
        print_menu()
        choice = input("Select option (1-7, Q): ").strip().upper()
        
        if choice == '1':
            quick_test()
        elif choice == '2':
            realtime_test()
        elif choice == '3':
            accuracy_test()
        elif choice == '4':
            team_test()
        elif choice == '5':
            analyze_results()
        elif choice == '6':
            view_guide()
        elif choice == '7':
            check_status()
        elif choice == 'Q':
            print("\n👋 Goodbye!")
            break
        else:
            print("\n❌ Invalid choice. Please try again.")
            input("Press Enter to continue...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


