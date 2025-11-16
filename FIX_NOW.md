# 🔧 Fix 404 Error - Quick Steps

## The Problem
```
https://trendydresses.co.ke/api/health → 404 Error
```

## The Fix (Run on Your Production Server)

### Option 1: Automated Script (Linux/Mac)

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to backend folder
cd /var/www/trendydresses.co.ke/backend

# Make script executable
chmod +x fix-production-api.sh

# Run the fix script
./fix-production-api.sh
```

### Option 2: Manual Steps

#### Step 1: Start Backend

```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 list
```

#### Step 2: Test Backend Locally

```bash
curl http://localhost:3000/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

#### Step 3: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this inside your `server` block (before the closing `}`):**

```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

#### Step 4: Test & Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: Test API

```bash
curl https://trendydresses.co.ke/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

---

## Complete Nginx Server Block Example

```nginx
server {
    listen 443 ssl http2;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/trendydresses.co.ke;
    index index.html;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Verification

After fixing, test these:

```bash
# 1. Backend running
pm2 list

# 2. Backend responds locally
curl http://localhost:3000/api/health

# 3. Backend accessible via Nginx
curl https://trendydresses.co.ke/api/health

# 4. MongoDB status
curl https://trendydresses.co.ke/api/db-status
```

---

## Still Not Working?

1. **Check backend logs:**
   ```bash
   pm2 logs trendy-dresses-api
   ```

2. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **See detailed guide:** `FIX_PRODUCTION_API_404.md`

---

**Once fixed, your API will be accessible and MongoDB will work!** ✅

