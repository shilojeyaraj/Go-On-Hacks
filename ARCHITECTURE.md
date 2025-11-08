# Feet Swipe App - System Architecture

This document describes the overall architecture of the Feet Swipe App, including the machine learning pipeline, backend services, and mobile application.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FEET SWIPE APP                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│                 │         │                 │         │                  │
│  Mobile App     │◄───────►│  Backend API    │◄───────►│  ML Service      │
│  (React Native) │         │  (Node.js)      │         │  (Python/Flask)  │
│                 │         │                 │         │                  │
└────────┬────────┘         └────────┬────────┘         └────────┬─────────┘
         │                           │                           │
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│                 │         │                 │         │                  │
│  User's Camera  │         │   Database      │         │  Trained Models  │
│  (Gesture Input)│         │  (PostgreSQL)   │         │  (TensorFlow)    │
│                 │         │                 │         │                  │
└─────────────────┘         └─────────────────┘         └──────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  Image Storage  │
                            │  (AWS S3)       │
                            │                 │
                            └─────────────────┘
```

## 📦 Components

### 1. Mobile Application (React Native)

**Purpose**: User-facing app for browsing profiles and matching

**Key Features**:
- User authentication and profile management
- Feet photo upload and editing
- Camera integration for gesture detection
- Real-time gesture recognition
- Profile browsing with gesture controls
- Match notifications and chat
- Settings and preferences

**Technology Stack**:
- React Native (cross-platform)
- Redux/MobX (state management)
- react-native-camera (camera access)
- TensorFlow Lite (on-device ML)
- Socket.io (real-time communication)

**Key Screens**:
```
App/
├── Auth/
│   ├── Login
│   ├── Signup
│   └── Verification
├── Main/
│   ├── Home (Swipe Screen)
│   ├── Matches
│   ├── Messages
│   └── Profile
└── Settings/
    ├── Account
    ├── Preferences
    └── Privacy
```

### 2. Backend API (Node.js)

**Purpose**: Business logic, data management, and API endpoints

**Key Features**:
- RESTful API endpoints
- User authentication (JWT)
- Profile management
- Matching algorithm
- Image upload handling
- Real-time messaging
- Content moderation
- Analytics

**Technology Stack**:
- Node.js + Express
- PostgreSQL (primary database)
- Redis (caching, sessions)
- AWS S3 (image storage)
- Socket.io (WebSocket)
- JWT (authentication)

**API Endpoints**:
```
Auth:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify

Users:
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/profile
POST   /api/users/photos

Matching:
GET    /api/matches/candidates
POST   /api/matches/swipe
GET    /api/matches/list
DELETE /api/matches/:id

Messages:
GET    /api/messages/:matchId
POST   /api/messages/:matchId
WebSocket: /socket.io/
```

### 3. ML Service (Python)

**Purpose**: Gesture recognition and model serving

**Current Status**: ✅ Training pipeline complete

**Key Features**:
- Real-time gesture detection
- Face landmark tracking
- Model inference API
- Model versioning
- Performance monitoring

**Technology Stack**:
- Python + Flask/FastAPI
- TensorFlow/Keras
- OpenCV
- MediaPipe
- NumPy

**API Endpoints** (Planned):
```
POST   /api/ml/detect-gesture
       Input: Video frame
       Output: {gesture: "yes/no/neutral", confidence: 0.95}

POST   /api/ml/batch-detect
       Input: Multiple frames
       Output: Array of gesture predictions

GET    /api/ml/model-info
       Output: Model version, accuracy, etc.
```

### 4. Database (PostgreSQL)

**Purpose**: Persistent data storage

**Key Tables**:

```sql
users
├── id (UUID, PK)
├── username (VARCHAR, UNIQUE)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── age (INTEGER)
├── gender (VARCHAR)
├── preferences (JSONB)
├── location (POINT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

photos
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── url (VARCHAR)
├── is_primary (BOOLEAN)
├── moderation_status (VARCHAR)
└── uploaded_at (TIMESTAMP)

swipes
├── id (UUID, PK)
├── swiper_id (UUID, FK → users.id)
├── swiped_id (UUID, FK → users.id)
├── direction (VARCHAR) -- 'left' or 'right'
├── created_at (TIMESTAMP)
└── UNIQUE(swiper_id, swiped_id)

matches
├── id (UUID, PK)
├── user1_id (UUID, FK → users.id)
├── user2_id (UUID, FK → users.id)
├── created_at (TIMESTAMP)
└── UNIQUE(user1_id, user2_id)

messages
├── id (UUID, PK)
├── match_id (UUID, FK → matches.id)
├── sender_id (UUID, FK → users.id)
├── content (TEXT)
├── read (BOOLEAN)
└── sent_at (TIMESTAMP)
```

### 5. Image Storage (AWS S3)

**Purpose**: Store and serve user-uploaded feet photos

**Structure**:
```
feet-swipe-bucket/
├── users/
│   └── {user_id}/
│       ├── original/
│       │   └── {photo_id}.jpg
│       ├── thumbnails/
│       │   └── {photo_id}_thumb.jpg
│       └── moderation/
│           └── {photo_id}_flagged.jpg
└── moderation-queue/
    └── pending/
```

**Features**:
- Automatic thumbnail generation
- CDN integration (CloudFront)
- Signed URLs for secure access
- Automatic backups
- Lifecycle policies

## 🔄 Data Flow

### Gesture Detection Flow

```
1. User opens swipe screen
   │
2. Camera activates
   │
3. Frame captured every 33ms (30fps)
   │
4. Frame sent to ML model
   │  ┌─────────────────┐
   │  │ MediaPipe       │
   │  │ Face Detection  │
   │  └────────┬────────┘
   │           │
   │  ┌────────▼────────┐
   │  │ Extract         │
   │  │ Landmarks       │
   │  └────────┬────────┘
   │           │
   │  ┌────────▼────────┐
   │  │ Buffer 30       │
   │  │ Frames          │
   │  └────────┬────────┘
   │           │
   │  ┌────────▼────────┐
   │  │ LSTM Model      │
   │  │ Inference       │
   │  └────────┬────────┘
   │           │
   ▼           ▼
   Gesture: YES/NO/NEUTRAL
   Confidence: 0.95
   │
5. If confidence > 0.7:
   │
6. Execute swipe action
   │
7. Send to backend API
   │  POST /api/matches/swipe
   │  {direction: 'left', target_user: '123'}
   │
8. Backend checks for match
   │
9. If match: Send notification
   │
10. Update UI
```

### User Registration Flow

```
1. User fills signup form
   │
2. Client validation
   │
3. POST /api/auth/register
   │
4. Backend validates data
   │
5. Check if email exists
   │
6. Hash password (bcrypt)
   │
7. Create user record
   │
8. Send verification email
   │
9. Return JWT token
   │
10. Store token in mobile app
    │
11. Redirect to profile setup
    │
12. User uploads feet photo
    │
13. Photo uploaded to S3
    │
14. Photo sent to moderation queue
    │
15. Profile complete
```

### Matching Flow

```
1. User requests candidates
   │  GET /api/matches/candidates
   │
2. Backend queries database
   │  - Filter by preferences (age, distance)
   │  - Exclude already swiped
   │  - Exclude matches
   │  - Random order
   │  - Limit 10
   │
3. Return candidate list
   │
4. User views profile #1
   │
5. User performs gesture (YES/NO)
   │
6. Client sends swipe
   │  POST /api/matches/swipe
   │  {direction: 'left', target_user: '456'}
   │
7. Backend records swipe
   │
8. Check if target also swiped YES
   │
9. If YES from both:
   │  - Create match record
   │  - Send push notification to both
   │  - Enable chat
   │
10. Return match status
    │
11. If match: Show celebration animation
    │
12. Load next candidate
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User logs in
   ↓
2. Credentials sent over HTTPS
   ↓
3. Backend verifies credentials
   ↓
4. Generate JWT token
   {
     id: user_id,
     email: user@example.com,
     exp: timestamp + 7days
   }
   ↓
5. Sign with secret key
   ↓
6. Return token to client
   ↓
7. Client stores token securely
   ↓
8. Subsequent requests include token
   Authorization: Bearer <token>
   ↓
9. Backend verifies token on each request
```

### Security Measures

**Authentication**:
- Password hashing with bcrypt (cost factor 12)
- JWT tokens with 7-day expiration
- Refresh token rotation
- Account lockout after 5 failed attempts

**Data Protection**:
- HTTPS/TLS for all communications
- Encrypted database connections
- S3 bucket encryption at rest
- Signed URLs for image access (1-hour expiration)

**API Security**:
- Rate limiting (100 requests/minute)
- Input validation and sanitization
- CORS policy
- SQL injection prevention (parameterized queries)
- XSS protection

**Privacy**:
- GDPR compliance
- User data export
- Right to be forgotten (data deletion)
- Privacy settings (visible to matches only)

## 📊 Scalability Considerations

### Horizontal Scaling

**Backend API**:
- Stateless design
- Load balancer (AWS ALB)
- Multiple API server instances
- Session storage in Redis

**Database**:
- Read replicas for queries
- Write to primary only
- Connection pooling
- Query optimization

**ML Service**:
- Model served via TensorFlow Serving
- Multiple inference instances
- Request queuing
- Model caching

### Performance Optimizations

**Caching Strategy**:
```
Redis Cache:
├── User sessions (7 days)
├── User profiles (1 hour)
├── Match candidates (5 minutes)
└── ML model results (1 minute)
```

**CDN Usage**:
- Static assets (JS, CSS, images)
- User-uploaded photos
- Edge locations globally

**Database Indexing**:
```sql
-- Optimize common queries
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_photos_user ON photos(user_id) WHERE is_primary = true;
```

## 🧪 Testing Strategy

### ML Pipeline
- Unit tests for data processing
- Integration tests for full pipeline
- Model accuracy benchmarks
- Performance tests (FPS, latency)

### Backend
- Unit tests (Jest)
- Integration tests (Supertest)
- API endpoint tests
- Database migration tests
- Load testing (Artillery)

### Mobile
- Unit tests (Jest)
- Component tests (React Testing Library)
- E2E tests (Detox)
- Gesture detection tests
- UI/UX testing

## 📈 Monitoring & Analytics

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Uptime monitoring (Pingdom)
- Log aggregation (ELK Stack)

### Business Metrics
- Daily active users (DAU)
- Match rate
- Message rate
- User retention
- Gesture detection accuracy
- Average session duration

### ML Metrics
- Model accuracy in production
- Inference latency
- False positive rate
- User feedback on predictions

## 🚀 Deployment Pipeline

```
Development → Staging → Production

1. Code commit to GitHub
   ↓
2. GitHub Actions triggers
   ↓
3. Run tests
   ├── Unit tests
   ├── Integration tests
   └── Linting
   ↓
4. Build Docker images
   ├── Backend API
   ├── ML Service
   └── Mobile app
   ↓
5. Push to container registry
   ↓
6. Deploy to staging
   ↓
7. Run smoke tests
   ↓
8. Manual approval
   ↓
9. Deploy to production
   ↓
10. Health checks
    ↓
11. Monitor for errors
```

## 🗂️ File Structure

```
Go-On-Hacks/
├── mobile/                      # React Native app
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── package.json
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── services/
│   └── package.json
│
├── ml-models/                   # ML pipeline
│   ├── training/               # Training scripts
│   ├── inference/              # Model serving
│   ├── models/                 # Trained models
│   └── requirements.txt
│
├── infrastructure/              # DevOps
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
└── docs/                        # Documentation
    ├── api/
    ├── architecture/
    └── guides/
```

## 🔮 Future Enhancements

### Phase 2 (Backend)
- User authentication system
- Profile management API
- Matching algorithm
- Real-time messaging

### Phase 3 (Mobile)
- UI/UX implementation
- Gesture control integration
- Chat functionality
- Push notifications

### Phase 4 (Advanced Features)
- Video profiles
- Advanced matching algorithm
- Social features (events, groups)
- Premium subscription model
- Analytics dashboard

### Phase 5 (Optimization)
- On-device ML (TensorFlow Lite)
- Offline mode
- Performance optimization
- Multi-language support

---

**Last Updated**: November 2025  
**Version**: 0.1.0  
**Status**: Phase 1 Complete (ML Pipeline)

