# Production Backend Deployment Checklist ✅

**For:** `https://trendydresses.co.ke/`

## 📋 Pre-Deployment Checklist

- [ ] Server has Node.js installed (v14+)
- [ ] Server has SSH access
- [ ] Domain `trendydresses.co.ke` is configured
- [ ] Nginx or Apache is installed
- [ ] MongoDB Atlas account is set up
- [ ] M-Pesa Daraja API credentials are ready

## 🚀 Deployment Steps

### 1. Upload Backend Files

- [ ] Upload `backend/` folder to server
- [ ] Location: `/var/www/trendydresses.co.ke/backend/`

### 2. Install Dependencies

```bash
cd /var/www/trendydresses.co.ke/backend
npm install
```

- [ ] Dependencies installed successfully

### 3. Configure Environment Variables

- [ ] Create `.env` file
- [ ] Add MongoDB connection string
- [ ] Add M-Pesa credentials
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=3000`

### 4. Test Backend Locally

```bash
npm start
```

- [ ] Backend starts without errors
- [ ] Test: `curl http://localhost:3000/api/health`
- [ ] Should return: `{"status":"ok"}`
- [ ] Stop backend (Ctrl+C)

### 5. Install PM2

```bash
npm install -g pm2
```

- [ ] PM2 installed successfully

### 6. Start Backend with PM2

```bash
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

- [ ] Backend running in PM2
- [ ] PM2 startup configured
- [ ] Backend auto-starts on reboot

### 7. Configure Nginx Reverse Proxy

Edit Nginx config:
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

Add reverse proxy configuration:
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

- [ ] Nginx config updated
- [ ] Test config: `sudo nginx -t`
- [ ] Reload Nginx: `sudo systemctl reload nginx`

### 8. Verify Deployment

- [ ] Test: `curl http://localhost:3000/api/health`
- [ ] Test: `curl https://trendydresses.co.ke/api/health`
- [ ] Both should return: `{"status":"ok"}`
- [ ] Check PM2 status: `pm2 list`
- [ ] Check logs: `pm2 logs trendy-dresses-api`

### 9. Test STK Push

- [ ] Open website: `https://trendydresses.co.ke`
- [ ] Try STK Push payment
- [ ] Should work without errors

## ✅ Verification

### Backend Status

```bash
# Check if backend is running
pm2 list

# Check backend logs
pm2 logs trendy-dresses-api

# Test health endpoint
curl http://localhost:3000/api/health

# Test database status
curl http://localhost:3000/api/db-status
```

### Public Access

```bash
# Test public health endpoint
curl https://trendydresses.co.ke/api/health

# Should return: {"status":"ok","message":"Trendy Dresses API is running"}
```

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs trendy-dresses-api

# Restart backend
pm2 restart trendy-dresses-api

# Check if port 3000 is in use
netstat -tulpn | grep :3000
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:3000/api/health
```

### MongoDB Connection Failed

```bash
# Check MongoDB status
curl http://localhost:3000/api/db-status

# Verify .env file
cat .env | grep MONGODB_URI

# Check MongoDB Atlas IP whitelist
```

## 📚 Documentation

- **[QUICK_PRODUCTION_DEPLOYMENT.md](./QUICK_PRODUCTION_DEPLOYMENT.md)** - Quick 5-minute setup
- **[PRODUCTION_BACKEND_SETUP.md](./PRODUCTION_BACKEND_SETUP.md)** - Detailed setup guide
- **[backend/QUICK_START.md](./backend/QUICK_START.md)** - Local development guide

## 🆘 Support

If you encounter issues:

1. **Check PM2 logs:** `pm2 logs trendy-dresses-api`
2. **Check Nginx logs:** `sudo tail -f /var/log/nginx/error.log`
3. **Test backend directly:** `curl http://localhost:3000/api/health`
4. **Verify MongoDB:** `curl http://localhost:3000/api/db-status`

---

**Quick Commands:**

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
```

---

✅ **Checklist complete? Your backend should now be running on production!**

