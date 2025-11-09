# ToeGether

ToeGether is a modern dating application that helps users find their perfect match. The platform features Firebase authentication, user profile management, and a matching system designed to connect people based on their preferences.

## Installation

### Prerequisites

- Node.js 14+
- npm or yarn
- MongoDB (running locally or remote connection)
- Firebase project with Authentication enabled

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file from the template:

   ```powershell
   Copy-Item ../env.backend .env
   ```

   Or manually copy `env.backend` from the root directory to `backend/.env` and update the values.

5. Start the NestJS development server:

   ```bash
   npm run start:dev
   ```

   The backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file from the template:

   ```powershell
   Copy-Item ../env.frontend .env
   ```

   Or manually copy `env.frontend` from the root directory to `frontend/.env` and update the values.

5. Start the React development server:

   ```bash
   npm start
   ```

   The frontend will run on http://localhost:3001

## Firebase Configuration

1. Go to Firebase Console and select your project
2. Navigate to Authentication and click Get started
3. Enable Email/Password authentication
4. Enable Google authentication
5. Go to Project Settings and generate a new service account key
6. Download the JSON file and extract the required values for `backend/.env`
7. Copy the Web SDK configuration values to `frontend/.env`

## MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `ToeGether`
3. The `users` collection will be created automatically when users sign up
4. Update `MONGODB_URI` in `backend/.env` with your connection string

## ML Model Setup (Optional)

The application includes an optional gesture recognition feature for hands-free swiping. To train or use the model:

### Prerequisites

- Python 3.8 or higher
- Webcam (for testing)

### Training the Model

1. Navigate to the ml-models directory:

   ```bash
   cd ml-models
   ```

2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Collect training videos:

   Place videos in the appropriate folders:
   - `videos/yes/` - Videos of nodding YES (up-down movement)
   - `videos/no/` - Videos of shaking NO (side-to-side movement)
   - `videos/neutral/` - Videos of neutral/still faces

   **Video Guidelines:**
   - Format: .mp4, .avi, or .mov
   - Duration: 3-10 seconds per video
   - Quantity: Minimum 10 videos per category (recommended 30+)
   - Quality: Clear face, good lighting, natural gestures

4. Run the training pipeline:

   ```bash
   # Step 1: Organize and validate videos
   python 1_upload_videos.py

   # Step 2: Extract facial landmarks
   python 2_extract_features.py

   # Step 3: Train the model
   python 3_train_model.py

   # Step 4: Test with webcam
   python 4_test_model.py
   ```

5. The trained model will be saved to `ml-models/models/gesture_classifier.h5`

### Using the Model

Once trained, the model can be used for gesture-based swiping in the application. The backend will automatically use the model if it exists in the `ml-models/models/` directory.

## Usage

1. Start MongoDB if running locally

2. Start the backend server (Terminal 1):

   ```bash
   cd backend
   npm run start:dev
   ```

3. Start the frontend server (Terminal 2):

   ```bash
   cd frontend
   npm start
   ```

4. Open your browser and navigate to http://localhost:3001

5. Click Sign Up to create a new account

6. Use Email/Password or Google Sign-In to authenticate

7. Browse matches, chat with connections, and manage your profile

## Features

- Email/Password Authentication
- Google Sign-In
- User Profile Management
- Password Reset
- Protected Routes
- User Data Synchronization with MongoDB
- Responsive Design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
