# Deploy PHP Backend to Production - Step by Step

## Current Issue

Your production server is returning **404** for `/api/health`, which means the PHP backend is not deployed or not configured correctly.

## Quick Fix Steps

### Step 1: Upload PHP Backend Files

1. **Upload `backend-php/` folder** to your production server
   - Location: `/var/www/trendydresses.co.ke/backend-php/` (or your web root)
   - Or: Upload to same directory as your `index.html`

### Step 2: Install Dependencies

SSH into your server and run:
```bash
cd /path/to/backend-php
composer install --no-dev
```

### Step 3: Configure Environment

```bash
cd /path/to/backend-php
cp .env.example .env
nano .env
```

Add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### Step 4: Configure Web Server

#### Option A: Apache (Recommended)

**If `backend-php/` is in web root:**
- The `.htaccess` file should work automatically
- Ensure `mod_rewrite` is enabled:
  ```bash
  sudo a2enmod rewrite
  sudo systemctl restart apache2
  ```

**If `backend-php/` is in subdirectory:**
- Move `.htaccess` to root or configure Apache virtual host:
  ```apache
  <VirtualHost *:80>
      ServerName trendydresses.co.ke
      DocumentRoot /var/www/trendydresses.co.ke
      
      <Directory /var/www/trendydresses.co.ke>
          AllowOverride All
          Require all granted
      </Directory>
      
      # Route /api to PHP backend
      Alias /api /var/www/trendydresses.co.ke/backend-php
      <Directory /var/www/trendydresses.co.ke/backend-php>
          AllowOverride All
          Require all granted
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

Then restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Test

```bash
curl https://trendydresses.co.ke/api/health
```

Should return:
```json
{"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
```

### Step 6: Verify MongoDB Connection

```bash
curl https://trendydresses.co.ke/api/db-status
```

Should show:
```json
{"connected":true,"readyState":1,"readyStateText":"connected"}
```

## Troubleshooting

### 404 Error Still Appearing

1. **Check file permissions:**
   ```bash
   chmod -R 755 /path/to/backend-php
   chmod 644 /path/to/backend-php/.htaccess
   ```

2. **Check Apache error logs:**
   ```bash
   tail -f /var/log/apache2/error.log
   ```

3. **Test PHP directly:**
   ```bash
   php -r "echo 'PHP is working';"
   ```

4. **Check if mod_rewrite is enabled:**
   ```bash
   apache2ctl -M | grep rewrite
   ```

### MongoDB Connection Fails

1. **Check `.env` file exists and has correct connection string**
2. **Verify MongoDB Atlas IP whitelist includes your server IP**
3. **Test connection:**
   ```bash
   php -r "require 'vendor/autoload.php'; \$client = new MongoDB\Client('your-connection-string'); var_dump(\$client->listDatabases());"
   ```

### Permission Denied

```bash
sudo chown -R www-data:www-data /path/to/backend-php
chmod -R 755 /path/to/backend-php
```

## Alternative: Quick Test with PHP Built-in Server

For testing only (not for production):

```bash
cd backend-php
php -S localhost:8000
```

Then test:
```bash
curl http://localhost:8000/api/health
```

## After Deployment

1. ✅ Test: `curl https://trendydresses.co.ke/api/health`
2. ✅ Test: `curl https://trendydresses.co.ke/api/products`
3. ✅ Refresh your website
4. ✅ Check browser console - should see "✅ MongoDB backend is available"

---

**Once deployed, your website will automatically use the PHP backend!** 🚀

