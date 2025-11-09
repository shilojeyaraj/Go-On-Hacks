# Complete Setup Guide - ToeGether with Gesture Recognition

This guide will help you set up and run the complete application with integrated gesture recognition.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (v3.8 or higher)
3. **MongoDB** (running locally or connection string)
4. **Firebase Project** (for authentication)

## Project Structure

```
Go-On-Hacks/
├── backend/          # NestJS backend API
├── frontend/          # React frontend
├── ml-models/         # Python ML model and scripts
└── venv/             # Python virtual environment
```

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
npm install
```

### 1.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ToeGether
FRONTEND_URL=http://localhost:3001
FB_PROJECT_ID=your-firebase-project-id
FB_CLIENT_EMAIL=your-firebase-client-email
FB_PRIVATE_KEY="your-firebase-private-key"
```

### 1.3 Install Python Dependencies (for gesture prediction)

The backend uses a Python script to run ML model predictions. Make sure you have the required packages:

```bash
# Activate your Python virtual environment
cd ..
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages (if not already installed)
pip install tensorflow numpy
```

### 1.4 Start Backend Server

```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3000`

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
PORT=3001
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 2.3 Start Frontend Development Server

```bash
npm start
```

The frontend will run on `http://localhost:3001`

## Step 3: ML Model Setup

### 3.1 Verify Model Exists

Make sure the trained model is in place:

```bash
ls ml-models/models/gesture_classifier.h5
```

If the model doesn't exist, train it first:

```bash
cd ml-models
source ../venv/bin/activate  # On Windows: ..\venv\Scripts\activate
python 2_extract_features.py
python 3_train_model.py
```

### 3.2 Test Prediction Script

Test that the prediction script works:

```bash
cd ml-models
python predict_gesture.py '[[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5]]'
```

You should see a JSON response with gesture prediction.

## Step 4: Running the Complete Application

### Option A: Run Everything Separately (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 3 - MongoDB (if running locally):**
```bash
mongod
```

### Option B: Create a Startup Script

Create `start-all.sh` (Linux/Mac) or `start-all.bat` (Windows):

**start-all.sh:**
```bash
#!/bin/bash

# Start MongoDB (if local)
# mongod &

# Start Backend
cd backend
npm run start:dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start Frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

**start-all.bat (Windows):**
```batch
@echo off
start "Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 5
start "Frontend" cmd /k "cd frontend && npm start"
```

## Step 5: Using Gesture Recognition

1. **Start the application** (backend and frontend)
2. **Log in** to the application
3. **Navigate to the Swipe page** (`/swipe`)
4. **Click "Start Camera"** to enable webcam
5. **Wait for buffer to fill** (15 frames = ~0.5 seconds)
6. **Perform gestures:**
   - **YES**: Nod your head up and down
   - **NO**: Shake your head left and right
   - **NEUTRAL**: Stay still

The gesture recognition will update in real-time with confidence scores.

## API Endpoints

### Gesture Recognition

**POST `/gestures/predict`**
- Requires authentication (Firebase token)
- Body: `{ "sequence": [[...9 features...], ...15 frames...] }`
- Returns: `{ "success": true, "gesture": "YES|NO|NEUTRAL", "confidence": 0.95, "probabilities": {...} }`

**POST `/gestures/status`**
- Returns: `{ "modelLoaded": true }`

### User Management

**GET `/users/profile`**
- Returns current user profile

**GET `/users/me`**
- Returns current user from database

## Troubleshooting

### Backend Issues

1. **"Model not found" error:**
   - Ensure `ml-models/models/gesture_classifier.h5` exists
   - Train the model if needed: `cd ml-models && python 3_train_model.py`

2. **Python script errors:**
   - Verify Python is in PATH: `python --version`
   - Check virtual environment is activated
   - Install dependencies: `pip install tensorflow numpy`

3. **MongoDB connection errors:**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env` is correct

### Frontend Issues

1. **Webcam not working:**
   - Check browser permissions for camera access
   - Use HTTPS in production (required for webcam)

2. **MediaPipe not loading:**
   - Check internet connection (CDN required)
   - Check browser console for errors

3. **API connection errors:**
   - Verify backend is running on port 3000
   - Check `REACT_APP_API_URL` in frontend `.env`

### Performance Issues

1. **Slow predictions:**
   - Reduce `PREDICTION_INTERVAL` in `Swipe.tsx`
   - Optimize model (reduce sequence length)

2. **High CPU usage:**
   - Reduce video resolution
   - Increase prediction interval

## Production Deployment

### Backend

1. Build the application:
```bash
cd backend
npm run build
```

2. Start production server:
```bash
npm run start:prod
```

### Frontend

1. Build the application:
```bash
cd frontend
npm run build
```

2. Serve the `build/` directory using a web server (nginx, Apache, etc.)

### Environment Variables

Make sure to set production environment variables:
- Use production MongoDB URI
- Use production Firebase credentials
- Set `FRONTEND_URL` to your production frontend URL

## Next Steps

- Add gesture-based swiping functionality
- Integrate with matching algorithm
- Add gesture history/logging
- Optimize model for better performance
- Add unit tests

## Support

For issues or questions, check:
- Backend logs in terminal
- Frontend console in browser
- MongoDB logs
- Python script output

