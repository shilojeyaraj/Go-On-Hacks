# Tech Stack - ToeGether Application

## 🏗️ Architecture Overview

**Type:** Full-Stack Web Application with Machine Learning Integration  
**Architecture Pattern:** Monorepo with separate frontend, backend, and ML components

---

## 📱 Frontend Stack

### Core Framework
- **React** `^18.2.0` - UI library
- **TypeScript** `^4.9.5` - Type-safe JavaScript
- **React Router DOM** `^6.15.0` - Client-side routing

### Build Tools
- **React Scripts** `5.0.1` - Create React App build tooling
- **Webpack** (via React Scripts) - Module bundler
- **Babel** (via React Scripts) - JavaScript compiler

### HTTP Client
- **Axios** `^1.6.0` - Promise-based HTTP client for API calls

### Authentication & Backend Services
- **Firebase SDK** `^10.7.1` - Authentication and user management
  - Firebase Auth (Email/Password, Google OAuth)
  - Firebase Admin SDK (backend verification)

### Computer Vision (Client-Side)
- **MediaPipe Face Mesh** (via CDN) - Real-time facial landmark detection
  - Used for gesture recognition feature extraction
  - 468 facial landmarks detection

### Development Tools
- **Cross-Env** `^10.1.0` - Cross-platform environment variable handling
- **ESLint** - Code linting (via React Scripts)
- **TypeScript Types** - Type definitions for React, Node, etc.

---

## 🔧 Backend Stack

### Core Framework
- **NestJS** `^10.0.0` - Progressive Node.js framework
  - Built on Express.js
  - TypeScript-first architecture
  - Modular design pattern

### Runtime & Language
- **Node.js** (v18+) - JavaScript runtime
- **TypeScript** `^5.1.3` - Type-safe development

### Database & ORM
- **MongoDB** - NoSQL document database
- **Mongoose** `^8.0.0` - MongoDB object modeling
- **@nestjs/mongoose** `^10.0.0` - NestJS MongoDB integration

### Authentication
- **Firebase Admin SDK** `^12.0.0` - Server-side Firebase authentication
  - Token verification
  - User management

### API & Middleware
- **Express.js** (via NestJS) - Web application framework
- **CORS** - Cross-origin resource sharing
- **Validation Pipe** - Request validation (class-validator)

### Development Tools
- **NestJS CLI** `^10.0.0` - Code generation and scaffolding
- **Jest** `^29.5.0` - Testing framework
- **ESLint** `^8.42.0` - Code linting
- **Prettier** `^3.0.0` - Code formatting
- **TypeScript Compiler** - Type checking and compilation

### Environment Management
- **dotenv** `^17.2.3` - Environment variable management

---

## 🤖 Machine Learning Stack

### Core ML Framework
- **Python** `3.8+` - Programming language
- **TensorFlow** `2.15.0` - Deep learning framework
- **Keras** (via TensorFlow) - High-level neural network API

### Computer Vision
- **MediaPipe** `0.10.8` - Media processing framework
  - Face mesh detection (468 landmarks)
  - Real-time video processing
- **OpenCV** `4.8.1.78` - Computer vision library
  - Video capture and processing
  - Image manipulation

### Data Processing
- **NumPy** `1.24.3` - Numerical computing
- **scikit-learn** `1.3.2` - Machine learning utilities
  - Data splitting
  - Evaluation metrics

### Visualization & Utilities
- **Matplotlib** `3.8.2` - Plotting and visualization
- **tqdm** `4.66.1` - Progress bars

### Model Architecture
- **LSTM (Long Short-Term Memory)** - Recurrent neural network
  - Sequence length: 15 frames
  - Features: 9 per frame (3 vertical_y, 3 horizontal_x, 3 vertical_z)
  - Output: 3 classes (YES, NO, NEUTRAL)

---

## 🗄️ Database

### Primary Database
- **MongoDB** - Document-oriented NoSQL database
  - User profiles
  - Chat conversations
  - Messages
  - Gesture history (if implemented)

### Schema Design
- **Mongoose Schemas** - Document structure definitions
  - User schema (profiles, preferences)
  - Conversation schema (chat threads)
  - Message schema (chat messages)

---

## ☁️ Cloud Services

### Authentication & Backend Services
- **Firebase** - Google's Backend-as-a-Service
  - **Firebase Authentication**
    - Email/Password authentication
    - Google OAuth
    - Token-based auth
  - **Firebase Admin SDK** - Server-side operations

### Storage (Potential)
- **Firebase Storage** - File storage (for profile pictures, feet photos)

---

## 🛠️ Development Tools

### Version Control
- **Git** - Source code management

### Package Managers
- **npm** - Node.js package manager
- **pip** - Python package manager

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Testing
- **Jest** - JavaScript testing framework
- **Supertest** `^6.3.3` - HTTP assertion library

---

## 📦 Key Dependencies Summary

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.15.0",
  "axios": "^1.6.0",
  "firebase": "^10.7.1",
  "typescript": "^4.9.5"
}
```

### Backend Dependencies
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/mongoose": "^10.0.0",
  "mongoose": "^8.0.0",
  "firebase-admin": "^12.0.0",
  "rxjs": "^7.8.1"
}
```

### ML Dependencies
```txt
tensorflow==2.15.0
mediapipe==0.10.8
opencv-python==4.8.1.78
numpy==1.24.3
scikit-learn==1.3.2
```

---

## 🔄 Integration Points

### Frontend ↔ Backend
- **REST API** - HTTP/JSON communication
- **Axios** - HTTP client
- **CORS** - Cross-origin requests

### Backend ↔ ML Model
- **Python Subprocess** - Spawns Python scripts
- **JSON** - Data serialization
- **Command-line arguments** - Parameter passing

### Frontend ↔ ML (Client-Side)
- **MediaPipe CDN** - Facial landmark detection
- **WebRTC** - Webcam access
- **Canvas API** - Video frame processing

### Backend ↔ Database
- **Mongoose** - ODM (Object Document Mapper)
- **MongoDB Driver** - Database connection

### Authentication Flow
- **Firebase Auth** (Frontend) → **Firebase Admin** (Backend) → **MongoDB** (User sync)

---

## 🚀 Deployment Considerations

### Frontend
- **Static Site Hosting** - Can be deployed to:
  - Vercel
  - Netlify
  - AWS S3 + CloudFront
  - Firebase Hosting

### Backend
- **Node.js Runtime** - Can be deployed to:
  - Heroku
  - AWS EC2/Elastic Beanstalk
  - Google Cloud Run
  - DigitalOcean
  - Railway

### Database
- **MongoDB** - Options:
  - MongoDB Atlas (cloud)
  - Self-hosted MongoDB
  - Local development instance

### ML Model
- **Python Runtime** - Requires:
  - Python 3.8+ environment
  - TensorFlow dependencies
  - Model file storage

---

## 📊 Technology Summary by Category

| Category | Technology | Version/Purpose |
|----------|-----------|-----------------|
| **Frontend Framework** | React | 18.2.0 |
| **Frontend Language** | TypeScript | 4.9.5 |
| **Backend Framework** | NestJS | 10.0.0 |
| **Backend Runtime** | Node.js | 18+ |
| **Database** | MongoDB | Latest |
| **ORM/ODM** | Mongoose | 8.0.0 |
| **Authentication** | Firebase | 10.7.1 / 12.0.0 |
| **ML Framework** | TensorFlow | 2.15.0 |
| **Computer Vision** | MediaPipe | 0.10.8 |
| **HTTP Client** | Axios | 1.6.0 |
| **Routing** | React Router | 6.15.0 |

---

## 🔐 Security Stack

- **Firebase Authentication** - Secure user authentication
- **JWT Tokens** - Token-based authorization
- **CORS** - Cross-origin request protection
- **Validation Pipes** - Input sanitization
- **Firebase Admin** - Server-side token verification

---

## 📝 Notes

- The application uses a **hybrid approach** for ML:
  - **Client-side**: MediaPipe for real-time feature extraction
  - **Server-side**: Python subprocess for model inference
- MongoDB can be **optionally disabled** via `MONGODB_ENABLED=false` environment variable
- The frontend uses **MediaPipe via CDN** for gesture recognition feature extraction
- The backend spawns **Python subprocesses** to run TensorFlow model predictions

