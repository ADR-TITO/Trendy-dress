# PHP Backend Installation Guide

## Step 1: Install Composer

**Windows:**
Download from: https://getcomposer.org/download/

**Linux/Mac:**
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

## Step 2: Install Dependencies

```bash
cd backend-php
composer install
```

## Step 3: Install MongoDB PHP Extension

### Windows (XAMPP)

1. Download MongoDB PHP extension DLL from: https://pecl.php.net/package/mongodb
2. Copy `php_mongodb.dll` to `C:\xampp\php\ext\`
3. Edit `C:\xampp\php\php.ini`
4. Add: `extension=mongodb`
5. Restart Apache

### Linux

```bash
sudo apt-get update
sudo apt-get install php-mongodb
sudo systemctl restart apache2
```

### Mac

```bash
brew install php-mongodb
```

### Verify Installation

```bash
php -m | grep mongodb
```

Should output: `mongodb`

## Step 4: Configure Environment

```bash
cd backend-php
cp .env.example .env
nano .env
```

Add your MongoDB connection string (same format as Node.js version).

## Step 5: Test Locally

**Using PHP built-in server:**
```bash
cd backend-php
php -S localhost:8000
```

**Test endpoints:**
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/db-status
curl http://localhost:8000/api/products
```

## Step 6: Deploy to Production

### Apache Setup

1. Upload `backend-php/` folder to your server
2. Configure Apache virtual host:
```apache
<VirtualHost *:80>
    ServerName trendydresses.co.ke
    DocumentRoot /var/www/trendydresses.co.ke
    
    <Directory /var/www/trendydresses.co.ke/backend-php>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

3. Enable mod_rewrite:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Nginx Setup

```nginx
server {
    listen 80;
    server_name trendydresses.co.ke;
    
    root /var/www/trendydresses.co.ke;
    index index.html;
    
    location /api {
        root /var/www/trendydresses.co.ke/backend-php;
        try_files $uri $uri/ /index.php?route=$uri&$args;
        
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/index.php;
        fastcgi_param REQUEST_URI $uri;
    }
}
```

## Troubleshooting

### "Class not found" errors
- Run: `composer install`
- Check autoloader is loaded

### MongoDB connection fails
- Verify MongoDB extension: `php -m | grep mongodb`
- Check `.env` file has correct `MONGODB_URI`
- Test connection: `php -r "var_dump((new MongoDB\Client('your-uri'))->listDatabases());"`

### 404 errors
- Check `.htaccess` is enabled (Apache)
- Check Nginx configuration
- Verify file permissions

### CORS errors
- Check `.htaccess` has CORS headers
- Verify web server allows headers

## Next Steps

1. Test all endpoints
2. Verify MongoDB connection
3. Test M-Pesa STK Push
4. Update frontend if needed (should work automatically)

