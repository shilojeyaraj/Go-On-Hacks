# MongoDB Compass Setup Guide

## Prerequisites

1. **MongoDB Server Running**
   - Make sure MongoDB is running on your local machine
   - Default port: `27017`

2. **MongoDB Compass Installed**
   - You mentioned you already have it downloaded ✅

## Step 1: Verify MongoDB is Running

### Windows (PowerShell):
```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# If not running, start it:
Start-Service -Name MongoDB

# Or check if mongod process is running:
Get-Process mongod -ErrorAction SilentlyContinue
```

### Alternative: Check MongoDB Port
```powershell
# Check if port 27017 is listening
netstat -an | findstr :27017
```

If MongoDB isn't running, you'll need to start it. MongoDB typically runs as a Windows service.

## Step 2: Connect MongoDB Compass

1. **Open MongoDB Compass**

2. **Connection String**
   - In the connection screen, use this connection string:
   ```
   mongodb://localhost:27017
   ```
   - Or click "Fill in connection fields individually" and enter:
     - **Hostname:** `localhost`
     - **Port:** `27017`
     - **Authentication:** None (for local development)

3. **Click "Connect"**

## Step 3: Select Your Database

After connecting, you should see:
- **Database Name:** `ToeGether`
- If you don't see it, it will be created automatically when your app first connects

Click on `ToeGether` to view your collections.

## Step 4: View Your Collections

You should see these collections in your `ToeGether` database:

### 1. **users**
   - Stores user profiles and authentication data
   - Fields include: `uid`, `email`, `displayName`, `fullName`, `profilePicture`, `feetPhotos`, `bio`, `profileCompleted`, etc.

### 2. **swipes**
   - Stores swipe actions (like/pass)
   - Fields: `swiperId`, `swipedId`, `action` ('like' or 'pass'), `createdAt`, `updatedAt`

### 3. **conversations**
   - Stores chat conversations between matched users
   - Fields: `participant1`, `participant2`, `lastMessage`, `lastMessageAt`, `unreadCounts`, etc.

### 4. **messages**
   - Stores individual chat messages
   - Fields: `conversationId`, `senderId`, `content`, `read`, `readAt`, `createdAt`, etc.

## Step 5: Explore Your Data

### View Documents:
1. Click on any collection name
2. You'll see a list of documents
3. Click on a document to view/edit it

### Query Data:
- Use the filter bar at the top to query documents
- Example: `{ "profileCompleted": true }` to see completed profiles
- Example: `{ "action": "like" }` in swipes collection

### Common Queries:

**Find all users with completed profiles:**
```json
{ "profileCompleted": true }
```

**Find all likes:**
```json
{ "action": "like" }
```

**Find mutual matches (users who liked each other):**
1. In `swipes` collection, find: `{ "swiperId": "USER_ID", "action": "like" }`
2. Note the `swipedId` values
3. Check if those users also liked back: `{ "swiperId": "SWIPED_ID", "swipedId": "USER_ID", "action": "like" }`

**Find conversations for a user:**
```json
{ "$or": [{ "participant1": "USER_ID" }, { "participant2": "USER_ID" }] }
```

## Step 6: Useful Operations

### View User Data:
1. Go to `users` collection
2. Find a user by their `uid` (Firebase UID)
3. View their profile data, preferences, etc.

### Check Swipes:
1. Go to `swipes` collection
2. See all swipe actions
3. Filter by `swiperId` to see who a user has swiped on
4. Filter by `swipedId` to see who has swiped on a user

### View Matches:
- A match exists when:
  - User A swiped right (like) on User B
  - AND User B swiped right (like) on User A
- Check the `swipes` collection for mutual likes

### View Chat Data:
1. Go to `conversations` collection to see all chat threads
2. Go to `messages` collection to see individual messages
3. Filter by `conversationId` to see all messages in a conversation

## Troubleshooting

### Can't Connect to MongoDB:

1. **MongoDB not running:**
   ```powershell
   # Start MongoDB service
   Start-Service -Name MongoDB
   ```

2. **Wrong port:**
   - Check your `.env` file in `backend/` folder
   - Default should be `mongodb://localhost:27017/ToeGether`

3. **Connection refused:**
   - Make sure MongoDB is installed and running
   - Check Windows Services for MongoDB

### Database Not Showing:

- The database will be created automatically when your app first connects
- Make sure your backend has connected at least once
- Check backend logs for MongoDB connection status

### Collections Not Showing:

- Collections are created when first document is inserted
- If you haven't used the app yet, collections won't exist
- Create a test user or run the app to generate data

## Quick Test

1. **Start your backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Check backend logs** - you should see:
   ```
   [MongoDB] Connected successfully
   [MongoDB] Database: ToeGether
   ```

3. **In MongoDB Compass:**
   - Refresh the database list (F5)
   - You should see `ToeGether` database
   - Collections will appear as data is created

## Connection String Reference

Your app uses this connection string (from `backend/.env`):
```
mongodb://localhost:27017/ToeGether
```

Breakdown:
- `mongodb://` - Protocol
- `localhost` - Host (your local machine)
- `27017` - Port (default MongoDB port)
- `ToeGether` - Database name

## Next Steps

1. ✅ Connect MongoDB Compass
2. ✅ View your database and collections
3. ✅ Explore user data
4. ✅ Check swipe actions
5. ✅ View chat conversations and messages

You can now use MongoDB Compass to:
- Debug data issues
- Manually create/edit documents
- Query and filter data
- Monitor database activity
- Export/import data

