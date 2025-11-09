# MongoDB Installation & Setup Guide for Windows

## Quick Start - Install MongoDB

### Option 1: MongoDB Community Server (Recommended)

1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select:
     - **Version:** Latest (7.0 or newer)
     - **Platform:** Windows
     - **Package:** MSI
   - Click "Download"

2. **Install MongoDB:**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - **IMPORTANT:** Check "Install MongoDB as a Service"
   - Check "Run service as Network Service user"
   - Check "Install MongoDB Compass" (GUI tool - you already have this)
   - Click "Install"

3. **Verify Installation:**
   ```powershell
   # Check if MongoDB service exists
   Get-Service -Name MongoDB
   
   # Check if MongoDB is running
   Get-Service -Name MongoDB | Select-Object Status
   ```

4. **Start MongoDB (if not running):**
   ```powershell
   Start-Service -Name MongoDB
   ```

### Option 2: MongoDB via Chocolatey (If you have Chocolatey)

```powershell
# Install MongoDB
choco install mongodb

# Start MongoDB service
Start-Service -Name MongoDB
```

### Option 3: Manual Installation (Advanced)

If you prefer manual setup:

1. Download MongoDB Community Server ZIP
2. Extract to `C:\mongodb`
3. Create data directory: `C:\data\db`
4. Create log directory: `C:\data\log`
5. Run MongoDB manually:
   ```powershell
   cd C:\mongodb\bin
   .\mongod.exe --dbpath C:\data\db --logpath C:\data\log\mongod.log
   ```

## Verify MongoDB is Running

### Check Service Status:
```powershell
Get-Service -Name MongoDB
```

### Check if Port 27017 is Listening:
```powershell
netstat -an | findstr :27017
```

You should see:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

### Test Connection:
```powershell
# Try connecting with MongoDB shell (if installed)
mongosh
# Or older version:
mongo
```

## Start MongoDB Service

If MongoDB is installed but not running:

```powershell
# Start the service
Start-Service -Name MongoDB

# Verify it's running
Get-Service -Name MongoDB
```

## Auto-Start MongoDB on Boot

MongoDB should automatically start on boot if installed as a service. To verify:

```powershell
# Check startup type
Get-Service -Name MongoDB | Select-Object Name, StartType

# If not set to Automatic, set it:
Set-Service -Name MongoDB -StartupType Automatic
```

## Troubleshooting

### MongoDB Service Won't Start:

1. **Check Windows Event Viewer:**
   - Open Event Viewer
   - Go to Windows Logs > Application
   - Look for MongoDB errors

2. **Check MongoDB Logs:**
   - Default location: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
   - Or check: `C:\data\log\mongod.log`

3. **Common Issues:**
   - **Port 27017 already in use:** Another process is using the port
   - **Permission issues:** Run PowerShell as Administrator
   - **Data directory missing:** Create `C:\data\db` directory

### Fix Permission Issues:

```powershell
# Run PowerShell as Administrator, then:
# Create data directories
New-Item -ItemType Directory -Path "C:\data\db" -Force
New-Item -ItemType Directory -Path "C:\data\log" -Force

# Give MongoDB service access
icacls "C:\data" /grant "NT AUTHORITY\NetworkService:(OI)(CI)F" /T
```

### Port Already in Use:

```powershell
# Find what's using port 27017
netstat -ano | findstr :27017

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Quick Commands Reference

```powershell
# Start MongoDB
Start-Service -Name MongoDB

# Stop MongoDB
Stop-Service -Name MongoDB

# Restart MongoDB
Restart-Service -Name MongoDB

# Check status
Get-Service -Name MongoDB

# Check if running on port
netstat -an | findstr :27017
```

## After Installation

Once MongoDB is running:

1. **Connect MongoDB Compass:**
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"

2. **Start your backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Verify connection in backend logs:**
   ```
   [MongoDB] Connected successfully
   [MongoDB] Database: ToeGether
   ```

4. **View database in Compass:**
   - Refresh (F5) in MongoDB Compass
   - Click on `ToeGether` database
   - Collections will appear as your app creates data

## Next Steps

1. ✅ Install MongoDB Community Server
2. ✅ Verify MongoDB service is running
3. ✅ Connect MongoDB Compass
4. ✅ Start your backend
5. ✅ View your database in Compass

