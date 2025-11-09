# Render Deployment - Quick Reference

## Backend Service Configuration

**Service Type:** Web Service  
**Root Directory:** `backend`  
**Build Command:** `npm install && npm run build`  
**Start Command:** `npm run start:prod`  
**Node Version:** 18+ (Render auto-detects)

### Required Environment Variables:
```
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ToeGether?retryWrites=true&w=majority
FRONTEND_URL=https://your-frontend.onrender.com
FB_PROJECT_ID=your_project_id
FB_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
MONGODB_ENABLED=true
```

---

## Frontend Service Configuration

**Service Type:** Static Site  
**Root Directory:** `frontend`  
**Build Command:** `npm install && npm run build`  
**Publish Directory:** `build`  
**Node Version:** 18+ (Render auto-detects)

### Required Environment Variables:
```
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=sender_id
REACT_APP_FIREBASE_APP_ID=app_id
```

---

## Deployment Order

1. ✅ Set up MongoDB Atlas
2. ✅ Deploy Backend first
3. ✅ Deploy Frontend second
4. ✅ Update Backend `FRONTEND_URL` with actual frontend URL
5. ✅ Add frontend domain to Firebase authorized domains

---

## Quick Commands Reference

### Local Development
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm start
```

### Production Build
```bash
# Backend
cd backend
npm install
npm run build
npm run start:prod

# Frontend
cd frontend
npm install
npm run build
# Serve from 'build' directory
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| CORS errors | Update `FRONTEND_URL` in backend env vars |
| MongoDB connection failed | Check IP whitelist (use `0.0.0.0/0`) |
| Firebase auth not working | Add Render domain to Firebase authorized domains |
| Build timeout | Optimize dependencies or upgrade plan |
| Service sleeping | Free tier sleeps after 15min inactivity |

---

## URLs After Deployment

- **Backend:** `https://your-backend-name.onrender.com`
- **Frontend:** `https://your-frontend-name.onrender.com`

Update these in each other's environment variables!

