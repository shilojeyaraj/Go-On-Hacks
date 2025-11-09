# MongoDB Setup Script for Windows
# Run this script as Administrator

Write-Host "=== MongoDB Setup Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs Administrator privileges!" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if MongoDB service exists
Write-Host "Checking for MongoDB installation..." -ForegroundColor Cyan
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

if ($mongoService) {
    Write-Host "✅ MongoDB service found!" -ForegroundColor Green
    
    # Check if running
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB is already running!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB service exists but is not running" -ForegroundColor Yellow
        Write-Host "Starting MongoDB service..." -ForegroundColor Cyan
        try {
            Start-Service -Name "MongoDB"
            Start-Sleep -Seconds 2
            $mongoService = Get-Service -Name "MongoDB"
            if ($mongoService.Status -eq "Running") {
                Write-Host "✅ MongoDB started successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to start MongoDB" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Error starting MongoDB: $_" -ForegroundColor Red
        }
    }
    
    # Set to auto-start
    Set-Service -Name "MongoDB" -StartupType Automatic -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB set to start automatically on boot" -ForegroundColor Green
    
} else {
    Write-Host "❌ MongoDB is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install MongoDB:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Select: Windows, MSI package" -ForegroundColor White
    Write-Host "3. During installation, check 'Install MongoDB as a Service'" -ForegroundColor White
    Write-Host "4. After installation, run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install via Chocolatey (if you have it):" -ForegroundColor Yellow
    Write-Host "  choco install mongodb" -ForegroundColor White
    Write-Host ""
}

# Check if port 27017 is listening
Write-Host ""
Write-Host "Checking if MongoDB is listening on port 27017..." -ForegroundColor Cyan
$portCheck = netstat -an | Select-String ":27017" | Select-String "LISTENING"

if ($portCheck) {
    Write-Host "✅ MongoDB is listening on port 27017" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port 27017 is not listening" -ForegroundColor Yellow
    Write-Host "MongoDB may not be running or may be using a different port" -ForegroundColor Yellow
}

# Test connection
Write-Host ""
Write-Host "Testing MongoDB connection..." -ForegroundColor Cyan
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Successfully connected to MongoDB!" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot connect to MongoDB on port 27017" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Could not test connection: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open MongoDB Compass" -ForegroundColor White
Write-Host "2. Connect to: mongodb://localhost:27017" -ForegroundColor White
Write-Host "3. Start your backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

