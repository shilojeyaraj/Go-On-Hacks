# Setup script for converting and deploying gesture recognition model

# This converts the H5 model to TensorFlow.js format for browser deployment

Write-Host "=== Gesture Model Deployment Setup ===" -ForegroundColor Cyan

Write-Host ""

# Check if Python is available
$pythonCmd = $null

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} else {
    Write-Host "Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

Write-Host "Found Python: $pythonCmd" -ForegroundColor Green

# Check if tensorflowjs is installed
Write-Host "Checking for tensorflowjs..." -ForegroundColor Yellow

$tfjsCheck = & $pythonCmd -c "import tensorflowjs" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing tensorflowjs..." -ForegroundColor Yellow
    & $pythonCmd -m pip install tensorflowjs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install tensorflowjs" -ForegroundColor Red
        exit 1
    }
    Write-Host "tensorflowjs installed" -ForegroundColor Green
} else {
    Write-Host "tensorflowjs already installed" -ForegroundColor Green
}

# Convert model
Write-Host ""
Write-Host "Converting model to TensorFlow.js format..." -ForegroundColor Yellow

Set-Location ml-models

& $pythonCmd convert_to_tfjs.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Model conversion successful!" -ForegroundColor Green
    
    # Check if tfjs_model directory exists
    if (Test-Path "models\tfjs_model") {
        Write-Host ""
        Write-Host "Copying model to frontend/public/models/..." -ForegroundColor Yellow
        
        # Create directory if it doesn't exist
        $targetDir = "..\frontend\public\models"
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        # Copy model files
        Copy-Item -Path "models\tfjs_model\*" -Destination "$targetDir\tfjs_model\" -Recurse -Force
        Write-Host "Model files copied to frontend/public/models/tfjs_model/" -ForegroundColor Green
    } else {
        Write-Host "tfjs_model directory not found. Check conversion output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "Model conversion failed. Check errors above." -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. The model is now in frontend/public/models/tfjs_model/" -ForegroundColor White
Write-Host "2. Start your frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "3. The model will load automatically when gesture recognition is enabled" -ForegroundColor White

Write-Host ""
Write-Host "Note: If TensorFlow.js model fails to load, the system will automatically" -ForegroundColor Yellow
Write-Host "      fall back to backend Python prediction (requires Python on server)." -ForegroundColor Yellow

