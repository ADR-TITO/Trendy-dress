# Quick Production Backend Deployment Guide

**For:** `https://trendydresses.co.ke/`

## 🚀 Quick Start (5 Minutes)

### Step 1: Upload Backend to Server

Upload the `backend/` folder to your production server:
```bash
/var/www/trendydresses.co.ke/backend/
```

### Step 2: SSH into Server

```bash
ssh user@your-server-ip
cd /var/www/trendydresses.co.ke/backend
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment

```bash
nano .env
```

Add your configuration:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3000
NODE_ENV=production
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://trendydresses.co.ke/api/mpesa
```

### Step 5: Start Backend with PM2

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start backend
pm2 start npm --name "trendy-dresses-api" -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Step 6: Configure Nginx Reverse Proxy

Edit your Nginx config:
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

Add this inside the `server` block:
```nginx
location /api {
    proxy_pass http://localhost:3000/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Verify Backend is Running

```bash
# Check PM2 status
pm2 list

# Test backend
curl http://localhost:3000/api/health

# Test public URL
curl https://trendydresses.co.ke/api/health
```

## ✅ Verification

1. **Check Backend Status:**
   ```bash
   pm2 logs trendy-dresses-api
   ```

2. **Test in Browser:**
   - Visit: `https://trendydresses.co.ke/api/health`
   - Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`

3. **Test STK Push:**
   - Try STK Push payment on your website
   - Should work if backend is running

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check if port 3000 is in use
netstat -tulpn | grep :3000

# Check PM2 logs
pm2 logs trendy-dresses-api

# Restart backend
pm2 restart trendy-dresses-api
```

### Nginx 502 Error

```bash
# Check if backend is running
pm2 list

# Check backend logs
pm2 logs trendy-dresses-api

# Test backend directly
curl http://localhost:3000/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Connection Issues

```bash
# Check MongoDB connection
curl http://localhost:3000/api/db-status

# Check .env file
cat .env | grep MONGODB_URI

# Verify MongoDB Atlas IP whitelist includes your server IP
```

## 📚 Full Documentation

See **[PRODUCTION_BACKEND_SETUP.md](./PRODUCTION_BACKEND_SETUP.md)** for complete detailed instructions.

## 🆘 Support

If you need help:
1. Check PM2 logs: `pm2 logs trendy-dresses-api`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify backend URL: The frontend expects `https://trendydresses.co.ke/api`
4. Test backend directly: `curl http://localhost:3000/api/health`

## ⚡ Quick Commands Reference

```bash
# Start backend
pm2 start npm --name "trendy-dresses-api" -- start

# Stop backend
pm2 stop trendy-dresses-api

# Restart backend
pm2 restart trendy-dresses-api

# View logs
pm2 logs trendy-dresses-api

# Check status
pm2 list

# Test backend
curl http://localhost:3000/api/health
curl https://trendydresses.co.ke/api/health
```

---

**Important**: Make sure PM2 starts automatically on server reboot:
```bash
pm2 save
pm2 startup
```

Follow the instructions provided by PM2 to enable auto-start.

