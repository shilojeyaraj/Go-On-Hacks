# Windows Setup Guide for ML Pipeline

## Issue: Python 3.13 Compatibility

MediaPipe and TensorFlow do not yet support Python 3.13. You need Python 3.11 or 3.12.

## Solution: Install Python 3.11/3.12

### Option 1: Install Python 3.11 Alongside Python 3.13

1. **Download Python 3.11**
   - Go to: https://www.python.org/downloads/release/python-31110/
   - Download "Windows installer (64-bit)"

2. **Install Python 3.11**
   - Run the installer
   - ✅ Check "Add Python 3.11 to PATH"
   - Click "Install Now"

3. **Verify Installation**
   ```powershell
   py -3.11 --version
   # Should show: Python 3.11.x
   ```

4. **Create Virtual Environment**
   ```powershell
   cd C:\Users\shilo\GoonHacks\Go-On-Hacks\ml-models
   py -3.11 -m venv venv
   ```

5. **Activate Virtual Environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an execution policy error:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\venv\Scripts\Activate.ps1
   ```

6. **Install Requirements**
   ```powershell
   pip install -r requirements.txt
   ```

7. **Run the Pipeline**
   ```powershell
   python 2_extract_features.py
   python 3_train_model.py
   python 4_test_model.py
   ```

### Option 2: Use Conda (Alternative)

1. **Download Anaconda**
   - Go to: https://www.anaconda.com/download
   - Download and install

2. **Create Environment with Python 3.11**
   ```powershell
   conda create -n feet-swipe python=3.11
   conda activate feet-swipe
   ```

3. **Install Requirements**
   ```powershell
   cd C:\Users\shilo\GoonHacks\Go-On-Hacks\ml-models
   pip install -r requirements.txt
   ```

4. **Run the Pipeline**
   ```powershell
   python 2_extract_features.py
   python 3_train_model.py
   python 4_test_model.py
   ```

## Quick Commands Reference

### After Python 3.11 is installed:

```powershell
# Navigate to project
cd C:\Users\shilo\GoonHacks\Go-On-Hacks\ml-models

# Create virtual environment (only once)
py -3.11 -m venv venv

# Activate virtual environment (every time)
.\venv\Scripts\Activate.ps1

# Install packages (only once)
pip install -r requirements.txt

# Run training pipeline
python 2_extract_features.py  # Extract features from videos
python 3_train_model.py        # Train the model
python 4_test_model.py         # Test with webcam

# Deactivate when done
deactivate
```

## Troubleshooting

### "py -3.11" not found
- Python 3.11 is not installed or not in PATH
- Reinstall Python 3.11 and check "Add to PATH"

### PowerShell execution policy error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Import errors after installing
- Make sure virtual environment is activated
- Try upgrading pip: `python -m pip install --upgrade pip`
- Reinstall packages: `pip install --upgrade --force-reinstall -r requirements.txt`

### "Access Denied" errors
- Run PowerShell as Administrator
- Or use Command Prompt instead

## Current Status

**Your videos:**
- YES: 5 videos ✅
- NO: 7 videos ✅
- NEUTRAL: 0 videos ⚠️ (recommended to add some)

**Next steps:**
1. Install Python 3.11 or 3.12
2. Create virtual environment
3. Install requirements
4. Run the training pipeline!


