# MongoDB Connection Troubleshooting

## Current Issue: 503 Service Unavailable

The backend server is running but MongoDB is not connected. This is usually due to **IP whitelist restrictions** in MongoDB Atlas.

## Quick Fix: Allow All IPs (For Development)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Click on **Network Access** (in the left sidebar)
4. Click **Add IP Address**
5. Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
6. Click **Confirm**

⚠️ **Security Note:** Allowing all IPs is fine for development, but for production, you should whitelist only specific IPs.

## Alternative: Add Your Current IP

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **Network Access**
3. Click **Add IP Address**
4. Click **Add Current IP Address** (or manually enter your IP)
5. Click **Confirm**

## Verify Connection String

Your connection string in `.env` should look like:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
```

Make sure:
- ✅ Username and password are correct (from MongoDB Atlas → Database Access)
- ✅ Cluster name matches your MongoDB Atlas cluster
- ✅ Database name is included (`trendy-dresses`)

## Test Connection

After updating IP whitelist, restart the backend server:
```bash
cd backend
npm start
```

You should see:
```
✅ Connected to MongoDB successfully
📊 Database: trendy-dresses
```

## Common Errors

### MongoServerSelectionError
- **Cause:** IP not whitelisted or network issue
- **Fix:** Add your IP to MongoDB Atlas Network Access

### Authentication failed
- **Cause:** Wrong username/password
- **Fix:** Check credentials in MongoDB Atlas → Database Access

### Timeout
- **Cause:** Network/firewall blocking connection
- **Fix:** Check firewall settings, try different network

## Check Server Logs

The server console will show detailed error messages. Look for:
- `❌ MongoDB connection error:`
- `⚠️ Could not connect to MongoDB server`







