# Backend Deployment Instructions

## 📦 What's in This Folder

This is the **Trendy Dresses Backend API** that needs to be deployed to your production server.

## 🚀 Quick Deployment (5 Steps)

### Step 1: Upload This Folder

Upload this entire `backend/` folder to your server at:
```
/var/www/trendydresses.co.ke/backend/
```

### Step 2: Install Dependencies

```bash
cd /var/www/trendydresses.co.ke/backend
npm install
```

### Step 3: Configure Environment

```bash
nano .env
```

Copy from `ENV_TEMPLATE.txt` and add your actual values:
- MongoDB connection string
- M-Pesa credentials (if using)

### Step 4: Start with PM2

```bash
npm install -g pm2
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

Add reverse proxy to Nginx config (see PRODUCTION_BACKEND_SETUP.md)

## ✅ Verify

```bash
curl http://localhost:3000/api/health
curl https://trendydresses.co.ke/api/health
```

Both should return: `{"status":"ok"}`

## 📚 Full Documentation

- **DEPLOY_NOW.md** - Step-by-step deployment guide
- **QUICK_PRODUCTION_DEPLOYMENT.md** - Quick 5-minute guide
- **PRODUCTION_BACKEND_SETUP.md** - Complete detailed guide

## 🔧 Troubleshooting

```bash
# Check if backend is running
pm2 list

# View logs
pm2 logs trendy-dresses-api

# Restart backend
pm2 restart trendy-dresses-api
```

---

**This folder is ready to upload!**

