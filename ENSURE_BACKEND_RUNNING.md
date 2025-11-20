# ✅ Ensure Backend Server is Running - Production Checklist

## 🎯 Quick Check

**Test if backend is running:**
```bash
curl https://trendydresses.co.ke/api/health
```

**Expected response:**
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

If you get an error, the backend is **NOT running**. Follow the steps below.

---

## 🚀 Step 1: Upload Backend to Server

If you haven't uploaded the backend folder yet:

1. **Upload `backend/` folder** to your server at:
   ```
   /var/www/trendydresses.co.ke/backend/
   ```

2. **See:** `UPLOAD_INSTRUCTIONS.md` for upload methods

---

## 🔧 Step 2: Install Dependencies

**SSH into your server:**
```bash
ssh user@your-server-ip
cd /var/www/trendydresses.co.ke/backend
npm install
```

---

## ⚙️ Step 3: Configure Environment

**Create `.env` file:**
```bash
cd /var/www/trendydresses.co.ke/backend
nano .env
```

**Add these variables:**
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority

# Server Port
PORT=3000

# Environment
NODE_ENV=production

# M-Pesa Credentials (if using STK Push)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=production
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## 🏃 Step 4: Start Backend with PM2

**Install PM2 (if not installed):**
```bash
npm install -g pm2
```

**Start backend:**
```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

**Check if running:**
```bash
pm2 list
pm2 logs trendy-dresses-api
```

**Expected output:**
```
✅ Server is running on http://localhost:3000
✅ API endpoints available at http://localhost:3000/api
✅ Database initialization complete
```

---

## 🌐 Step 5: Configure Nginx Reverse Proxy

**Edit Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Add this location block inside your server block:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # ... existing config ...
    
    # Backend API Proxy
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
        
        # Increase timeouts for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ... rest of config ...
}
```

**Test Nginx config:**
```bash
sudo nginx -t
```

**Reload Nginx:**
```bash
sudo systemctl reload nginx
```

---

## ✅ Step 6: Verify Backend is Running

### Test 1: Local Test (on server)
```bash
curl http://localhost:3000/api/health
```

**Expected:** `{"status":"ok","message":"Trendy Dresses API is running"}`

### Test 2: Public Test (from browser)
Open in browser:
```
https://trendydresses.co.ke/api/health
```

**Expected:** JSON response with `{"status":"ok"}`

### Test 3: MongoDB Status
```bash
curl https://trendydresses.co.ke/api/db-status
```

**Expected:** `{"readyState":1,"readyStateText":"connected"}`

### Test 4: Products Endpoint
```bash
curl https://trendydresses.co.ke/api/products
```

**Expected:** Array of products (may be empty `[]` if no products)

---

## 🔍 Troubleshooting

### Backend Not Starting

**Check PM2 logs:**
```bash
pm2 logs trendy-dresses-api --lines 50
```

**Common issues:**
1. **Port 3000 already in use:**
   ```bash
   # Find process using port 3000
   sudo lsof -i :3000
   # Kill it
   sudo kill -9 <PID>
   ```

2. **MongoDB connection failed:**
   - Check `.env` file has correct `MONGODB_URI`
   - Verify MongoDB Atlas IP whitelist includes your server IP
   - Check MongoDB Atlas cluster is running

3. **Missing dependencies:**
   ```bash
   cd /var/www/trendydresses.co.ke/backend
   npm install
   ```

### Backend Running But Not Accessible

**Check Nginx:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

**Check firewall:**
```bash
# Allow port 3000 (if needed)
sudo ufw allow 3000/tcp

# But usually not needed - Nginx handles it
```

### CORS Errors

**Check backend CORS config** in `backend/server.js`:
- Should allow `https://trendydresses.co.ke`
- Should allow `https://www.trendydresses.co.ke`

**Restart backend after changes:**
```bash
pm2 restart trendy-dresses-api
```

---

## 🔄 Restart Backend

**If you make changes:**
```bash
pm2 restart trendy-dresses-api
pm2 logs trendy-dresses-api
```

**Stop backend:**
```bash
pm2 stop trendy-dresses-api
```

**Start backend:**
```bash
pm2 start trendy-dresses-api
```

---

## 📊 Monitor Backend

**View real-time logs:**
```bash
pm2 logs trendy-dresses-api --lines 100
```

**View PM2 dashboard:**
```bash
pm2 monit
```

**Check backend status:**
```bash
pm2 status
```

---

## ✅ Final Checklist

- [ ] Backend folder uploaded to server
- [ ] `npm install` completed successfully
- [ ] `.env` file created with MongoDB connection
- [ ] Backend started with PM2
- [ ] PM2 shows backend as "online"
- [ ] `curl http://localhost:3000/api/health` returns `{"status":"ok"}`
- [ ] Nginx configured with `/api` proxy
- [ ] Nginx reloaded successfully
- [ ] `curl https://trendydresses.co.ke/api/health` returns `{"status":"ok"}`
- [ ] MongoDB connected (check `/api/db-status`)
- [ ] STK Push payment works (test on website)

---

## 🆘 Still Not Working?

1. **Check backend logs:**
   ```bash
   pm2 logs trendy-dresses-api --lines 100
   ```

2. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Test backend directly:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Verify PM2 is running:**
   ```bash
   pm2 list
   ```

5. **Check server resources:**
   ```bash
   free -h
   df -h
   ```

---

**Once backend is running, STK Push payment will work!** ✅

