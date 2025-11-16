# 🔧 Fix 404 Error: Backend API Not Accessible

## Problem

Getting `404` error when accessing:
```
https://trendydresses.co.ke/api/health
```

This means the backend is **not accessible** on your production server.

---

## Quick Fix Checklist

- [ ] Backend folder uploaded to server
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file configured with MongoDB connection
- [ ] Backend running with PM2
- [ ] Nginx configured to proxy `/api` to backend
- [ ] Nginx reloaded after configuration

---

## Step-by-Step Fix

### Step 1: Verify Backend is Running on Server

**SSH into your production server:**
```bash
ssh user@your-server-ip
cd /var/www/trendydresses.co.ke/backend
```

**Check if backend is running:**
```bash
pm2 list
```

**If not running, start it:**
```bash
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
```

**Check backend logs:**
```bash
pm2 logs trendy-dresses-api --lines 50
```

**Expected output:**
```
✅ Server is running on http://localhost:3000
✅ API endpoints available at http://localhost:3000/api
✅ Connected to MongoDB successfully
```

---

### Step 2: Test Backend Locally on Server

**Test if backend responds on localhost:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

**If this fails:**
- Backend is not running → Start it with PM2
- Port 3000 is blocked → Check firewall
- Backend crashed → Check logs: `pm2 logs trendy-dresses-api`

---

### Step 3: Configure Nginx Reverse Proxy

**Edit Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this location block inside your `server` block:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # ... existing config for static files ...
    
    # Backend API Reverse Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Allow CORS (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
    
    # ... rest of your config ...
}
```

**If using HTTPS (SSL), also add to the HTTPS server block:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # SSL certificates
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # ... existing config ...
    
    # Backend API Reverse Proxy (same as above)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 4: Test Nginx Configuration

**Test Nginx config for syntax errors:**
```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If there are errors:**
- Fix the syntax errors shown
- Check for typos in the configuration
- Ensure all brackets are closed

---

### Step 5: Reload Nginx

**Reload Nginx to apply changes:**
```bash
sudo systemctl reload nginx
```

**Or restart Nginx:**
```bash
sudo systemctl restart nginx
```

**Check Nginx status:**
```bash
sudo systemctl status nginx
```

---

### Step 6: Verify API is Accessible

**Test from server:**
```bash
curl https://trendydresses.co.ke/api/health
```

**Expected response:**
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

**Test from browser:**
Open: `https://trendydresses.co.ke/api/health`

**Expected:** JSON response with `{"status":"ok"}`

---

## Troubleshooting

### Issue 1: Still Getting 404

**Check Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Check if backend is running:**
```bash
pm2 list
curl http://localhost:3000/api/health
```

**Verify Nginx config:**
```bash
sudo nginx -t
cat /etc/nginx/sites-available/trendydresses.co.ke | grep -A 10 "location /api"
```

### Issue 2: 502 Bad Gateway

**This means Nginx can't reach the backend.**

**Check:**
1. Backend is running: `pm2 list`
2. Backend responds on localhost: `curl http://localhost:3000/api/health`
3. Port 3000 is not blocked: `netstat -tuln | grep 3000`

**Fix:**
- Start backend: `pm2 start npm --name "trendy-dresses-api" -- start`
- Check backend logs: `pm2 logs trendy-dresses-api`

### Issue 3: 503 Service Unavailable

**Backend is running but not responding.**

**Check backend logs:**
```bash
pm2 logs trendy-dresses-api --lines 100
```

**Common causes:**
- MongoDB connection failed
- Backend crashed
- Port conflict

**Fix:**
- Restart backend: `pm2 restart trendy-dresses-api`
- Check MongoDB connection: `node verify-mongodb-connection.js`

### Issue 4: CORS Errors

**If you see CORS errors in browser console:**

**Add CORS headers to Nginx config:**
```nginx
location /api {
    proxy_pass http://localhost:3000;
    # ... other proxy settings ...
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        add_header 'Content-Length' 0;
        add_header 'Content-Type' 'text/plain';
        return 204;
    }
}
```

---

## Complete Nginx Configuration Example

**Full server block example:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/trendydresses.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trendydresses.co.ke/privkey.pem;
    
    # Root directory for static files
    root /var/www/trendydresses.co.ke;
    index index.html;
    
    # Backend API Reverse Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Verification Commands

**Run these commands to verify everything is working:**

```bash
# 1. Check backend is running
pm2 list

# 2. Test backend locally
curl http://localhost:3000/api/health

# 3. Test backend via Nginx
curl https://trendydresses.co.ke/api/health

# 4. Check MongoDB connection
cd /var/www/trendydresses.co.ke/backend
node verify-mongodb-connection.js

# 5. Check Nginx status
sudo systemctl status nginx

# 6. Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log
```

---

## After Fixing

Once the API is accessible:

1. ✅ `https://trendydresses.co.ke/api/health` returns `{"status":"ok"}`
2. ✅ `https://trendydresses.co.ke/api/db-status` shows MongoDB connected
3. ✅ Products load from MongoDB (not localStorage)
4. ✅ STK Push payment works
5. ✅ No 404 errors in browser console

---

## Need Help?

If still having issues:

1. **Check backend logs:** `pm2 logs trendy-dresses-api`
2. **Check Nginx logs:** `sudo tail -f /var/log/nginx/error.log`
3. **Test each component separately:**
   - Backend: `curl http://localhost:3000/api/health`
   - Nginx: `curl https://trendydresses.co.ke/api/health`
   - MongoDB: `node verify-mongodb-connection.js`

---

**Once fixed, your backend will be accessible at `https://trendydresses.co.ke/api`!** ✅

