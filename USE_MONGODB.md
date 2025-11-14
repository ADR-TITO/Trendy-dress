# Using MongoDB Instead of IndexedDB

The application is now configured to **prefer MongoDB** over IndexedDB/localStorage. MongoDB provides unlimited storage and better performance.

## Quick Start

### Step 1: Start the Backend Server

**Option A: Using the startup script (Windows)**
- Double-click `backend/START_MONGODB.bat`

**Option B: Using PowerShell/Command Prompt**
```powershell
cd backend
npm start
```

**Option C: Using Node.js directly**
```powershell
cd backend
node server.js
```

### Step 2: Verify Server is Running

You should see these messages in the server window:
```
🚀 Server is running on http://localhost:3000
✅ Connected to MongoDB successfully
📊 Database: trendy-dresses
🔗 Host: cluster0.giznyaq.mongodb.net
```

### Step 3: Refresh Your Website

1. Open your website (`index.html`)
2. Refresh the page (F5)
3. Check the browser console - you should see:
   - `✅ MongoDB backend is available - using API`
   - `✅ MongoDB is connected and ready`
   - `✅ Using MongoDB - unlimited storage, no quota limits`

## How It Works

### Automatic Detection
- The application **automatically checks** if the MongoDB backend is available
- If available → Uses MongoDB (preferred)
- If not available → Falls back to localStorage (temporary)

### Storage Priority
1. **MongoDB** (Preferred) - Unlimited storage, cloud-based
2. **localStorage** (Fallback) - Limited to ~5MB, temporary only

### IndexedDB
- **IndexedDB is disabled** when MongoDB is preferred
- The application will not use IndexedDB if MongoDB backend is available

## Benefits of MongoDB

✅ **Unlimited Storage** - No 5MB limit like localStorage
✅ **Cloud Storage** - Access your data from anywhere
✅ **Better Performance** - Faster queries and operations
✅ **Data Persistence** - Data stored in MongoDB Atlas cloud
✅ **Scalability** - Can handle thousands of products with images

## Troubleshooting

### Backend Won't Start

1. **Check if port 3000 is in use:**
   ```powershell
   netstat -ano | findstr :3000
   ```

2. **Kill existing process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Check MongoDB connection:**
   - Verify `.env` file exists in `backend/` folder
   - Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### MongoDB Connection Error

1. **Check MongoDB Atlas Network Access:**
   - Go to: https://cloud.mongodb.com/
   - Click **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
   - Wait 2-3 minutes for changes to propagate

2. **Verify Connection String:**
   - Check `backend/.env` file has correct `MONGODB_URI`

3. **Restart Server:**
   - Stop server (Ctrl+C)
   - Start again: `npm start`

### Products Not Loading from MongoDB

1. Check server console for errors
2. Verify MongoDB connection at: http://localhost:3000/api/db-status
3. Check browser console for error messages
4. Make sure server is running on port 3000

## Migration from localStorage to MongoDB

If you have products in localStorage and want to migrate them to MongoDB:

1. **Start the backend server** (see Step 1 above)
2. **Open browser console** (F12)
3. **Run migration:**
   ```javascript
   migrateProductsToMongoDB()
   ```
4. **Wait for completion** - you'll see success/failure messages

## Console Messages

### When MongoDB is Available:
```
✅ MongoDB backend is available - using API
✅ MongoDB is connected and ready
✅ Using MongoDB - unlimited storage, no quota limits
📦 Loaded X products from MongoDB API
```

### When MongoDB is Not Available:
```
⚠️ MongoDB backend not available
⚠️ To use MongoDB:
   1. Navigate to the "backend" folder
   2. Run: npm start
   3. Wait for "✅ Connected to MongoDB successfully"
   4. Refresh this page
ℹ️ Currently using localStorage as fallback (temporary)
```

## Important Notes

- **Keep the server window open** while using the website
- The server must be running for MongoDB to work
- If you close the server, refresh your website and it will fall back to localStorage
- All data is stored in MongoDB Atlas cloud database
- Your products will be accessible from any device when MongoDB is enabled

## Success Indicators

✅ Server shows: "Connected to MongoDB successfully"
✅ Browser console shows: "MongoDB backend is available"
✅ Products load from MongoDB instead of localStorage
✅ No storage quota warnings
✅ API health check returns: `{"status":"ok"}`




