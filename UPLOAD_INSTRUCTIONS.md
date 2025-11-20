# 📤 Upload Backend Folder to Production Server

## 🚀 Easiest Methods

### Method 1: Using PowerShell Script (Windows)

1. **Open PowerShell in this folder**
2. **Run the upload script:**
   ```powershell
   .\upload-backend.ps1
   ```
3. **Follow the prompts:**
   - Enter your server IP
   - Enter your SSH username
   - Enter server path (default: `/var/www/trendydresses.co.ke`)
4. **Script will upload automatically**

### Method 2: Using SCP Command (If you have Git Bash or OpenSSH)

**Open Git Bash or PowerShell and run:**

```bash
cd "C:\Users\user\TRENDY DRESSES"
scp -r backend user@your-server-ip:/var/www/trendydresses.co.ke/
```

**Replace:**
- `user` = Your SSH username
- `your-server-ip` = Your server IP address or domain

### Method 3: Using FileZilla (Easiest for Beginners)

1. **Download FileZilla:** https://filezilla-project.org/download.php?type=client
2. **Install and open FileZilla**
3. **Connect to your server:**
   - **Host:** `sftp://your-server-ip` or `sftp://trendydresses.co.ke`
   - **Username:** Your SSH username
   - **Password:** Your SSH password
   - **Port:** 22
   - Click **Quickconnect**
4. **Navigate on server:** Go to `/var/www/trendydresses.co.ke/`
5. **Navigate locally:** Go to `C:\Users\user\TRENDY DRESSES\`
6. **Drag and drop** the `backend` folder from left (local) to right (server)

### Method 4: Using cPanel File Manager

1. **Log into cPanel**
2. **Open File Manager**
3. **Navigate to your website root** (usually `public_html` or `www`)
4. **Click Upload**
5. **Select the `backend` folder** (or ZIP it first, then upload and extract)
6. **Upload complete!**

### Method 5: Using Git (If you push to GitHub)

**On your production server:**
```bash
cd /var/www/trendydresses.co.ke
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
# OR if already exists:
git pull origin main
```

## 📋 What Gets Uploaded

**✅ Upload these:**
- All `.js` files
- `package.json` and `package-lock.json`
- All folders: `database/`, `models/`, `routes/`, `services/`, `scripts/`
- Documentation files (`.md`)
- `ENV_TEMPLATE.txt`
- `.gitignore`

**❌ DO NOT upload:**
- `node_modules/` (will be installed on server with `npm install`)
- `.env` file (create new one on server)
- `*.log` files
- `*.db` files

## ✅ After Upload

Once uploaded, SSH into your server and run:

```bash
cd /var/www/trendydresses.co.ke/backend
npm install
nano .env
# (Add your MongoDB connection string - copy from ENV_TEMPLATE.txt)
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

## 🔍 Verify Upload

```bash
# SSH into server
ssh user@your-server-ip

# Check if backend folder exists
ls -la /var/www/trendydresses.co.ke/backend/

# Should see: server.js, package.json, routes/, models/, etc.
```

## 🆘 Troubleshooting

### "Permission Denied" Error
```bash
# On server, fix permissions
sudo chown -R $USER:$USER /var/www/trendydresses.co.ke/backend
chmod -R 755 /var/www/trendydresses.co.ke/backend
```

### "Connection Refused" Error
- Check if SSH is enabled on server
- Verify server IP address
- Check firewall settings

### FileZilla Connection Issues
- Make sure you're using **SFTP** (not FTP)
- Port should be **22**
- Check if SSH is enabled on your server

## 📚 Next Steps

After upload, see:
- **DEPLOY_NOW.md** - Complete deployment steps
- **QUICK_PRODUCTION_DEPLOYMENT.md** - Quick 5-minute guide

---

**Recommended:** Use **FileZilla** (Method 3) if you're not comfortable with command line.

