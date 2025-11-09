# Render Deployment Guide

This guide will help you deploy your ToeGether application to Render. You'll need to deploy two services: **Backend** and **Frontend**.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. MongoDB Atlas account (for production database)
3. Firebase project configured
4. GitHub repository with your code

---

## Step 1: MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (for Render, use `0.0.0.0/0` to allow all IPs)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/ToeGether?retryWrites=true&w=majority`)

---

## Step 2: Deploy Backend Service

### 2.1 Create New Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name:** `toegether-backend` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your deployment branch)
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`

**Environment Variables:**
Add these in the Render dashboard:

```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ToeGether?retryWrites=true&w=majority
FRONTEND_URL=https://your-frontend-app.onrender.com
FB_PROJECT_ID=your_firebase_project_id
FB_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
MONGODB_ENABLED=true
```

**Important Notes:**
- Replace `your-frontend-app.onrender.com` with your actual frontend URL (you'll get this after deploying frontend)
- For `FB_PRIVATE_KEY`, copy the entire private key from Firebase service account JSON, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- Keep the `\n` characters in the private key - they're needed for proper formatting
- The private key should be on a single line with `\n` characters

### 2.2 Get Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FB_PROJECT_ID`
   - `client_email` → `FB_CLIENT_EMAIL`
   - `private_key` → `FB_PRIVATE_KEY` (keep the `\n` characters)

---

## Step 3: Deploy Frontend Service

### 3.1 Create New Static Site

1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name:** `toegether-frontend` (or your preferred name)
- **Branch:** `main` (or your deployment branch)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

**Environment Variables:**
Add these in the Render dashboard:

```
REACT_APP_API_URL=https://your-backend-app.onrender.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**Important Notes:**
- Replace `your-backend-app.onrender.com` with your actual backend URL from Step 2
- Get Firebase Web SDK config from Firebase Console → Project Settings → General → Your apps → Web app

### 3.2 Get Firebase Web SDK Config

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) or select your web app
4. Copy the config values:
   - `apiKey` → `REACT_APP_FIREBASE_API_KEY`
   - `authDomain` → `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `REACT_APP_FIREBASE_PROJECT_ID`
   - `storageBucket` → `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `REACT_APP_FIREBASE_APP_ID`

---

## Step 4: Update CORS Settings

After deploying both services, update your backend's `FRONTEND_URL` environment variable with the actual frontend URL.

1. Go to Backend Service → Environment
2. Update `FRONTEND_URL` to: `https://your-frontend-app.onrender.com`
3. Save changes (this will trigger a redeploy)

---

## Step 5: Firebase Authentication Setup

1. Go to Firebase Console → Authentication
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (if using)
4. Add authorized domains:
   - `your-frontend-app.onrender.com`
   - `render.com` (for Render's preview URLs)

---

## Step 6: Python/ML Model Setup (Optional)

If you're using gesture recognition, you'll need to handle Python dependencies. Render doesn't support Python in Node.js services by default. Options:

### Option A: Use TensorFlow.js (Recommended)
- The frontend already uses TensorFlow.js as a fallback
- No backend Python needed
- Model files should be in `frontend/public/models/tfjs_model/`

### Option B: Separate Python Service
- Create a separate Python service on Render for gesture prediction
- Update backend to call this service instead of local Python script

---

## Step 7: Verify Deployment

1. **Backend Health Check:**
   - Visit: `https://your-backend-app.onrender.com` (should show NestJS welcome or 404, which is normal)
   - Check logs for: "Backend is running on: http://localhost:3000"

2. **Frontend:**
   - Visit: `https://your-frontend-app.onrender.com`
   - Should load the React app
   - Check browser console for API connection errors

3. **Test Authentication:**
   - Try signing up/logging in
   - Check if data is saved to MongoDB Atlas

---

## Troubleshooting

### Backend Issues

**"Missing Firebase Admin environment variables"**
- Double-check all Firebase env vars are set correctly
- Ensure `FB_PRIVATE_KEY` includes the full key with `\n` characters

**"MongoDB connection failed"**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

**"CORS errors"**
- Verify `FRONTEND_URL` matches your frontend Render URL exactly
- Check backend logs for CORS rejection messages

### Frontend Issues

**"API connection failed"**
- Verify `REACT_APP_API_URL` points to your backend Render URL
- Check browser console for CORS errors
- Ensure backend is running and accessible

**"Firebase auth not working"**
- Verify all Firebase env vars are set correctly
- Check Firebase Console → Authentication → Settings → Authorized domains
- Ensure your Render domain is added

**"Build fails"**
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Common Render Issues

**"Service keeps restarting"**
- Check logs for errors
- Verify all required environment variables are set
- Check if port is correctly set (Render sets `PORT` automatically, but your code should use `process.env.PORT`)

**"Build timeout"**
- Free tier has 10-minute build timeout
- Consider optimizing build process
- Remove unnecessary dependencies

---

## Environment Variables Summary

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend.onrender.com
FB_PROJECT_ID=...
FB_CLIENT_EMAIL=...
FB_PRIVATE_KEY="..."
MONGODB_ENABLED=true
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

---

## Render Service Configuration

### Backend Service
- **Type:** Web Service
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/` (optional)

### Frontend Service
- **Type:** Static Site
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

---

## Cost Considerations

- **Free Tier:**
  - Web Services: Sleep after 15 minutes of inactivity
  - Static Sites: Always on
  - 750 hours/month free

- **Paid Plans:**
  - Web Services: Always on
  - Better performance
  - More resources

---

## Security Notes

1. **Never commit `.env` files** - Use Render's environment variables
2. **MongoDB Atlas:** Use strong passwords and IP whitelisting
3. **Firebase:** Keep service account keys secure
4. **CORS:** Only allow your frontend domain
5. **HTTPS:** Render provides SSL certificates automatically

---

## Next Steps

1. Set up custom domains (optional)
2. Configure auto-deploy from Git
3. Set up monitoring and alerts
4. Configure backups for MongoDB
5. Set up CI/CD pipeline

---

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Firebase Docs: https://firebase.google.com/docs

