# ToeGether - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features Implemented](#features-implemented)
3. [Tech Stack](#tech-stack)
4. [Project Architecture](#project-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Pages](#frontend-pages)
8. [Setup Instructions](#setup-instructions)
9. [How Everything Works](#how-everything-works)
10. [Running the Application](#running-the-application)
11. [MongoDB Compass Integration](#mongodb-compass-integration)
12. [Troubleshooting](#troubleshooting)
13. [Next Steps & Future Enhancements](#next-steps--future-enhancements)

---

## 🎯 Project Overview

**ToeGether** is a full-stack dating application with the following key features:
- User authentication via Firebase
- Profile management with feet photos
- Mutual matching system (both users must swipe right)
- Real-time chat functionality
- Gesture-controlled swiping (using ML head gesture recognition)
- MongoDB for data persistence

### Project Structure

```
Go-On-Hacks/
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/       # User management & matching
│   │   │   ├── chat/        # Chat functionality
│   │   │   └── gestures/    # ML gesture recognition
│   │   ├── common/          # Guards, interceptors, interfaces
│   │   └── main.ts
│   └── package.json
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API service layers
│   │   └── shared/          # Shared utilities & API config
│   └── package.json
│
├── ml-models/               # Machine learning models
│   ├── models/
│   │   └── gesture_classifier.h5
│   └── predict_gesture.py
│
└── venv/                    # Python virtual environment
```

---

## ✨ Features Implemented

### 1. **Authentication System**
- ✅ Email/Password authentication
- ✅ Google OAuth sign-in
- ✅ Password reset functionality
- ✅ Protected routes
- ✅ Firebase token-based authorization
- ✅ Automatic user sync to MongoDB

### 2. **User Profile Management**
- ✅ Profile creation and editing
- ✅ Profile picture upload (base64)
- ✅ Multiple feet photos upload
- ✅ Bio and personal information
- ✅ Preferences (arch type, size, age, etc.)
- ✅ Profile completion tracking
- ✅ User preferences matching

### 3. **Matching System**
- ✅ Swipe functionality (like/pass)
- ✅ **Mutual matching** - Both users must swipe right
- ✅ Discover profiles (users you haven't swiped on)
- ✅ Match list (only mutual matches)
- ✅ Swipe history tracking

### 4. **Chat System**
- ✅ Real-time messaging (auto-refresh every 3 seconds)
- ✅ Conversation management
- ✅ Message history
- ✅ Unread message counts
- ✅ Timestamp formatting
- ✅ Only mutual matches can chat
- ✅ Instagram-style chat UI (sidebar + main chat)

### 5. **Gesture Recognition (ML)**
- ✅ Webcam integration
- ✅ MediaPipe face detection
- ✅ Real-time gesture prediction
- ✅ Head gesture recognition (YES/NO/NEUTRAL)
- ✅ Visual feedback and confidence scores
- ✅ Python backend integration

### 6. **UI/UX Features**
- ✅ Responsive design
- ✅ Navigation bar
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Modern, Instagram-inspired design

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI framework
- **TypeScript** 4.9.5 - Type safety
- **React Router DOM** 6.15.0 - Client-side routing
- **Axios** 1.6.0 - HTTP client
- **Firebase SDK** 10.7.1 - Authentication
- **MediaPipe** (CDN) - Face landmark detection

### Backend
- **NestJS** 10.0.0 - Node.js framework
- **TypeScript** 5.1.3 - Type safety
- **Mongoose** 8.0.0 - MongoDB ODM
- **Firebase Admin SDK** 12.0.0 - Server-side auth
- **Express.js** (via NestJS) - Web framework

### Database
- **MongoDB** - NoSQL document database
- **Database Name:** `ToeGether`

### Machine Learning
- **Python** 3.8+
- **TensorFlow** 2.15.0 - Deep learning framework
- **Keras** - High-level neural network API
- **MediaPipe** 0.10.8 - Face detection
- **OpenCV** 4.8.1.78 - Video processing
- **NumPy** 1.24.3 - Numerical computing

### Development Tools
- **MongoDB Compass** - Database GUI
- **Git** - Version control
- **npm** - Package manager
- **pip** - Python package manager

---

## 🏗️ Project Architecture

### Backend Architecture (NestJS)

```
Backend/
├── Modules (Feature-based)
│   ├── Users Module
│   │   ├── User Schema (MongoDB)
│   │   ├── Swipe Schema (MongoDB)
│   │   ├── Users Service (Business Logic)
│   │   └── Users Controller (API Endpoints)
│   │
│   ├── Chat Module
│   │   ├── Conversation Schema
│   │   ├── Message Schema
│   │   ├── Chat Service
│   │   └── Chat Controller
│   │
│   └── Gestures Module
│       ├── Gestures Service (Python integration)
│       └── Gestures Controller
│
├── Common
│   ├── Guards (FirebaseAuthGuard)
│   ├── Interceptors (AuthUserSyncInterceptor)
│   └── Interfaces (RequestWithUser)
│
└── App Module (Root)
    └── Conditionally loads MongoDB modules
```

### Frontend Architecture (React)

```
Frontend/
├── Pages
│   ├── Home - Landing page
│   ├── Login - Authentication
│   ├── Signup - User registration
│   ├── Profile - User profile management
│   ├── Match - View mutual matches
│   ├── Swipe - Gesture-controlled swiping
│   └── Chat - Messaging interface
│
├── Components
│   ├── Navigation - App navigation bar
│   ├── Button - Reusable button component
│   ├── Input - Form input component
│   └── ProtectedRoute - Route protection
│
├── Services
│   ├── user.service.ts - User API calls
│   └── chat.service.ts - Chat API calls
│
└── Shared
    ├── api.ts - Axios configuration
    └── firebase.ts - Firebase config
```

### Data Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
Service Layer (user.service.ts / chat.service.ts)
    ↓
API Call (Axios)
    ↓
Backend Controller (NestJS)
    ↓
Guard (FirebaseAuthGuard) - Verifies token
    ↓
Interceptor (AuthUserSyncInterceptor) - Syncs user to MongoDB
    ↓
Service (Business Logic)
    ↓
MongoDB (via Mongoose)
    ↓
Response back to Frontend
```

---

## 🗄️ Database Schema

### Collections

#### 1. **users** Collection
```javascript
{
  _id: ObjectId,
  uid: String (unique, Firebase UID),
  email: String,
  displayName: String,
  photoURL: String,
  fullName: String,
  profilePicture: String (base64),
  feetPhotos: [String] (array of base64),
  bio: String,
  archType: String,
  archSize: String,
  age: Number,
  familyStatus: String,
  preferredArchTypes: [String],
  preferredArchSizes: [String],
  profileCompleted: Boolean,
  role: String ('user' | 'admin'),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **swipes** Collection
```javascript
{
  _id: ObjectId,
  swiperId: String (UID of user who swiped),
  swipedId: String (UID of user who was swiped on),
  action: String ('like' | 'pass'),
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: { swiperId: 1, swipedId: 1 }
```

#### 3. **conversations** Collection
```javascript
{
  _id: ObjectId,
  participant1: String (UID, sorted),
  participant2: String (UID, sorted),
  lastMessage: String,
  lastMessageAt: Date,
  unreadCounts: {
    [uid: String]: Number
  },
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: { participant1: 1, participant2: 1 }
```

#### 4. **messages** Collection
```javascript
{
  _id: ObjectId,
  conversationId: String (ObjectId reference),
  senderId: String (UID),
  content: String,
  read: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Index: { conversationId: 1, createdAt: -1 }
```

---

## 🔌 API Endpoints

### Authentication
All endpoints require Firebase authentication token in `Authorization: Bearer <token>` header.

### User Endpoints

#### `GET /users/me`
- Get current user's profile
- Returns: User document from MongoDB

#### `PUT /users/me/profile`
- Update user profile
- Body: `{ fullName, profilePicture, feetPhotos, bio }`
- Returns: Updated user document

#### `PUT /users/me/preferences`
- Update user preferences
- Body: `{ archType, archSize, age, preferredArchTypes, ... }`
- Returns: Updated user document

#### `GET /users/matches`
- Get mutual matches (users who have both swiped right on each other)
- Returns: Array of user profiles

#### `GET /users/discover`
- Get profiles the user hasn't swiped on yet
- Returns: Array of user profiles

#### `POST /users/swipe`
- Record a swipe action
- Body: `{ swipedId: string, action: 'like' | 'pass' }`
- Returns: `{ isMatch: boolean, message?: string }`

#### `GET /users/by-uid/:uid`
- Get user by Firebase UID
- Returns: User document

### Chat Endpoints

#### `GET /chat/conversations`
- Get all conversations for current user
- Returns: Array of conversation documents

#### `GET /chat/conversations/with/:userId`
- Get or create conversation with another user
- **Requires mutual match**
- Returns: Conversation document

#### `GET /chat/conversations/:conversationId/messages`
- Get messages for a conversation
- Query params: `limit` (default: 50)
- Returns: Array of message documents

#### `POST /chat/messages`
- Send a message
- Body: `{ conversationId: string, content: string }`
- Returns: Message document

#### `GET /chat/conversations/:conversationId`
- Get conversation details
- Returns: Conversation document

### Gesture Endpoints

#### `POST /gestures/predict`
- Predict gesture from sequence
- Body: `{ sequence: number[][] }` (15 frames × 9 features)
- Returns: `{ success: boolean, gesture: string, confidence: number, probabilities: object }`

#### `POST /gestures/status`
- Check if model is loaded
- Returns: `{ modelLoaded: boolean }`

---

## 📱 Frontend Pages

### 1. **Home** (`/`)
- Landing page
- Public access
- Features overview
- Call-to-action buttons

### 2. **Login** (`/login`)
- Email/password login
- Google sign-in option
- Link to signup
- Link to password reset

### 3. **Signup** (`/signup`)
- User registration
- Email/password signup
- Google sign-up option
- Redirects to profile after signup

### 4. **Profile** (`/profile`)
- **Protected route**
- View and edit profile
- Upload profile picture
- Upload feet photos
- Edit bio and preferences
- Profile completion indicator
- Save changes

### 5. **Match** (`/match`)
- **Protected route**
- View mutual matches (grid layout)
- Shows user cards with:
  - Profile picture
  - Name
  - Bio
  - Age, arch type
  - Feet photo preview
  - "Message" button
- Clicking "Message" navigates to chat

### 6. **Swipe** (`/swipe`)
- **Protected route**
- Gesture-controlled swiping
- Webcam integration
- Real-time gesture recognition
- Shows gesture results (YES/NO/NEUTRAL)
- Confidence scores
- Buffer status indicator

### 7. **Chat** (`/chat`)
- **Protected route**
- Instagram-style layout:
  - **Sidebar:** List of conversations
  - **Main area:** Selected conversation
- Features:
  - Conversation list with last message preview
  - Unread count badges
  - Message bubbles (own vs received)
  - Timestamp formatting
  - Auto-refresh every 3 seconds
  - Auto-scroll to latest message
  - Send messages (Enter key or button)

---

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js** v18 or higher
2. **Python** 3.8 or higher
3. **MongoDB** (local or Atlas)
4. **Firebase Project** with Authentication enabled
5. **MongoDB Compass** (optional, for database management)

### Step 1: Clone and Navigate

```bash
cd Go-On-Hacks
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

**Create `.env` file:**
```bash
# Copy template
cp env.template .env
```

**Edit `backend/.env`:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ToeGether
FRONTEND_URL=http://localhost:3001
FB_PROJECT_ID=your-firebase-project-id
FB_CLIENT_EMAIL=your-firebase-client-email@project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

**Create `.env` file:**
```bash
# Copy template
cp env.example .env
```

**Edit `frontend/.env`:**
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Step 4: MongoDB Setup

**Option A: Local MongoDB**
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install with "Install as Service" option
3. Start MongoDB service:
   ```powershell
   Start-Service -Name MongoDB
   ```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

**Connect MongoDB Compass:**
- Connection string: `mongodb://localhost:27017`
- Database: `ToeGether` (created automatically)

### Step 5: Python ML Setup (Optional - for gesture recognition)

```bash
# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
cd ml-models
pip install -r requirements.txt

# Verify model exists
ls models/gesture_classifier.h5

# If missing, train the model:
python 2_extract_features.py
python 3_train_model.py
```

### Step 6: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Authentication:**
   - Enable Email/Password
   - Enable Google Sign-In
4. **Service Account (for backend):**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download JSON file
   - Extract values for `backend/.env`:
     - `FB_PROJECT_ID`
     - `FB_CLIENT_EMAIL`
     - `FB_PRIVATE_KEY`
5. **Web SDK (for frontend):**
   - Go to Project Settings > General
   - Scroll to "Your apps"
   - Copy config values to `frontend/.env`

---

## 🔄 How Everything Works

### Authentication Flow

1. User signs up/logs in via Firebase
2. Firebase returns JWT token
3. Frontend stores token
4. All API requests include token in `Authorization` header
5. Backend `FirebaseAuthGuard` verifies token
6. `AuthUserSyncInterceptor` syncs user to MongoDB (async)
7. Request proceeds to controller

### User Profile Flow

1. User completes profile:
   - Uploads profile picture (converted to base64)
   - Uploads feet photos (converted to base64)
   - Enters full name, bio, preferences
2. Frontend sends `PUT /users/me/profile`
3. Backend validates and saves to MongoDB
4. `profileCompleted` flag set to `true` when all required fields present
5. User can now see matches

### Matching Flow

1. **Discover Profiles:**
   - User visits `/match` or `/swipe`
   - Frontend calls `GET /users/discover`
   - Backend returns users not yet swiped on

2. **Swipe Action:**
   - User swipes right (like) or left (pass)
   - Frontend calls `POST /users/swipe`
   - Backend saves swipe to `swipes` collection
   - If both users swiped right → **Match created!**

3. **View Matches:**
   - User visits `/match`
   - Frontend calls `GET /users/matches`
   - Backend finds mutual likes:
     - Users A liked → Check if they liked A back
     - Return only mutual matches

### Chat Flow

1. **Start Conversation:**
   - User clicks "Message" on a match
   - Frontend calls `GET /chat/conversations/with/:userId`
   - Backend checks if users are mutual matches
   - Creates conversation if doesn't exist

2. **Send Message:**
   - User types message and sends
   - Frontend calls `POST /chat/messages`
   - Backend saves message to `messages` collection
   - Updates conversation `lastMessage` and `lastMessageAt`
   - Increments recipient's unread count

3. **View Messages:**
   - Frontend calls `GET /chat/conversations/:id/messages`
   - Backend returns messages, marks as read
   - Frontend auto-refreshes every 3 seconds

### Gesture Recognition Flow

1. User opens `/swipe` page
2. Clicks "Start Camera"
3. MediaPipe processes video frames
4. Extracts 9 features per frame (facial landmarks)
5. Collects 15 frames (sequence)
6. Sends sequence to `POST /gestures/predict`
7. Backend spawns Python subprocess
8. Python script loads TensorFlow model
9. Model predicts gesture (YES/NO/NEUTRAL)
10. Returns result with confidence scores
11. Frontend displays gesture result

---

## 🏃 Running the Application

### Terminal 1: MongoDB (if local)

```powershell
# Check if MongoDB is running
Get-Service -Name MongoDB

# If not running, start it:
Start-Service -Name MongoDB
```

### Terminal 2: Backend

```bash
cd backend
npm run start:dev
```

**Expected output:**
```
✅ Backend is running on: http://localhost:3000
[MongoDB] Connected successfully
[MongoDB] Database: ToeGether
```

### Terminal 3: Frontend

```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3001
```

### Access the Application

1. Open browser: `http://localhost:3001`
2. Sign up or log in
3. Complete your profile
4. Start matching and chatting!

---

## 🗄️ MongoDB Compass Integration

### Connecting MongoDB Compass

1. **Open MongoDB Compass**

2. **Connection String:**
   ```
   mongodb://localhost:27017
   ```
   - Click "Connect"

3. **Select Database:**
   - Click on `ToeGether` database
   - Collections will appear as data is created

### Collections You'll See

1. **users** - All user accounts
2. **swipes** - All swipe actions
3. **conversations** - Chat conversation threads
4. **messages** - Individual chat messages

### Useful Queries

**Find all users:**
```json
{}
```

**Find completed profiles:**
```json
{ "profileCompleted": true }
```

**Find all likes:**
```json
{ "action": "like" }
```

**Find mutual matches for a user:**
1. Find user's likes: `{ "swiperId": "USER_UID", "action": "like" }`
2. Check if those users liked back: `{ "swiperId": "LIKED_USER_UID", "swipedId": "USER_UID", "action": "like" }`

**Find conversations for a user:**
```json
{ "$or": [{ "participant1": "USER_UID" }, { "participant2": "USER_UID" }] }
```

**Find messages in a conversation:**
```json
{ "conversationId": "CONVERSATION_ID" }
```

### Manual Data Management

You can:
- View all documents
- Edit documents directly
- Delete documents
- Create new documents
- Export/import data
- Run aggregation queries

---

## 🔧 Troubleshooting

### Backend Won't Start

**Issue:** MongoDB connection error
```bash
# Check if MongoDB is running
Get-Service -Name MongoDB

# Start MongoDB
Start-Service -Name MongoDB

# Check port
netstat -an | findstr :27017
```

**Issue:** Port 3000 already in use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Issue:** Missing environment variables
- Check `backend/.env` exists
- Verify all Firebase credentials are set
- Check MongoDB URI is correct

### Frontend Won't Start

**Issue:** Port 3001 already in use
```bash
# Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Issue:** Firebase errors
- Check `frontend/.env` has all Firebase config
- Verify Firebase project has Authentication enabled
- Check browser console for specific errors

### MongoDB Issues

**Issue:** Can't connect to MongoDB
```powershell
# Check service status
Get-Service -Name MongoDB

# Start service
Start-Service -Name MongoDB

# Check logs
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

**Issue:** Database not showing in Compass
- Database is created automatically on first connection
- Make sure backend has connected at least once
- Refresh Compass (F5)

### Chat Not Working

**Issue:** "Users must be mutual matches"
- Both users must swipe right on each other
- Check `swipes` collection for mutual likes
- Only mutual matches can chat

**Issue:** Messages not appearing
- Check browser console for errors
- Verify backend is running
- Check MongoDB connection
- Verify conversation exists in database

### Gesture Recognition Not Working

**Issue:** Model not found
```bash
# Check if model exists
ls ml-models/models/gesture_classifier.h5

# If missing, train it:
cd ml-models
python 2_extract_features.py
python 3_train_model.py
```

**Issue:** Python script errors
- Verify Python is in PATH
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install tensorflow numpy`
- Check backend logs for Python errors

**Issue:** Webcam not working
- Grant browser camera permissions
- Check if another app is using the camera
- Try different browser
- In production, requires HTTPS

---

## 🎯 Next Steps & Future Enhancements

### Immediate Improvements

1. **Swipe Page Integration**
   - Connect gesture recognition to actual profile swiping
   - Show profile cards on Swipe page
   - Map YES gesture → Swipe right (like)
   - Map NO gesture → Swipe left (pass)

2. **Real-time Chat**
   - Implement WebSockets or Socket.io
   - Replace polling with real-time updates
   - Show "typing..." indicators
   - Online/offline status

3. **Match Notifications**
   - Notify users when they get a match
   - Show match popup/modal
   - Email notifications (optional)

### Feature Enhancements

1. **Advanced Matching**
   - Preference-based filtering
   - Location-based matching
   - Age range preferences
   - Search functionality

2. **Profile Enhancements**
   - Photo gallery
   - Video uploads
   - Verification badges
   - Social media links

3. **Chat Features**
   - Image sharing
   - Voice messages
   - Read receipts
   - Message reactions
   - Group chats

4. **ML Improvements**
   - Cache model in memory (faster predictions)
   - Use TensorFlow.js (client-side prediction)
   - Add more gesture types
   - Improve model accuracy

5. **Performance**
   - Image optimization (resize before upload)
   - Pagination for matches/messages
   - Lazy loading
   - Caching strategies

6. **Security**
   - Input validation
   - Rate limiting
   - Image moderation
   - Content filtering

---

## 📝 Key Implementation Details

### Mutual Matching Logic

The matching system ensures both users must swipe right:

```typescript
// When User A swipes right on User B:
1. Save swipe: { swiperId: "A", swipedId: "B", action: "like" }
2. Check if User B has already liked User A
3. If yes → Match! Return { isMatch: true }
4. If no → No match yet, return { isMatch: false }

// When User B later swipes right on User A:
1. Save swipe: { swiperId: "B", swipedId: "A", action: "like" }
2. Check if User A has already liked User B
3. If yes → Match! Return { isMatch: true }
```

### Chat Authorization

Chat requires mutual matches:

```typescript
// Before creating conversation:
1. Check if User A liked User B: { swiperId: "A", swipedId: "B", action: "like" }
2. Check if User B liked User A: { swiperId: "B", swipedId: "A", action: "like" }
3. If both exist → Allow conversation
4. If not → Throw error: "Users must be mutual matches"
```

### User Sync Interceptor

Automatically syncs Firebase users to MongoDB:

```typescript
// On every authenticated request:
1. FirebaseAuthGuard verifies token → Sets req.user
2. AuthUserSyncInterceptor runs:
   - Extracts user data from token
   - Upserts to MongoDB (create or update)
   - Runs asynchronously (doesn't block request)
```

### Profile Completion Check

Profile is complete when:
- ✅ `profilePicture` exists
- ✅ `feetPhotos` array has at least 1 photo
- ✅ `fullName` exists

When complete, `profileCompleted: true` → User can see matches

---

## 🔐 Environment Variables Reference

### Backend (.env)

```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/ToeGether
MONGODB_ENABLED=true  # Set to false to disable MongoDB

# CORS
FRONTEND_URL=http://localhost:3001

# Firebase Admin (Service Account)
FB_PROJECT_ID=your-project-id
FB_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Frontend (.env)

```env
# Server
PORT=3001

# API
REACT_APP_API_URL=http://localhost:3000

# Firebase Web SDK
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

---

## 📚 Additional Resources

### Documentation Files

- `TECH_STACK.md` - Complete technology breakdown
- `MONGODB_COMPASS_SETUP.md` - MongoDB Compass guide
- `MONGODB_INSTALL_GUIDE.md` - MongoDB installation
- `QUICK_START.md` - Quick reference
- `SETUP_GUIDE.md` - Detailed setup instructions
- `INTEGRATION_SUMMARY.md` - Integration overview

### Scripts

- `setup-mongodb.ps1` - PowerShell script to check/start MongoDB

### Testing

**Test Backend API:**
```bash
# Get auth token from browser (after login)
# In browser console: localStorage.getItem('firebase:authUser:...')

# Test endpoint
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test MongoDB Connection:**
```bash
# In MongoDB Compass
# Connection: mongodb://localhost:27017
# Database: ToeGether
```

---

## ✅ Checklist: Is Everything Working?

- [ ] MongoDB is running (check service or port 27017)
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can sign up/login
- [ ] Can create/edit profile
- [ ] Can view discover profiles
- [ ] Can swipe on profiles
- [ ] Mutual matches appear in `/match`
- [ ] Can start conversations with matches
- [ ] Can send/receive messages
- [ ] Messages auto-refresh
- [ ] MongoDB Compass can connect
- [ ] Can see data in Compass collections
- [ ] Gesture recognition works (if ML model exists)

---

## 🎓 Understanding the Codebase

### Key Files to Understand

**Backend:**
- `backend/src/app.module.ts` - Root module, MongoDB setup
- `backend/src/main.ts` - Application entry point
- `backend/src/modules/users/users.service.ts` - Matching logic
- `backend/src/modules/chat/chat.service.ts` - Chat logic
- `backend/src/common/guards/firebase-auth.guard.ts` - Auth verification
- `backend/src/common/interceptors/auth-user-sync.interceptor.ts` - User sync

**Frontend:**
- `frontend/src/App.tsx` - Routing configuration
- `frontend/src/pages/Chat/Chat.tsx` - Chat implementation
- `frontend/src/pages/Match/Match.tsx` - Matches display
- `frontend/src/services/user.service.ts` - User API calls
- `frontend/src/services/chat.service.ts` - Chat API calls
- `frontend/src/shared/api.ts` - Axios configuration

**Database:**
- `backend/src/modules/users/schemas/user.schema.ts` - User model
- `backend/src/modules/users/schemas/swipe.schema.ts` - Swipe model
- `backend/src/modules/chat/schemas/conversation.schema.ts` - Conversation model
- `backend/src/modules/chat/schemas/message.schema.ts` - Message model

---

## 🚨 Important Notes

1. **MongoDB is Optional:**
   - Set `MONGODB_ENABLED=false` to run without MongoDB
   - Auth will still work, but user sync and chat won't

2. **Mutual Matching:**
   - Users can only chat if both have swiped right
   - One-way likes don't create matches

3. **Profile Completion:**
   - Users must complete profile to see matches
   - Requires: profile picture, at least 1 feet photo, full name

4. **Gesture Recognition:**
   - Requires ML model file: `ml-models/models/gesture_classifier.h5`
   - Python must be in PATH
   - Currently not connected to actual swiping (future enhancement)

5. **Image Storage:**
   - Images stored as base64 strings in MongoDB
   - Not ideal for production (use cloud storage instead)

---

## 📞 Support & Debugging

### Check Logs

**Backend logs:**
- Look for `[MongoDB]` messages
- Look for `[Interceptor]` messages
- Look for `[Chat]` messages
- Look for `[Match]` messages

**Frontend console:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Common Error Messages

**"MongoDB connection error"**
- MongoDB not running
- Wrong connection string
- Firewall blocking port 27017

**"Users must be mutual matches"**
- Trying to chat with non-match
- Check `swipes` collection for mutual likes

**"User not found"**
- User hasn't been synced to MongoDB yet
- Check if interceptor is running
- Verify Firebase token is valid

**"Model not loaded"**
- ML model file missing
- Python not accessible
- Check `ml-models/models/` directory

---

## 🎉 Summary

You now have a fully functional dating application with:

✅ **Authentication** - Firebase email/password + Google  
✅ **User Profiles** - Complete profile management  
✅ **Matching System** - Mutual matching (both must swipe right)  
✅ **Chat System** - Real-time messaging between matches  
✅ **Gesture Recognition** - ML-powered head gesture detection  
✅ **Database** - MongoDB with proper schemas  
✅ **UI/UX** - Modern, responsive design  

The application is ready for development and testing. All core features are implemented and integrated. You can now:
- Add more users
- Test the matching flow
- Test chat functionality
- View data in MongoDB Compass
- Enhance features as needed

**Happy coding! 🚀**

