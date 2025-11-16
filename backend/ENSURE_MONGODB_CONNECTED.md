# ✅ Ensure MongoDB is Connected and Running

## Quick Check

Run this command to verify MongoDB connection:

```bash
cd backend
node verify-mongodb-connection.js
```

**Expected output:**
```
✅ MongoDB connection successful!
✅ Database query successful!
✅ Write operation successful!
✅ ALL CHECKS PASSED!
```

---

## Step-by-Step Verification

### Step 1: Check Backend Server is Running

```bash
cd backend
node check-backend.js
```

**Expected:** `✅ Backend server is running!`

If not running:
```bash
npm start
# OR
node server.js
```

### Step 2: Verify .env File

Check `backend/.env` exists and has:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
```

**Verify:**
- Connection string is correct
- Username and password are correct
- Database name is `trendy-dresses` (or your preferred name)

### Step 3: Test MongoDB Connection

```bash
cd backend
node verify-mongodb-connection.js
```

This will:
- ✅ Check environment variables
- ✅ Test MongoDB connection
- ✅ Test database queries
- ✅ Test write operations
- ✅ Test delete operations

---

## Common Issues and Fixes

### Issue 1: "MongoServerSelectionError"

**Error:** Cannot connect to MongoDB server

**Fixes:**
1. **Check MongoDB Atlas IP Whitelist:**
   - Go to: https://cloud.mongodb.com/
   - Click: **Network Access**
   - Click: **Add IP Address**
   - Click: **Allow Access from Anywhere** (or add `0.0.0.0/0`)
   - Wait 1-2 minutes for changes to take effect

2. **Check MongoDB Atlas Cluster Status:**
   - Go to: https://cloud.mongodb.com/
   - Click: **Clusters**
   - Ensure cluster is **Running** (not paused)
   - If paused, click **Resume**

3. **Verify Connection String:**
   - Check `backend/.env` file
   - Ensure `MONGODB_URI` is correct
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority`

### Issue 2: "MongoNetworkError"

**Error:** Network error - cannot reach MongoDB

**Fixes:**
1. **Check Internet Connection:**
   ```bash
   ping google.com
   ```

2. **Check Firewall:**
   - Ensure firewall allows outbound connections
   - Port 27017 (MongoDB) should be allowed

3. **Check DNS:**
   ```bash
   nslookup cluster0.xxxxx.mongodb.net
   ```

### Issue 3: "Authentication Failed"

**Error:** Username/password incorrect

**Fixes:**
1. **Verify MongoDB Atlas Credentials:**
   - Go to: https://cloud.mongodb.com/
   - Click: **Database Access**
   - Check username and password
   - Reset password if needed

2. **Update .env File:**
   - Update `MONGODB_URI` with correct credentials
   - Format: `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/...`

### Issue 4: "Database Query Failed"

**Error:** Cannot query database

**Fixes:**
1. **Check Database User Permissions:**
   - Go to: https://cloud.mongodb.com/
   - Click: **Database Access**
   - Ensure user has **Read and write** permissions

2. **Check Database Name:**
   - Verify database name in connection string matches Atlas database
   - Default: `trendy-dresses`

---

## Verification Checklist

- [ ] Backend server is running (`node check-backend.js`)
- [ ] `.env` file exists and has `MONGODB_URI`
- [ ] MongoDB connection test passes (`node verify-mongodb-connection.js`)
- [ ] MongoDB Atlas IP whitelist includes your IP (or `0.0.0.0/0`)
- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] Database user has read/write permissions
- [ ] Connection string is correct format
- [ ] No firewall blocking connection
- [ ] Internet connection is working

---

## Production Server Check

If running on production server:

```bash
# SSH into server
ssh user@your-server-ip

# Navigate to backend
cd /var/www/trendydresses.co.ke/backend

# Check MongoDB connection
node verify-mongodb-connection.js

# Check backend status
node check-backend.js

# Check PM2 process
pm2 list
pm2 logs trendy-dresses-api
```

---

## API Endpoint Check

Test MongoDB via API:

```bash
# Health check
curl http://localhost:3000/api/health

# Database status
curl http://localhost:3000/api/db-status
```

**Expected response:**
```json
{
  "initialized": true,
  "readyState": 1,
  "readyStateText": "connected",
  "host": "cluster0.xxxxx.mongodb.net",
  "name": "trendy-dresses"
}
```

---

## Still Having Issues?

1. **Check Backend Logs:**
   ```bash
   cd backend
   npm start
   # Watch for MongoDB connection messages
   ```

2. **Check MongoDB Atlas Logs:**
   - Go to: https://cloud.mongodb.com/
   - Click: **Monitoring** → **Logs**
   - Look for connection attempts

3. **Test Connection String Directly:**
   ```bash
   # Install MongoDB shell (optional)
   mongosh "your-connection-string"
   ```

4. **Contact Support:**
   - MongoDB Atlas Support: https://www.mongodb.com/support
   - Check MongoDB Atlas Status: https://status.mongodb.com/

---

## Success Indicators

When MongoDB is connected correctly, you should see:

✅ Backend logs show: `✅ Connected to MongoDB successfully`
✅ API `/api/db-status` returns: `"readyState": 1`
✅ `verify-mongodb-connection.js` passes all checks
✅ Products load from MongoDB (not localStorage)
✅ No errors in browser console

---

**Once MongoDB is connected, your app will use it as permanent, centralized storage!** 🚀

