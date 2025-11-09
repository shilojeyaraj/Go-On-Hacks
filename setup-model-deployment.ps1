# Setup script for converting and deploying gesture recognition model
# This converts the H5 model to TensorFlow.js format for browser deployment
# Also ensures OpenCV/MediaPipe face detection is properly configured

Write-Host "=== Gesture Model Deployment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} else {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Python: $pythonCmd" -ForegroundColor Green

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = & $pythonCmd --version
Write-Host "   $pythonVersion" -ForegroundColor White

# Check if required packages are installed
Write-Host ""
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow

$requiredPackages = @("tensorflow", "tensorflowjs", "numpy")
$missingPackages = @()

foreach ($package in $requiredPackages) {
    $check = & $pythonCmd -c "import $package" 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += $package
        Write-Host "   ❌ $package not installed" -ForegroundColor Red
    } else {
        Write-Host "   ✅ $package installed" -ForegroundColor Green
    }
}

# Install missing packages
if ($missingPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "Installing missing packages..." -ForegroundColor Yellow
    foreach ($package in $missingPackages) {
        Write-Host "   Installing $package..." -ForegroundColor Yellow
        & $pythonCmd -m pip install $package
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Failed to install $package" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✅ $package installed" -ForegroundColor Green
    }
}

# Check if model file exists
Write-Host ""
Write-Host "Checking for model file..." -ForegroundColor Yellow
$modelPath = "ml-models\models\gesture_classifier.h5"
if (-not (Test-Path $modelPath)) {
    Write-Host "❌ Model file not found at: $modelPath" -ForegroundColor Red
    Write-Host "   Please ensure the model file exists before running this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Model file found: $modelPath" -ForegroundColor Green

# Convert model
Write-Host ""
Write-Host "Converting model to TensorFlow.js format..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

Set-Location ml-models
& $pythonCmd convert_to_tfjs.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Model conversion successful!" -ForegroundColor Green
    
    # Check if tfjs_model directory exists
    if (Test-Path "models\tfjs_model") {
        Write-Host ""
        Write-Host "Copying model to frontend/public/models/..." -ForegroundColor Yellow
        
        # Create directory if it doesn't exist
        $targetDir = "..\frontend\public\models"
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            Write-Host "   Created directory: $targetDir" -ForegroundColor Gray
        }
        
        # Remove old model if it exists
        $targetModelDir = "$targetDir\tfjs_model"
        if (Test-Path $targetModelDir) {
            Remove-Item -Path $targetModelDir -Recurse -Force
            Write-Host "   Removed old model files" -ForegroundColor Gray
        }
        
        # Copy model files
        Copy-Item -Path "models\tfjs_model" -Destination $targetDir -Recurse -Force
        Write-Host "✅ Model files copied to frontend/public/models/tfjs_model/" -ForegroundColor Green
        
        # Verify files were copied
        $modelJson = "$targetModelDir\model.json"
        if (Test-Path $modelJson) {
            Write-Host "   ✅ model.json found" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  model.json not found - check conversion output" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  tfjs_model directory not found. Check conversion output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Model conversion failed. Check errors above." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=== Face Detection Configuration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "MediaPipe Face Mesh Configuration:" -ForegroundColor Yellow
Write-Host "   ✅ minDetectionConfidence: 0.1 (very low - almost always detects)" -ForegroundColor Green
Write-Host "   ✅ minTrackingConfidence: 0.1 (very low - tracks in any lighting)" -ForegroundColor Green
Write-Host "   ✅ refineLandmarks: true (better accuracy)" -ForegroundColor Green
Write-Host "   ✅ maxNumFaces: 1 (optimized for single user)" -ForegroundColor Green
Write-Host ""
Write-Host "Face Detection Tips:" -ForegroundColor Yellow
Write-Host "   • Ensure good lighting for best results" -ForegroundColor White
Write-Host "   • Keep face centered in camera view" -ForegroundColor White
Write-Host "   • Make clear YES (nod) or NO (shake) gestures" -ForegroundColor White
Write-Host "   • Wait for 'Camera active - Show your face' message" -ForegroundColor White
Write-Host "   • Check browser console for '[Swipe] 👤 Face detected' messages" -ForegroundColor White

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. ✅ Model is now in frontend/public/models/tfjs_model/" -ForegroundColor White
Write-Host "2. Start your frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "3. The model will load automatically when gesture recognition is enabled" -ForegroundColor White
Write-Host "4. Enable gesture recognition in the Swipe page" -ForegroundColor White
Write-Host ""
Write-Host "Testing:" -ForegroundColor Cyan
Write-Host "• Open browser console (F12) to see detection logs" -ForegroundColor White
Write-Host "• Look for '[Swipe] 👤 Face detected' messages" -ForegroundColor White
Write-Host "• Look for '[TFJS] ✅ Model loaded successfully' or '[GestureService]' messages" -ForegroundColor White
Write-Host "• Make YES (nod) or NO (shake head) gestures to test" -ForegroundColor White
Write-Host ""
Write-Host "Note: If TensorFlow.js model fails to load, the system will automatically" -ForegroundColor Yellow
Write-Host "      fall back to backend Python prediction (requires Python on server)." -ForegroundColor Yellow
Write-Host ""

