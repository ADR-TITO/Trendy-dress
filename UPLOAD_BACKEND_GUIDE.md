# Upload Backend to Production Server - Complete Guide

## 🚀 Quick Upload Methods

### Method 1: Using SCP (Secure Copy) - Recommended

**From your local computer (Windows PowerShell or Git Bash):**

```bash
# Navigate to project root
cd "C:\Users\user\TRENDY DRESSES"

# Upload backend folder to server
scp -r backend user@your-server-ip:/var/www/trendydresses.co.ke/
```

**Replace:**
- `user` with your SSH username
- `your-server-ip` with your server IP address
- `/var/www/trendydresses.co.ke/` with your actual server path

### Method 2: Using SFTP (FileZilla or WinSCP)

1. **Download FileZilla** (free): https://filezilla-project.org/
2. **Connect to your server:**
   - Host: `your-server-ip` or `trendydresses.co.ke`
   - Username: Your SSH username
   - Password: Your SSH password
   - Port: 22
3. **Navigate to:** `/var/www/trendydresses.co.ke/`
4. **Upload the `backend/` folder** from your local computer

### Method 3: Using Git (If you have Git on server)

**On your production server:**
```bash
cd /var/www/trendydresses.co.ke
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
# OR if repo already exists:
git pull origin main
cd backend
```

### Method 4: Using cPanel File Manager

1. Log into cPanel
2. Go to File Manager
3. Navigate to your website root (usually `public_html` or `www`)
4. Upload the `backend` folder
5. Extract if uploaded as ZIP

## 📦 What to Upload

**Upload the entire `backend/` folder, including:**
- ✅ All `.js` files (server.js, routes, models, services)
- ✅ `package.json` and `package-lock.json`
- ✅ `database/` folder
- ✅ `models/` folder
- ✅ `routes/` folder
- ✅ `services/` folder
- ✅ `scripts/` folder
- ✅ `ENV_TEMPLATE.txt`
- ✅ `.gitignore`
- ✅ All documentation files (`.md`)

**DO NOT upload:**
- ❌ `node_modules/` (will be installed on server)
- ❌ `.env` file (create new one on server)
- ❌ `*.log` files
- ❌ `*.db` files

## 🔧 After Upload - Quick Setup

Once uploaded, SSH into your server and run:

```bash
cd /var/www/trendydresses.co.ke/backend
npm install
nano .env
# (Add your MongoDB connection string)
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
```

## 📋 Upload Checklist

- [ ] Backend folder uploaded to server
- [ ] Navigate to backend folder on server
- [ ] Run `npm install`
- [ ] Create `.env` file with MongoDB connection
- [ ] Test: `npm start` (should work)
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start with PM2: `pm2 start npm --name "trendy-dresses-api" -- start`
- [ ] Configure Nginx reverse proxy
- [ ] Test: `curl https://trendydresses.co.ke/api/health`

## 🆘 Need Help?

If you don't have SSH access or need help with upload:
1. Contact your hosting provider
2. Use cPanel File Manager
3. Use FTP client (FileZilla, WinSCP)

---

**See DEPLOY_NOW.md for complete deployment steps after upload.**

