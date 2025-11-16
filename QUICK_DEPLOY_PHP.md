# Quick Deploy PHP Backend - Production

## The Problem

Your production server returns **404** for `/api/health` because the PHP backend is not deployed.

## Quick Solution

### 1. Upload Files

Upload the entire `backend-php/` folder to your production server.

**Where to upload:**
- Same directory as your `index.html` (recommended)
- Or: `/var/www/trendydresses.co.ke/backend-php/`

### 2. Install Dependencies

SSH to your server:
```bash
cd /path/to/backend-php
composer install --no-dev
```

### 3. Create `.env` File

```bash
cd /path/to/backend-php
cp .env.example .env
nano .env
```

Paste your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### 4. Configure Web Server

**Apache:** Ensure `.htaccess` is in `backend-php/` folder and `mod_rewrite` is enabled.

**Nginx:** Add routing configuration (see `DEPLOY_PHP_BACKEND_PRODUCTION.md`).

### 5. Test

```bash
curl https://trendydresses.co.ke/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

## If You Don't Have SSH Access

Contact your hosting provider and ask them to:

1. Upload `backend-php/` folder to your website root
2. Run `composer install` in that folder
3. Configure web server to route `/api` requests to `backend-php/index.php`
4. Create `.env` file with your MongoDB connection string

## Need Help?

See `DEPLOY_PHP_BACKEND_PRODUCTION.md` for detailed instructions.

---

**Once deployed, refresh your website and it will work!** ✅

