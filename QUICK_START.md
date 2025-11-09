# Quick Start Guide

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be v18+

# Check Python
python --version  # Should be v3.8+

# Check MongoDB (if local)
mongod --version
```

## Step-by-Step Setup

### 1. Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from env.template)
cp env.template .env
# Edit .env with your Firebase credentials

# Start backend
npm run start:dev
```

Backend will run on: `http://localhost:3000`

### 2. Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (copy from env.example)
cp env.example .env
# Edit .env with your Firebase credentials

# Start frontend
npm start
```

Frontend will run on: `http://localhost:3001`

### 3. Verify ML Model

```bash
# Check model exists
ls ml-models/models/gesture_classifier.h5

# If missing, train it:
cd ml-models
source ../venv/bin/activate  # Windows: ..\venv\Scripts\activate
python 2_extract_features.py
python 3_train_model.py
```

### 4. Test the Integration

1. Open browser: `http://localhost:3001`
2. Log in with Firebase
3. Navigate to `/swipe`
4. Click "Start Camera"
5. Perform gestures (nod for YES, shake for NO)

## Troubleshooting

**Backend won't start:**
- Check MongoDB is running
- Verify `.env` file exists and has correct values
- Check port 3000 is not in use

**Frontend won't start:**
- Check port 3001 is not in use
- Verify `.env` file exists
- Clear browser cache

**Gesture recognition not working:**
- Check model file exists: `ml-models/models/gesture_classifier.h5`
- Verify Python is in PATH
- Check backend logs for Python script errors
- Ensure webcam permissions are granted

## API Testing

Test the gesture endpoint:

```bash
# Get auth token from Firebase (in browser console after login)
# Then test:
curl -X POST http://localhost:3000/gestures/predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sequence": [[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5], ...15 frames...]}'
```

## Next Steps

- Customize gesture actions (swipe left/right based on gesture)
- Add gesture history
- Improve UI/UX
- Add error handling

