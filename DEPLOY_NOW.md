# 🚀 Deploy Backend to Production - Copy & Paste Commands

**Follow these steps on your production server to get the backend running.**

## Step 1: Connect to Your Server

SSH into your production server:
```bash
ssh user@your-server-ip
```

## Step 2: Navigate to Backend Folder

```bash
cd /var/www/trendydresses.co.ke/backend
# OR wherever you uploaded the backend folder
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Create .env File

```bash
nano .env
```

**Copy and paste this template, then fill in your actual values:**

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string_here
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://trendydresses.co.ke/api/mpesa
```

**Press Ctrl+X, then Y, then Enter to save**

## Step 5: Install PM2

```bash
npm install -g pm2
```

## Step 6: Start Backend

```bash
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

**Follow the instructions from `pm2 startup` command** (it will show you a command to run with sudo)

## Step 7: Test Backend

```bash
curl http://localhost:3000/api/health
```

**Should return:** `{"status":"ok","message":"Trendy Dresses API is running"}`

## Step 8: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

**Find the `server` block and add this inside it:**

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

**Save and exit (Ctrl+X, Y, Enter)**

## Step 9: Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: Verify Everything Works

```bash
# Test local
curl http://localhost:3000/api/health

# Test public
curl https://trendydresses.co.ke/api/health
```

**Both should return:** `{"status":"ok","message":"Trendy Dresses API is running"}`

## ✅ Done!

Your backend is now running. Test STK Push payment on your website - it should work now!

---

## 🔧 Useful Commands

```bash
# Check if backend is running
pm2 list

# View backend logs
pm2 logs trendy-dresses-api

# Restart backend
pm2 restart trendy-dresses-api

# Stop backend
pm2 stop trendy-dresses-api
```

