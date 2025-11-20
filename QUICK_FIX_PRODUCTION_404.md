# 🚨 Quick Fix: Production API 404 Error

## Problem
```
https://trendydresses.co.ke/api/health → 404 Error
```

## ⚡ Quick Fix (3 Steps)

### Step 1: Access Your Production Server

**Option A: SSH from Windows PowerShell**
```powershell
# In Windows PowerShell
ssh username@your-server-ip
cd /var/www/trendydresses.co.ke/backend
```

**Option B: Use PuTTY (if SSH not available)**
1. Download PuTTY: https://www.putty.org/
2. Connect to your server IP
3. Enter username and password

**Option C: Use Hosting Control Panel**
- Log into cPanel/Plesk/your hosting panel
- Find "Terminal" or "SSH Access"
- Open terminal

**Option D: Contact Hosting Support**
- Ask them to run the commands for you
- Provide them with this guide

**Note:** These commands run on your **Linux production server**, not your Windows machine!

### Step 2: Start Backend with PM2
```bash
# Check if backend is running
pm2 list

# If not running, start it:
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save

# Check logs
pm2 logs trendy-dresses-api
```

**Expected output:**
```
✅ Server is running on http://localhost:3001
✅ Connected to MongoDB successfully
```

### Step 3: Configure Nginx to Proxy /api

**Edit Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this INSIDE your `server` block (for both HTTP and HTTPS):**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Verify It Works
```bash
curl https://trendydresses.co.ke/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

---

## 🔍 Troubleshooting

### Backend Not Starting?
```bash
# Check what port backend is using
pm2 logs trendy-dresses-api | grep "Server is running"

# If it's on a different port (e.g., 3002), update Nginx:
# Change proxy_pass http://localhost:3001; to the actual port
```

### Still Getting 404?
1. **Check backend is running:**
   ```bash
   pm2 list
   curl http://localhost:3001/api/health
   ```

2. **Check Nginx config:**
   ```bash
   sudo nginx -t
   sudo cat /etc/nginx/sites-available/trendydresses.co.ke | grep -A 5 "location /api"
   ```

3. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Backend on Different Port?
If your backend is running on port 3002, 3003, etc. (because 3001 was busy), update Nginx:
```nginx
proxy_pass http://localhost:3002;  # Use actual port
```

---

## ✅ Success Checklist

- [ ] Backend running with PM2: `pm2 list` shows "online"
- [ ] Backend responds locally: `curl http://localhost:3001/api/health` works
- [ ] Nginx configured: `/api` location block added
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Public API works: `curl https://trendydresses.co.ke/api/health` returns JSON

---

**Once fixed, refresh your website and MongoDB will work!** ✅

