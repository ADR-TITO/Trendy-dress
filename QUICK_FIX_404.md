# ⚡ Quick Fix: 404 Error on Production API

## The Problem

```
https://trendydresses.co.ke/api/health → 404 Error
```

## The Solution (3 Steps)

### Step 1: Start Backend on Server

```bash
ssh user@your-server-ip
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
```

### Step 2: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this inside your `server` block:**

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

### Step 3: Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Test

```bash
curl https://trendydresses.co.ke/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

---

## Still Not Working?

See **FIX_PRODUCTION_API_404.md** for detailed troubleshooting.

