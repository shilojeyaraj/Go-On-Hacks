# Complete Integration Guide - ToeGether with Gesture Recognition

## 🎯 Overview

This application integrates:
- **Backend**: NestJS API with MongoDB and Firebase Auth
- **Frontend**: React app with gesture-controlled swiping
- **ML Model**: Trained gesture recognition model (YES/NO/NEUTRAL)

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**Python (for ML predictions):**
```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Verify packages
pip list | grep tensorflow
pip list | grep numpy
```

### 2. Configure Environment

**Backend `.env`** (copy from `backend/env.template`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ToeGether
FRONTEND_URL=http://localhost:3001
FB_PROJECT_ID=your-firebase-project-id
FB_CLIENT_EMAIL=your-firebase-client-email
FB_PRIVATE_KEY="your-firebase-private-key"
```

**Frontend `.env`** (copy from `frontend/env.example`):
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 3. Verify ML Model

```bash
# Check if model exists
ls ml-models/models/gesture_classifier.h5

# If missing, train it:
cd ml-models
source ../venv/bin/activate
python 2_extract_features.py
python 3_train_model.py
```

### 4. Start Services

**Terminal 1 - MongoDB (if local):**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run start:dev
```
✅ Backend running on: `http://localhost:3000`

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```
✅ Frontend running on: `http://localhost:3001`

### 5. Use the Application

1. Open browser: `http://localhost:3001`
2. Sign up/Log in with Firebase
3. Navigate to **Swipe** page (`/swipe`)
4. Click **"Start Camera"**
5. Wait for buffer to fill (15 frames)
6. Perform gestures:
   - **Nod head up/down** → YES gesture
   - **Shake head left/right** → NO gesture
   - **Stay still** → NEUTRAL

## 📁 Project Structure

```
Go-On-Hacks/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/          # User management
│   │   │   └── gestures/       # Gesture recognition API ✨ NEW
│   │   ├── config/             # Firebase, env config
│   │   └── main.ts             # App entry point
│   ├── package.json
│   └── .env                    # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Swipe/          # Gesture-controlled swipe page ✨ UPDATED
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API services
│   │   └── shared/             # Shared utilities
│   ├── package.json
│   └── .env                    # Frontend environment variables
│
├── ml-models/
│   ├── models/
│   │   └── gesture_classifier.h5  # Trained model
│   ├── predict_gesture.py         # Prediction script ✨ NEW
│   ├── 2_extract_features.py      # Feature extraction
│   └── 3_train_model.py           # Model training
│
└── venv/                       # Python virtual environment
```

## 🔌 API Endpoints

### Gesture Recognition

**POST `/gestures/predict`**
- **Auth**: Required (Firebase token)
- **Body**:
  ```json
  {
    "sequence": [
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],  // Frame 1 (9 features)
      ... // 15 frames total
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "gesture": "YES",
    "confidence": 0.95,
    "probabilities": {
      "YES": 0.95,
      "NO": 0.03,
      "NEUTRAL": 0.02
    },
    "userId": "firebase-uid"
  }
  ```

**POST `/gestures/status`**
- **Auth**: Required
- **Response**:
  ```json
  {
    "modelLoaded": true
  }
  ```

### User Management

**GET `/users/profile`** - Get current user profile
**GET `/users/me`** - Get current user from database

## 🎨 Frontend Features

### Swipe Page (`/swipe`)

- **Webcam Integration**: Real-time video capture
- **Face Detection**: MediaPipe face mesh
- **Feature Extraction**: 9 features per frame
- **Real-time Prediction**: Updates every 500ms
- **Visual Feedback**:
  - Buffer status bar
  - Gesture result with confidence
  - Color-coded gestures (Green=YES, Red=NO, Cyan=NEUTRAL)

## 🔧 Troubleshooting

### Backend Issues

**"Model not found" error:**
```bash
# Check model exists
ls ml-models/models/gesture_classifier.h5

# Train if missing
cd ml-models
source ../venv/bin/activate
python 2_extract_features.py
python 3_train_model.py
```

**Python script errors:**
```bash
# Verify Python
python --version  # Should be 3.8+

# Check packages
pip list | grep tensorflow
pip list | grep numpy

# Install if missing
pip install tensorflow numpy
```

**MongoDB connection:**
```bash
# Check MongoDB is running
mongod --version

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://...
```

### Frontend Issues

**Webcam not working:**
- Grant browser camera permissions
- Use HTTPS in production (required for webcam)
- Check browser console for errors

**MediaPipe not loading:**
- Requires internet connection (CDN)
- Check browser console
- Verify script loads in Network tab

**API connection errors:**
- Verify backend is running on port 3000
- Check `REACT_APP_API_URL` in `.env`
- Check CORS settings in backend

### Performance Issues

**Slow predictions:**
- Reduce prediction interval in `Swipe.tsx`
- Optimize model (reduce sequence length)
- Use GPU for TensorFlow (if available)

**High CPU usage:**
- Reduce video resolution
- Increase prediction interval
- Optimize MediaPipe settings

## 📝 Development Workflow

### Making Changes

1. **Backend changes**: Auto-reloads with `npm run start:dev`
2. **Frontend changes**: Hot-reloads automatically
3. **ML model changes**: Retrain and restart backend

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Test gesture prediction directly
cd ml-models
python predict_gesture.py '[[0.5]*9]*15'
```

## 🚢 Production Deployment

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
# Serve build/ directory with nginx/Apache
```

### Environment Variables

Update production `.env` files with:
- Production MongoDB URI
- Production Firebase credentials
- Production frontend URL
- HTTPS URLs for webcam access

## 📚 Additional Resources

- **Setup Guide**: See `SETUP_GUIDE.md` for detailed setup
- **Quick Start**: See `QUICK_START.md` for quick reference
- **Integration Details**: See `INTEGRATION_SUMMARY.md` for architecture

## 🎯 Next Steps

1. **Add Swipe Actions**: Map gestures to swipe left/right
2. **Gesture History**: Store and display gesture statistics
3. **UI Improvements**: Add animations and better feedback
4. **Performance**: Optimize model and reduce latency
5. **Testing**: Add unit and integration tests

## 💡 Tips

- Keep backend and frontend running in separate terminals
- Check browser console for frontend errors
- Check backend terminal for API errors
- Use browser DevTools Network tab to debug API calls
- Test gesture prediction script directly before testing in app

## 🆘 Getting Help

1. Check logs (backend terminal, browser console)
2. Verify all environment variables are set
3. Ensure all services are running
4. Check model file exists and is valid
5. Verify Python is accessible from backend

---

**Happy Gesturing! 🎉**

