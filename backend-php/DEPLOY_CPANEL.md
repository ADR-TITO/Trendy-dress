# 📦 Deploy to cPanel Shared Hosting

## Quick Deployment Guide

### Step 1: Upload Files

1. **Via cPanel File Manager:**
   - Navigate to `public_html/`
   - Upload `backend-php/` folder

2. **Via FTP:**
   - Connect to your server
   - Upload `backend-php/` folder to `public_html/`

### Step 2: Install Dependencies

**Via cPanel Terminal:**
```bash
cd public_html/backend-php
composer install --no-dev
```

**Or upload vendor folder:**
- Install locally: `composer install --no-dev`
- Upload `vendor/` folder to server

### Step 3: Configure .env

1. **Create `.env` file:**
   ```bash
   cd public_html/backend-php
   cp .env.example .env
   ```

2. **Edit `.env`:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses
   ```

### Step 4: Set Permissions

```bash
chmod 755 backend-php/
chmod 644 backend-php/*.php
chmod 644 backend-php/.htaccess
```

### Step 5: Test

Visit: `https://trendydresses.co.ke/backend-php/api/health`

Should return: `{"status":"ok","backend":"PHP"}`

## MongoDB Setup

**Use MongoDB Atlas (Cloud):**
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env` file
5. Whitelist server IP

## cPanel Configuration

### PHP Version
- Set to PHP 7.4+ in "Select PHP Version"

### PHP Extensions
Enable in "Select PHP Version":
- curl
- fileinfo
- mbstring
- openssl

### Cron Job (Optional)
```
*/5 * * * * cd /home/username/public_html/backend-php && php health-monitor.php
```

## URL Options

1. **Subdirectory:** `trendydresses.co.ke/backend-php/api/`
2. **Subdomain:** `api.trendydresses.co.ke/api/`
3. **Root path:** `trendydresses.co.ke/api/` (requires config)

---

**See `DEPLOY_TO_SHARED_HOSTING.md` for detailed guide.**

