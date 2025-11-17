# 🚀 DEPLOY PHP BACKEND - URGENT

## Current Status: ❌ NOT DEPLOYED

Your production server returns **404** because this PHP backend is not deployed.

## Quick Deployment (5 Steps)

### 1. Upload Files
Upload this entire `backend-php/` folder to your production server.

### 2. Install Dependencies
```bash
cd backend-php
composer install --no-dev
```

### 3. Create .env File
```bash
cp .env.example .env
nano .env
```

Add:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### 4. Configure Web Server

**Apache:** Ensure `.htaccess` is enabled and `mod_rewrite` is on.

**Nginx:** Configure routing (see main deployment guide).

### 5. Test
```bash
curl https://trendydresses.co.ke/api/health
```

## Need Help?

- **With SSH:** See `DEPLOY_PHP_BACKEND_PRODUCTION.md`
- **Without SSH:** Contact hosting provider with `URGENT_DEPLOY_PHP_BACKEND.md`

## Test Script

After deployment, test:
```
https://trendydresses.co.ke/backend-php/test-backend.php
```

This will show:
- ✅ PHP version
- ✅ MongoDB extension status
- ✅ File structure
- ✅ Connection test

---

**Once deployed, your website will work!** ✅

