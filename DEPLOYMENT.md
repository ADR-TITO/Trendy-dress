# Deployment Guide

## PHP Backend Deployment (Recommended)

### Production Server Setup

1. **Upload Files**
   ```bash
   # Upload frontend files to web root
   # Upload backend-php/ to server
   ```

2. **Install Dependencies**
   ```bash
   cd backend-php
   composer install --no-dev
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Add MongoDB connection string
   # Add M-Pesa credentials
   ```

4. **Configure Web Server**

   **Apache (.htaccess already configured):**
   - Ensure `mod_rewrite` is enabled
   - Ensure `.htaccess` files are allowed

   **Nginx:**
   ```nginx
   location /api {
       root /var/www/trendydresses.co.ke/backend-php;
       try_files $uri $uri/ /index.php?route=$uri&$args;
       
       fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
       fastcgi_index index.php;
       include fastcgi_params;
       fastcgi_param SCRIPT_FILENAME $document_root/index.php;
   }
   ```

5. **Test**
   ```bash
   curl https://trendydresses.co.ke/api/health
   # Should return: {"status":"ok","backend":"PHP"}
   ```

## Frontend Configuration

The frontend automatically:
- ✅ Detects PHP backend on production domain
- ✅ Falls back to Node.js if PHP not available
- ✅ Uses same API endpoints (100% compatible)

No frontend changes needed!

## Environment Variables

Required in `backend-php/.env`:
```
MONGODB_URI=mongodb+srv://...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
```

## Verification

After deployment, verify:
1. ✅ `GET /api/health` returns 200
2. ✅ `GET /api/products` returns products
3. ✅ `GET /api/db-status` shows MongoDB connected
4. ✅ Frontend loads products correctly
5. ✅ M-Pesa STK Push works

---

**PHP Backend is ready for production!** 🚀

