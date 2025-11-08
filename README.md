ToeGether

ToeGether is a modern dating application that helps users find their perfect match. The platform features Firebase authentication, user profile management, and a matching system designed to connect people based on their preferences.

Installation

Prerequisites

Node.js 14+
npm or yarn
MongoDB (running locally or remote connection)
Firebase project with Authentication enabled

Backend Setup

Navigate to the backend directory:

cd backend

Install dependencies:

npm install

Create a .env file from the template:

Copy-Item env.template .env

Edit the .env file and add your configuration:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/ToeGether
FRONTEND_URL=http://localhost:3001
FB_PROJECT_ID=your_project_id
FB_CLIENT_EMAIL=your_client_email@your_project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Start the NestJS development server:

npm run start:dev

The backend will run on http://localhost:3000

Frontend Setup

Navigate to the frontend directory:

cd frontend

Install dependencies:

npm install

Create a .env file from the template:

Copy-Item env.example .env

Edit the .env file and add your Firebase configuration:

PORT=3001
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

Start the React development server:

npm start

The frontend will run on http://localhost:3001

Firebase Configuration

1. Go to Firebase Console and select your project
2. Navigate to Authentication and click Get started
3. Enable Email/Password authentication
4. Enable Google authentication
5. Go to Project Settings and generate a new service account key
6. Download the JSON file and extract the required values for backend .env
7. Copy the Web SDK configuration values to frontend .env

MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named ToeGether
3. The users collection will be created automatically when users sign up
4. Update MONGODB_URI in backend/.env with your connection string

Usage

1. Start MongoDB if running locally
2. Start the backend server (Terminal 1):

cd backend
npm run start:dev

3. Start the frontend server (Terminal 2):

cd frontend
npm start

4. Open your browser and navigate to http://localhost:3001
5. Click Sign Up to create a new account
6. Use Email/Password or Google Sign-In to authenticate
7. Browse matches, chat with connections, and manage your profile

Features

Email/Password Authentication
Google Sign-In
User Profile Management
Password Reset
Protected Routes
User Data Synchronization with MongoDB
Responsive Design

Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

License

This project is licensed under the MIT License.

