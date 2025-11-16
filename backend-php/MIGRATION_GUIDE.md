# Migration Guide: Node.js to PHP Backend

## Overview

The PHP backend maintains **100% API compatibility** with the Node.js version. The frontend should work without any changes.

## Key Differences

### Port Configuration
- **Node.js**: Runs on port 3001 (or next available)
- **PHP**: Runs on port 80/443 (via Apache/Nginx web server)

### Frontend Detection
The frontend will automatically detect the backend type by checking the `/api/server-info` endpoint which returns:
```json
{
  "backend": "PHP"  // or "Node.js"
}
```

## Migration Steps

### 1. Install PHP Backend

```bash
cd backend-php
composer install
```

### 2. Install MongoDB PHP Extension

**Windows:**
```powershell
# Download from https://pecl.php.net/package/mongodb
# Or use XAMPP/WAMP which includes it
```

**Linux:**
```bash
sudo apt-get install php-mongodb
# Enable extension in php.ini
```

**Mac:**
```bash
brew install php-mongodb
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection string (same as Node.js version).

### 4. Deploy to Web Server

**Option A: Apache**
- Upload `backend-php/` to `/var/www/trendydresses.co.ke/api/`
- Ensure `.htaccess` is enabled
- Test: `curl https://trendydresses.co.ke/api/health`

**Option B: Nginx**
- Upload `backend-php/` to server
- Configure Nginx to route `/api` to PHP-FPM
- Test: `curl https://trendydresses.co.ke/api/health`

### 5. Update Frontend (Optional)

The frontend should work automatically, but you can update `api-service.js` to prefer PHP:

```javascript
// In detectBackendPort(), PHP backend is on same domain
// Production: window.location.origin + '/api'
// Development: Try http://localhost/api (port 80) first
```

## API Compatibility

All endpoints work the same:
- ✅ `/api/health` - Health check
- ✅ `/api/products` - Products CRUD
- ✅ `/api/orders` - Orders management
- ✅ `/api/mpesa/stk-push` - M-Pesa STK Push
- ✅ `/api/admin/login` - Admin authentication

## Testing

```bash
# Test health endpoint
curl http://localhost/api/health

# Test products
curl http://localhost/api/products

# Test database status
curl http://localhost/api/db-status
```

## Advantages of PHP

1. **No separate server process** - Runs via web server
2. **Better hosting compatibility** - Most shared hosting supports PHP
3. **No PM2 needed** - Web server manages processes
4. **Easier deployment** - Just upload files

## Notes

- MongoDB connection string format is identical
- All environment variables are the same
- Frontend requires no changes
- API responses are identical

