# 🔧 Fix 404 Error - Summary

## Problem
```
https://trendydresses.co.ke/api/health → 404 Error
```

## Root Cause
The backend server is not accessible via Nginx reverse proxy on the production domain.

---

## Solution: 3 Steps on Your Production Server

### Step 1: Ensure Backend is Running

**SSH into your server:**
```bash
ssh user@your-server-ip
cd /var/www/trendydresses.co.ke/backend
```

**Start backend with PM2:**
```bash
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 list
```

**Verify backend responds:**
```bash
curl http://localhost:3000/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

---

### Step 2: Configure Nginx Reverse Proxy

**Edit Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this location block inside your `server` block:**

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

---

### Step 3: Test and Reload Nginx

**Test configuration:**
```bash
sudo nginx -t
```

**Reload Nginx:**
```bash
sudo systemctl reload nginx
```

**Test API:**
```bash
curl https://trendydresses.co.ke/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

---

## Quick Fix Script

**Or use the automated script:**

```bash
cd /var/www/trendydresses.co.ke/backend
chmod +x fix-production-api.sh
./fix-production-api.sh
```

---

## Verification Checklist

After fixing, verify:

- [ ] `pm2 list` shows backend as "online"
- [ ] `curl http://localhost:3000/api/health` returns `{"status":"ok"}`
- [ ] `curl https://trendydresses.co.ke/api/health` returns `{"status":"ok"}`
- [ ] Browser console shows no 404 errors
- [ ] Products load from MongoDB (not localStorage)

---

## Files Created

1. **FIX_NOW.md** - Quick reference guide
2. **FIX_PRODUCTION_API_404.md** - Detailed troubleshooting
3. **QUICK_FIX_404.md** - Ultra-quick 3-step fix
4. **backend/fix-production-api.sh** - Automated fix script
5. **backend/fix-production-api.ps1** - PowerShell version
6. **backend/nginx-api-config.conf** - Nginx config template

---

## Next Steps

1. **Upload backend folder** to your server (if not already done)
2. **Run the fix** using one of the methods above
3. **Verify** the API is accessible
4. **Test** your website - MongoDB should work!

---

**Once fixed, your backend will be accessible at `https://trendydresses.co.ke/api`** ✅

