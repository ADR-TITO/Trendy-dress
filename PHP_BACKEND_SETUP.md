# PHP Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend-php
composer install
```

### 2. Install MongoDB PHP Extension

**Check if installed:**
```bash
php -m | grep mongodb
```

**If not installed:**

**Windows (XAMPP/WAMP):**
- Download DLL from: https://pecl.php.net/package/mongodb
- Place in `php/ext/` folder
- Enable in `php.ini`: `extension=mongodb`

**Linux:**
```bash
sudo apt-get install php-mongodb
sudo systemctl restart apache2  # or nginx
```

**Mac:**
```bash
brew install php-mongodb
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Add your MongoDB connection string (same as Node.js version).

### 4. Test Locally

**Using PHP built-in server:**
```bash
cd backend-php
php -S localhost:8000
```

**Test:**
```bash
curl http://localhost:8000/api/health
```

### 5. Deploy to Production

**Apache:**
- Upload `backend-php/` folder to your server
- Point Apache virtual host to `backend-php/` directory
- Ensure `.htaccess` is enabled

**Nginx:**
- Upload `backend-php/` folder
- Configure Nginx to route `/api` to PHP-FPM
- Point document root to `backend-php/`

## API Endpoints

All endpoints match Node.js version:
- `GET /api/health`
- `GET /api/products`
- `POST /api/orders`
- `POST /api/mpesa/stk-push`
- etc.

## Frontend Compatibility

✅ **No frontend changes needed!** The API is 100% compatible.

The frontend will automatically detect the PHP backend via `/api/server-info`.

