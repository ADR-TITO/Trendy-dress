# 🚀 Deploy PHP Backend to Shared Hosting (cPanel)

## Your Server Information

- **Server Type:** Shared Hosting (cPanel)
- **Database:** MariaDB (but we use MongoDB)
- **User:** cpses_tr35jagar6@localhost
- **Server:** Localhost via UNIX socket

## Important Notes

⚠️ **Your backend uses MongoDB (not MariaDB)**
- MongoDB is a separate database service
- You need MongoDB Atlas (cloud) or MongoDB installed on server
- MariaDB shown above is for other applications

## Deployment Steps

### Step 1: Upload Backend Files

1. **Access your server:**
   - Use cPanel File Manager
   - Or use FTP/SFTP client (FileZilla, WinSCP)

2. **Upload `backend-php/` folder:**
   - Upload entire `backend-php/` folder to your server
   - Recommended location: `public_html/backend-php/` or `public_html/api/`

### Step 2: Install Dependencies

**Option A: Via cPanel Terminal/SSH**

```bash
cd public_html/backend-php
composer install --no-dev
```

**Option B: Via cPanel File Manager**
- Upload `composer.phar` to `backend-php/` folder
- Run via terminal: `php composer.phar install --no-dev`

**Option C: Upload vendor folder**
- Install dependencies locally: `composer install --no-dev`
- Upload entire `vendor/` folder to server

### Step 3: Configure .env File

1. **Create `.env` file on server:**
   ```bash
   cd public_html/backend-php
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses?retryWrites=true&w=majority
   ```

   ⚠️ **Use MongoDB Atlas** (cloud MongoDB) - shared hosting usually doesn't have MongoDB installed.

### Step 4: Configure Web Server

#### Option A: Apache (.htaccess - Already Configured)

The `backend-php/.htaccess` file should work automatically if:
- Apache mod_rewrite is enabled
- `.htaccess` files are allowed

**Test:** `https://trendydresses.co.ke/backend-php/api/health`

#### Option B: Configure cPanel Subdomain/Directory

1. **Create subdomain:** `api.trendydresses.co.ke`
   - Point to: `public_html/backend-php/`

2. **Or use directory:** `trendydresses.co.ke/api`
   - Create symlink or configure in cPanel

### Step 5: Set File Permissions

```bash
chmod 755 backend-php/
chmod 644 backend-php/*.php
chmod 644 backend-php/.htaccess
chmod 755 backend-php/logs/
```

### Step 6: Test Backend

1. **Health Check:**
   ```
   https://trendydresses.co.ke/backend-php/api/health
   ```

2. **Should return:**
   ```json
   {"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
   ```

## MongoDB Setup

### Use MongoDB Atlas (Recommended)

1. **Create account:** https://www.mongodb.com/cloud/atlas

2. **Create cluster:**
   - Free tier available
   - Choose region closest to your server

3. **Get connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses
   ```

4. **Add to .env:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses?retryWrites=true&w=majority
   ```

5. **Configure IP whitelist:**
   - Add your server IP (or `0.0.0.0/0` for all)
   - Add your local development IP

## cPanel Specific Configuration

### Enable PHP Extensions

1. **In cPanel:**
   - Go to "Select PHP Version"
   - Enable extensions:
     - `curl`
     - `fileinfo`
     - `mbstring`
     - `openssl`
     - `mongodb` (if available)

### PHP Version

- **Required:** PHP 7.4 or higher
- **Recommended:** PHP 8.0 or higher
- Set in cPanel: "Select PHP Version"

### Cron Jobs (For Health Monitoring)

1. **In cPanel:**
   - Go to "Cron Jobs"
   - Add cron job:
     ```
     */5 * * * * cd /home/username/public_html/backend-php && php health-monitor.php
     ```

## URL Configuration

### Option 1: Subdirectory
```
https://trendydresses.co.ke/backend-php/api/health
```

### Option 2: Subdomain
```
https://api.trendydresses.co.ke/api/health
```

### Option 3: Root API Path
```
https://trendydresses.co.ke/api/health
```
(Requires .htaccess in root or cPanel configuration)

## Update Frontend API URL

After deployment, update `api-service.js`:

```javascript
// Production URL
let API_BASE_URL = 'https://trendydresses.co.ke/backend-php/api';
// OR
let API_BASE_URL = 'https://api.trendydresses.co.ke/api';
```

## Troubleshooting

### 404 Error

1. **Check .htaccess:**
   - Ensure mod_rewrite is enabled
   - Check .htaccess file exists

2. **Check file paths:**
   - Verify files uploaded correctly
   - Check file permissions

3. **Test directly:**
   ```
   https://trendydresses.co.ke/backend-php/index.php
   ```

### 500 Error

1. **Check PHP errors:**
   - Enable error display in cPanel
   - Check error logs

2. **Check .env file:**
   - Ensure MongoDB connection string is correct
   - Check file permissions

3. **Check dependencies:**
   - Ensure `vendor/` folder exists
   - Run `composer install` if missing

### MongoDB Connection Error

1. **Check MongoDB Atlas:**
   - Verify IP whitelist includes server IP
   - Check connection string is correct
   - Verify database user credentials

2. **Test connection:**
   ```bash
   php -r "require 'vendor/autoload.php'; \$client = new MongoDB\Client('mongodb+srv://...'); echo 'Connected';"
   ```

## Quick Checklist

- [ ] Backend files uploaded to server
- [ ] Dependencies installed (`composer install`)
- [ ] `.env` file created with MongoDB connection
- [ ] File permissions set correctly
- [ ] PHP version 7.4+ selected in cPanel
- [ ] PHP extensions enabled
- [ ] MongoDB Atlas configured
- [ ] Health check works: `https://trendydresses.co.ke/backend-php/api/health`
- [ ] Frontend API URL updated

---

**Your backend is now deployed to production!** ✅

