# Testing Guide - ToeGether

## Testing with Multiple Accounts

### Method 1: Different Browsers (Recommended)
1. **Account 1**: Use Chrome (or any browser)
   - Open `http://localhost:3001`
   - Sign up/Login with first account (e.g., `user1@test.com`)
   - Complete profile with profile picture and feet photos

2. **Account 2**: Use Firefox (or Edge/Safari)
   - Open `http://localhost:3001`
   - Sign up/Login with second account (e.g., `user2@test.com`)
   - Complete profile with profile picture and feet photos

### Method 2: Incognito/Private Mode
1. **Account 1**: Regular Chrome window
   - Open `http://localhost:3001`
   - Sign up/Login with first account

2. **Account 2**: Chrome Incognito window (Ctrl+Shift+N)
   - Open `http://localhost:3001`
   - Sign up/Login with second account

### Method 3: Different Browser Profiles
1. **Account 1**: Chrome Profile 1
   - Create separate Chrome profile
   - Sign up/Login with first account

2. **Account 2**: Chrome Profile 2
   - Create separate Chrome profile
   - Sign up/Login with second account

## Testing Swiping Functionality

### Current Implementation

The app has two main pages for matching:

1. **`/match`** - Shows mutual matches (users who have both swiped right on each other)
2. **`/swipe`** - Gesture recognition page (for hands-free swiping, but doesn't show profiles yet)

### Step-by-Step Testing Process

#### 1. Setup Two Accounts

**Account 1 (User A):**
1. Sign up with `user1@test.com`
2. Go to `/profile`
3. Complete profile:
   - Upload profile picture
   - Upload at least 1 feet photo
   - Add full name
   - Fill in bio and preferences
4. Save profile

**Account 2 (User B):**
1. Sign up with `user2@test.com`
2. Go to `/profile`
3. Complete profile:
   - Upload profile picture
   - Upload at least 1 feet photo
   - Add full name
   - Fill in bio and preferences
4. Save profile

#### 2. Test Swiping (Current Limitations)

**Note**: The current `/swipe` page only does gesture recognition. To test actual swiping, you need to:

**Option A: Use the API directly**
1. Open browser console (F12)
2. In Account 1's browser, run:
   ```javascript
   // Get discoverable profiles
   fetch('http://localhost:3000/users/discover', {
     headers: {
       'Authorization': 'Bearer YOUR_FIREBASE_TOKEN'
     }
   }).then(r => r.json()).then(console.log)
   
   // Swipe right (like) on a user
   fetch('http://localhost:3000/users/swipe', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_FIREBASE_TOKEN'
     },
     body: JSON.stringify({
       swipedId: 'USER_B_UID',
       action: 'like'
     })
   }).then(r => r.json()).then(console.log)
   ```

**Option B: Check Matches**
1. After swiping, go to `/match` page
2. If both users swiped right on each other, they should appear as matches
3. Click "Message" to start chatting

#### 3. Test Chatting

1. From Account 1, go to `/match`
2. If User B appears as a match, click "Message"
3. This should navigate to `/chat` and create a conversation
4. Switch to Account 2's browser
5. Go to `/chat` - you should see the conversation with User A
6. Send messages back and forth

## Quick Testing Checklist

- [ ] Create Account 1 and complete profile
- [ ] Create Account 2 and complete profile  
- [ ] Verify both profiles show `profileCompleted: true`
- [ ] Test `/users/discover` endpoint returns profiles
- [ ] Test swiping API (`/users/swipe`)
- [ ] Verify mutual matches appear in `/match`
- [ ] Test chat functionality between matched users
- [ ] Test gesture recognition on `/swipe` page (if ML model is trained)

## Troubleshooting

### Profiles not showing up?
- Make sure both users have `profileCompleted: true`
- Check that profiles have profile picture and feet photos
- Verify MongoDB connection is working

### Can't swipe?
- Check browser console for errors
- Verify Firebase authentication token is valid
- Check backend logs for API errors

### Matches not appearing?
- Both users must swipe right (like) on each other
- Check `/users/matches` endpoint returns mutual matches
- Verify swipe records exist in MongoDB

### Chat not working?
- Make sure both users are matched
- Check conversation is created in MongoDB
- Verify chat service endpoints are working

## API Endpoints for Testing

```bash
# Get current user
GET http://localhost:3000/users/me

# Get discoverable profiles (users you haven't swiped on)
GET http://localhost:3000/users/discover

# Swipe on a user
POST http://localhost:3000/users/swipe
Body: { "swipedId": "user_uid", "action": "like" | "pass" }

# Get mutual matches
GET http://localhost:3000/users/matches

# Get conversations
GET http://localhost:3000/chat/conversations

# Get messages for a conversation
GET http://localhost:3000/chat/conversations/:conversationId/messages
```

## Notes

- Firebase auth tokens are stored per browser/session
- Each browser tab maintains its own authentication state
- To test with multiple accounts, use different browsers or incognito mode
- The `/swipe` page currently only does gesture recognition - it doesn't show profiles to swipe on yet

