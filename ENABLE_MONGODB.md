# Enable MongoDB - Quick Start Guide

## Step 1: Create .env File

1. Navigate to the `backend` folder
2. Create a new file named `.env` (no extension)
3. Add the following content:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
PORT=3000
```

**Note:** Replace `username`, `password`, and `cluster0.xxxxx` with your actual MongoDB Atlas credentials from https://cloud.mongodb.com/

**OR** copy the template file:
- Copy `backend/.env.example` to `backend/.env`

## Step 2: Install Dependencies (if not already installed)

Open PowerShell or Command Prompt in the `backend` folder and run:

```powershell
cd backend
npm install
```

## Step 3: Start the Backend Server

### Option A: Using the Startup Script (Windows)

Double-click `backend/START_MONGODB.bat`

### Option B: Using Command Line

Open PowerShell or Command Prompt:

```powershell
cd backend
npm start
```

### Option C: Using Node.js directly

```powershell
cd backend
node server.js
```

## Step 4: Verify Server is Running

You should see these messages in the server window:

```
🚀 Server is running on http://localhost:3000
✅ Connected to MongoDB successfully
📊 Database: trendy-dresses
🔗 Host: cluster0.xxxxx.mongodb.net
```

## Step 5: Test the Connection

Open your browser and go to:
- http://localhost:3000/api/health

You should see:
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

## Step 6: Refresh Your Website

1. Open your website (`index.html`)
2. Refresh the page (F5)
3. Check the browser console - you should see:
   - `✅ MongoDB backend is available - using API`
   - `✅ MongoDB is connected and ready`

## Troubleshooting

### Server Won't Start

**Check if port 3000 is in use:**
```powershell
netstat -ano | findstr :3000
```

**Kill existing process:**
```powershell
taskkill /PID <process_id> /F
```

### MongoDB Connection Error

**1. Check MongoDB Atlas IP Whitelist:**
   - Go to: https://cloud.mongodb.com/
   - Click **Network Access** (left sidebar)
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
   - Click **Confirm**
   - **Wait 2-3 minutes** for changes to propagate

**2. Verify Connection String:**
   - Check `backend/.env` file
   - Make sure username and password are correct (from MongoDB Atlas → Database Access)
   - Verify cluster name matches your MongoDB Atlas cluster

**3. Check Internet Connection:**
   - MongoDB Atlas requires internet connection
   - Make sure you're connected to the internet

### "Cannot find module" Error

Install dependencies:
```powershell
cd backend
npm install
```

### Products Not Loading from MongoDB

1. Check server console for errors
2. Verify MongoDB connection status at: http://localhost:3000/api/db-status
3. Check browser console for error messages
4. Make sure server is running on port 3000

## Migration from localStorage to MongoDB

If you have products in localStorage and want to migrate them to MongoDB:

1. Make sure backend server is running
2. Open browser console (F12)
3. Run: `migrateProductsToMongoDB()`
4. Wait for migration to complete

## Important Notes

- **Keep the server window open** while using the website
- The server must be running for MongoDB to work
- If you close the server, the website will automatically fall back to localStorage
- All data is stored in MongoDB Atlas cloud database
- Your products will be accessible from any device when MongoDB is enabled

## Success Indicators

✅ Server shows: "Connected to MongoDB successfully"
✅ Browser console shows: "MongoDB backend is available"
✅ Products load from MongoDB instead of localStorage
✅ No CORS errors in browser console
✅ API health check returns: `{"status":"ok"}`



