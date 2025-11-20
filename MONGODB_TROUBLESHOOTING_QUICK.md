# Quick MongoDB Troubleshooting

## Check MongoDB Status

### Method 1: Browser Console
1. Open your website
2. Press F12 → Console tab
3. Type: `fetch('http://localhost:3000/api/db-status').then(r => r.json()).then(console.log)`
4. Press Enter

You'll see:
- `readyState: 1` = ✅ Connected
- `readyState: 0` = ❌ Not connected

### Method 2: Check Server Window
Look at the backend server console window for:
- ✅ `Connected to MongoDB successfully` = Working
- ❌ `MongoDB connection error` = Not working

## Quick Fixes

### If MongoDB Disconnected:

1. **Check Server is Running**
   - Server window should be open
   - Should see: `🚀 Server is running on http://localhost:3000`

2. **Restart Server**
   - Press `Ctrl+C` in server window to stop
   - Run: `npm start` in backend folder
   - Watch for MongoDB connection messages

3. **Check MongoDB Atlas**
   - Go to: https://cloud.mongodb.com/
   - Verify Network Access has `0.0.0.0/0`
   - Verify cluster is "Active" (not paused)

4. **Verify Connection String**
   - Check `backend/.env` file
   - Make sure connection string is correct

## Common Issues

### Server Crashed
- **Symptom:** No response from `/api/health`
- **Fix:** Restart server

### MongoDB Connection Lost
- **Symptom:** `readyState: 0` or empty products array
- **Fix:** Restart server, check IP whitelist

### Network Issue
- **Symptom:** Timeout errors
- **Fix:** Check internet connection, try different network

## Emergency Fallback

If MongoDB is not working, the website will automatically:
- ✅ Use localStorage (your 16 products are still there)
- ✅ Continue working normally
- ✅ Show warning messages in console

Your data is safe in localStorage as backup!









