# Start MongoDB Backend Server

## Quick Start (Windows)

### Option 1: Using the Batch File (Easiest)
1. Navigate to the `backend` folder
2. Double-click `START_MONGODB.bat`
3. Wait for: `✅ Connected to MongoDB successfully`
4. Keep the window open while using the website

### Option 2: Using PowerShell/Command Prompt
1. Open PowerShell or Command Prompt
2. Navigate to the backend folder:
   ```powershell
   cd "C:\Users\user\TRENDY DRESSES\backend"
   ```
3. Start the server:
   ```powershell
   npm start
   ```
   OR
   ```powershell
   node server.js
   ```

### Option 3: Using the PowerShell Script
1. Right-click `backend/START_MONGODB.ps1`
2. Select "Run with PowerShell"
3. Wait for: `✅ Connected to MongoDB successfully`

## What You Should See

When the server starts successfully, you'll see:
```
🚀 Server is running on http://localhost:3000
✅ Connected to MongoDB successfully
📊 Database: trendy-dresses
🔗 Host: cluster0.giznyaq.mongodb.net
```

## Verify Server is Running

Open a browser and go to:
- http://localhost:3000/api/health

You should see:
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

## After Starting the Server

1. **Keep the server window open** - Don't close it!
2. **Refresh your website** (press F5)
3. Check the browser console - you should see:
   - `✅ MongoDB backend is available - using API`
   - `✅ MongoDB is connected and ready`
   - `✅ Using MongoDB - unlimited storage, no quota limits`

## Troubleshooting

### Port 3000 Already in Use
If you get an error about port 3000 being in use:
```powershell
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with the process ID)
taskkill /PID <PID> /F
```

### MongoDB Connection Error
If you see MongoDB connection errors:
1. Check your internet connection
2. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Check the `.env` file in the backend folder
4. Wait 2-3 minutes after updating IP whitelist

### Server Won't Start
1. Make sure you're in the `backend` folder
2. Run: `npm install` (if dependencies are missing)
3. Check for error messages in the console

## Important Notes

- **Keep the server window open** while using the website
- The server must be running for MongoDB to work
- If you close the server, refresh your website and it will fall back to localStorage
- All data is stored in MongoDB Atlas cloud database





