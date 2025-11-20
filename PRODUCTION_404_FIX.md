# Fix Production 404 Error - PHP Backend

## Current Issue

```
GET https://trendydresses.co.ke/api/health
[HTTP/3 404  147ms]
```

This means the PHP backend is **not deployed** or **not configured** on your production server.

## Solution Options

### Option 1: Deploy PHP Backend (Recommended)

**Steps:**

1. **Upload `backend-php/` folder** to your server
2. **Install dependencies:**
   ```bash
   cd backend-php
   composer install --no-dev
   ```
3. **Create `.env` file** with MongoDB connection string
4. **Configure web server** to route `/api` to PHP

**See:** `DEPLOY_PHP_BACKEND_PRODUCTION.md` for detailed steps

### Option 2: Use Node.js Backend (Temporary)

If you can't deploy PHP backend right now:

1. **SSH to your server**
2. **Upload `backend/` folder**
3. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
4. **Create `.env` file**
5. **Start with PM2:**
   ```bash
   pm2 start server.js --name trendy-dresses-api
   pm2 save
   ```
6. **Configure Nginx/Apache** to proxy `/api` to `http://localhost:3001`

## Quick Test

After deployment, test:
```bash
curl https://trendydresses.co.ke/api/health
```

Should return:
```json
{"status":"ok","backend":"PHP"}
```

## Why This Happened

The PHP backend was created locally but hasn't been uploaded to your production server yet. The frontend is trying to connect to `/api` but the server doesn't know how to handle those requests.

## Next Steps

1. ✅ Choose deployment option (PHP recommended)
2. ✅ Follow deployment guide
3. ✅ Test API endpoints
4. ✅ Refresh website
5. ✅ Verify MongoDB connection

---

**Need help?** See `DEPLOY_PHP_BACKEND_PRODUCTION.md` for step-by-step instructions.

