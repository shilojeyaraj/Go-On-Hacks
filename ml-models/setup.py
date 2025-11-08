"""
ML Pipeline Setup Script
========================
Automated setup for the gesture recognition ML pipeline.

Usage:
    python setup.py

What it does:
    - Checks Python version
    - Installs required packages
    - Verifies directory structure
    - Tests imports
    - Provides next steps
"""

import sys
import subprocess
import os
from pathlib import Path

def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {text.center(58)} ")
    print("="*60 + "\n")

def print_step(step_num, text):
    """Print a step indicator"""
    print(f"\n[Step {step_num}] {text}")
    print("-" * 60)

def check_python_version():
    """Check if Python version is compatible"""
    print_step(1, "Checking Python Version")
    
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    print(f"Python version: {version_str}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ ERROR: Python 3.8 or higher is required")
        print(f"   Current version: {version_str}")
        print("\n   Please upgrade Python:")
        print("   - Download from: https://www.python.org/downloads/")
        return False
    
    print(f"✓ Python {version_str} is compatible")
    return True

def check_pip():
    """Check if pip is available"""
    print_step(2, "Checking pip Installation")
    
    try:
        import pip
        pip_version = pip.__version__
        print(f"pip version: {pip_version}")
        print("✓ pip is installed")
        return True
    except ImportError:
        print("❌ ERROR: pip is not installed")
        print("\n   Please install pip:")
        print("   - https://pip.pypa.io/en/stable/installation/")
        return False

def install_requirements():
    """Install required packages"""
    print_step(3, "Installing Required Packages")
    
    requirements_file = Path("requirements.txt")
    
    if not requirements_file.exists():
        print("❌ ERROR: requirements.txt not found")
        return False
    
    print("Installing packages from requirements.txt...")
    print("This may take 5-10 minutes depending on your internet speed.\n")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("\n✓ All packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ ERROR: Failed to install packages")
        print(f"   Error: {e}")
        print("\n   Try installing manually:")
        print("   pip install -r requirements.txt")
        return False

def verify_directories():
    """Verify directory structure"""
    print_step(4, "Verifying Directory Structure")
    
    required_dirs = [
        "videos/yes",
        "videos/no",
        "videos/neutral",
        "data",
        "models"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists():
            print(f"✓ {dir_path}/ exists")
        else:
            print(f"⚠ {dir_path}/ does not exist - creating...")
            path.mkdir(parents=True, exist_ok=True)
            all_exist = False
    
    if all_exist:
        print("\n✓ All directories exist")
    else:
        print("\n✓ Created missing directories")
    
    return True

def test_imports():
    """Test if all required packages can be imported"""
    print_step(5, "Testing Package Imports")
    
    packages = {
        'cv2': 'OpenCV',
        'mediapipe': 'MediaPipe',
        'numpy': 'NumPy',
        'tensorflow': 'TensorFlow',
        'sklearn': 'scikit-learn',
        'matplotlib': 'Matplotlib',
        'tqdm': 'tqdm'
    }
    
    failed = []
    
    for module, name in packages.items():
        try:
            __import__(module)
            print(f"✓ {name} imports successfully")
        except ImportError as e:
            print(f"❌ {name} failed to import: {e}")
            failed.append(name)
    
    if failed:
        print(f"\n❌ Failed to import: {', '.join(failed)}")
        print("\n   Try reinstalling:")
        print("   pip install --upgrade --force-reinstall -r requirements.txt")
        return False
    
    print("\n✓ All packages import successfully")
    return True

def check_webcam():
    """Check if webcam is accessible"""
    print_step(6, "Checking Webcam Access")
    
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        
        if cap.isOpened():
            ret, frame = cap.read()
            cap.release()
            
            if ret:
                print("✓ Webcam is accessible")
                return True
            else:
                print("⚠ Webcam opened but couldn't read frame")
                print("  This might be OK - webcam may be in use")
                return True
        else:
            print("⚠ Could not open webcam")
            print("  This might be OK if no webcam is connected")
            print("  Webcam is only needed for Step 4 (testing)")
            return True
    except Exception as e:
        print(f"⚠ Error checking webcam: {e}")
        print("  This might be OK - webcam not required for training")
        return True

def print_next_steps():
    """Print instructions for next steps"""
    print_header("SETUP COMPLETE!")
    
    print("Your ML pipeline is ready to use!\n")
    
    print("📚 Quick Reference:\n")
    print("  1. Read Documentation:")
    print("     - README.md (project overview)")
    print("     - QUICKSTART.md (30-minute guide)")
    print("     - ml-models/README.md (technical details)")
    print()
    print("  2. Collect Training Videos:")
    print("     - Place videos in videos/yes/, videos/no/, videos/neutral/")
    print("     - See ml-models/videos/README.md for guidelines")
    print()
    print("  3. Run the Pipeline:")
    print("     - Step 1: python 1_upload_videos.py")
    print("     - Step 2: python 2_extract_features.py")
    print("     - Step 3: python 3_train_model.py")
    print("     - Step 4: python 4_test_model.py")
    print()
    print("🎯 Next Action:")
    print("   Add training videos to the videos/ folder, then run:")
    print("   python 1_upload_videos.py")
    print()
    print("Need help? Check QUICKSTART.md for a complete walkthrough!")
    print("\n" + "="*60 + "\n")

def main():
    """Run the complete setup process"""
    print_header("ML PIPELINE SETUP")
    print("This script will set up your gesture recognition ML pipeline.")
    print("Estimated time: 5-10 minutes")
    
    # Run all checks
    checks = [
        ("Python version", check_python_version),
        ("pip", check_pip),
        ("Install packages", install_requirements),
        ("Directory structure", verify_directories),
        ("Package imports", test_imports),
        ("Webcam", check_webcam)
    ]
    
    failed_checks = []
    
    for check_name, check_func in checks:
        try:
            if not check_func():
                failed_checks.append(check_name)
        except Exception as e:
            print(f"\n❌ Unexpected error in {check_name}: {e}")
            failed_checks.append(check_name)
    
    # Summary
    print_header("SETUP SUMMARY")
    
    if failed_checks:
        print("❌ Setup completed with errors:\n")
        for check in failed_checks:
            print(f"   - {check}")
        print("\nPlease resolve the errors above and run setup again.")
        print("\nFor help:")
        print("  - Check ml-models/README.md")
        print("  - Review error messages above")
        print("  - Ask teammates for assistance")
        return False
    else:
        print_next_steps()
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

