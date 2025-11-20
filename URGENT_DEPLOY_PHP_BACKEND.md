# ⚠️ URGENT: Deploy PHP Backend to Fix 404 Error

## Current Problem

Your production server returns **404** for `/api/health` because the PHP backend is **not deployed**.

```
GET https://trendydresses.co.ke/api/health
[HTTP/3 404  161ms]
```

## Quick Solution

### Step 1: Upload PHP Backend Files

**Upload the entire `backend-php/` folder** to your production server.

**Where to upload:**
- Same directory as your `index.html` (recommended)
- Or: `/var/www/trendydresses.co.ke/backend-php/`

### Step 2: Install Dependencies

**If you have SSH access:**
```bash
cd /path/to/backend-php
composer install --no-dev
```

**If you don't have SSH:**
- Contact your hosting provider
- Ask them to run `composer install` in the `backend-php/` folder

### Step 3: Create `.env` File

Create `.env` file in `backend-php/` folder:

```bash
cd backend-php
cp .env.example .env
nano .env
```

Add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### Step 4: Configure Web Server

#### Option A: Apache (Most Common)

**If `backend-php/` is in web root:**
- The `.htaccess` file should work automatically
- Ensure `mod_rewrite` is enabled

**If `backend-php/` is in subdirectory:**
- You may need to place `.htaccess` in root directory
- Or configure Apache virtual host (see below)

**Apache Virtual Host Configuration:**
```apache
<VirtualHost *:80>
    ServerName trendydresses.co.ke
    DocumentRoot /var/www/trendydresses.co.ke
    
    # Route /api to PHP backend
    Alias /api /var/www/trendydresses.co.ke/backend-php
    <Directory /var/www/trendydresses.co.ke/backend-php>
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
    </Directory>
</VirtualHost>
```

#### Option B: Nginx

Add to your Nginx configuration:
```nginx
location /api {
    root /var/www/trendydresses.co.ke/backend-php;
    try_files $uri $uri/ /index.php?route=$uri&$args;
    
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root/index.php;
    fastcgi_param REQUEST_URI $uri;
}
```

### Step 5: Test

```bash
curl https://trendydresses.co.ke/api/health
```

**Should return:**
```json
{"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
```

## If You Don't Have SSH Access

**Contact your hosting provider** and provide them with:

1. **Upload `backend-php/` folder** to your website
2. **Run:** `composer install` in `backend-php/` folder
3. **Create `.env` file** with MongoDB connection string
4. **Configure web server** to route `/api` requests to `backend-php/index.php`

## Troubleshooting

### Still Getting 404?

1. **Check file permissions:**
   ```bash
   chmod -R 755 backend-php
   chmod 644 backend-php/.htaccess
   ```

2. **Check if PHP is working:**
   - Create `test.php` in `backend-php/`:
     ```php
     <?php phpinfo(); ?>
   ```
   - Visit: `https://trendydresses.co.ke/backend-php/test.php`
   - Should show PHP information

3. **Check Apache error logs:**
   ```bash
   tail -f /var/log/apache2/error.log
   ```

4. **Test directly:**
   ```bash
   curl https://trendydresses.co.ke/backend-php/index.php?route=health
   ```

### MongoDB Connection Fails?

1. Check `.env` file exists and has correct connection string
2. Verify MongoDB Atlas IP whitelist includes your server IP
3. Test connection manually

## Quick Test Script

Create `test-backend.php` in `backend-php/`:

```php
<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'PHP backend is working',
    'php_version' => phpversion(),
    'mongodb_extension' => extension_loaded('mongodb') ? 'installed' : 'not installed'
]);
?>
```

Visit: `https://trendydresses.co.ke/backend-php/test-backend.php`

---

**Once deployed, your website will work!** ✅

See `DEPLOY_PHP_BACKEND_PRODUCTION.md` for detailed instructions.

