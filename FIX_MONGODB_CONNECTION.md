# Fix MongoDB Connection Issues

## Current Problem
Migration is failing because MongoDB is not connected, even after allowing network access.

## Step-by-Step Fix

### 1. Verify IP Whitelist in MongoDB Atlas

1. Go to: https://cloud.mongodb.com/
2. Click **Network Access** (left sidebar)
3. Check if you see an entry with `0.0.0.0/0` or "Allow Access from Anywhere"
4. If not, click **Add IP Address** → **Allow Access from Anywhere** → **Confirm**
5. **Wait 2-3 minutes** for changes to propagate

### 2. Verify Connection String

Check your `.env` file in the `backend` folder:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
```

Make sure:
- ✅ Username is correct (from MongoDB Atlas → Database Access)
- ✅ Password is correct (from MongoDB Atlas → Database Access)
- ✅ Cluster name matches your MongoDB Atlas cluster
- ✅ Database name is included: `trendy-dresses`

### 3. Restart Backend Server

**IMPORTANT:** After updating IP whitelist, you MUST restart the server:

1. **Stop the server:**
   - Find the PowerShell/Command Prompt window running the server
   - Press `Ctrl+C` to stop it

2. **Start the server again:**
   ```bash
   cd backend
   npm start
   ```

3. **Watch for connection messages:**
   - ✅ `✅ Connected to MongoDB successfully` = Working!
   - ❌ `❌ MongoDB connection error` = Still not connected

### 4. Check Server Console for Errors

Look at the server console window. You should see one of these:

#### ✅ Success:
```
🔄 Attempting to connect to MongoDB...
✅ Connected to MongoDB successfully
📊 Database: trendy-dresses
🔗 Host: cluster0.giznyaq.mongodb.net
```

#### ❌ Still Failing:
```
❌ MongoDB connection error: MongoServerSelectionError
❌ Error message: [specific error]
```

### 5. Common Error Messages and Fixes

#### "MongoServerSelectionError: connection timed out"
- **Fix:** Check internet connection, verify IP whitelist, wait longer after updating whitelist

#### "Authentication failed"
- **Fix:** Check username/password in connection string

#### "getaddrinfo ENOTFOUND"
- **Fix:** Check cluster name in connection string matches MongoDB Atlas

#### "IP not whitelisted"
- **Fix:** Make sure IP whitelist has `0.0.0.0/0` or your current IP

### 6. Test Connection

After restarting, test if MongoDB is connected:

1. Open browser console (F12)
2. Type: `apiService.checkBackend()`
3. Should return: `true`

4. Try creating a test product:
   ```javascript
   apiService.createProduct({name:"Test", category:"shirts", price:100, size:"M", quantity:1})
   ```

### 7. Once Connected, Run Migration

When you see `✅ Connected to MongoDB successfully` in server console:

1. Open browser console (F12)
2. Type: `migrateProductsToMongoDB()`
3. Press Enter
4. Watch for migration progress

## Still Not Working?

If MongoDB still won't connect after following all steps:

1. **Check MongoDB Atlas Dashboard:**
   - Is your cluster running? (should show "Active")
   - Are there any alerts or warnings?

2. **Verify Database User:**
   - Go to MongoDB Atlas → Database Access
   - Make sure your database user exists and has read/write permissions
   - Verify the username and password match your connection string

3. **Try Different Network:**
   - Some networks block MongoDB connections
   - Try from a different network or use mobile hotspot

4. **Check Firewall:**
   - Windows Firewall might be blocking the connection
   - Temporarily disable to test

## Quick Test Command

Run this in PowerShell to test MongoDB connection directly:
```powershell
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```







