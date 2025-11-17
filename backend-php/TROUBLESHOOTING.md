# 🔧 Troubleshooting - Backend Not Starting

## Error: "unable to connect to remote server"

This means the backend is **not running**. Follow these steps:

## Step 1: Check Prerequisites

### Check PHP is Installed

```powershell
php --version
```

**If not installed:**
- Download from: https://www.php.net/downloads.php
- Or install XAMPP/WAMP (includes PHP)
- Add PHP to system PATH

### Check Composer is Installed

```powershell
composer --version
```

**If not installed:**
- Download from: https://getcomposer.org/
- Or run: `php -r "copy('https://getcomposer.org/installer', 'composer-setup.php'); php composer-setup.php"`

## Step 2: Install Dependencies

```powershell
cd backend-php
composer install
```

## Step 3: Configure .env File

```powershell
cd backend-php
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env file created - please edit it and add MongoDB connection string"
}
```

## Step 4: Start Backend

### Quick Start (Easiest)

```powershell
cd backend-php
.\START_NOW.bat
```

### Manual Start

```powershell
cd backend-php
php -S localhost:8000 -t .
```

## Step 5: Verify It's Running

In a **new terminal window**:

```powershell
curl http://localhost:8000/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

## Common Issues

### Issue 1: Port 8000 Already in Use

**Check what's using port 8000:**
```powershell
netstat -ano | findstr :8000
```

**Kill the process:**
```powershell
taskkill /PID <PID_NUMBER> /F
```

**Or use different port:**
```powershell
php -S localhost:8001 -t .
```

### Issue 2: PHP Not Found

**Add PHP to PATH:**
1. Find PHP installation folder (e.g., `C:\php`)
2. Add to System PATH:
   - Right-click "This PC" → Properties
   - Advanced System Settings → Environment Variables
   - Edit "Path" → Add PHP folder
   - Restart terminal

### Issue 3: Composer Not Found

**Install Composer:**
1. Download: https://getcomposer.org/Composer-Setup.exe
2. Run installer
3. Restart terminal

### Issue 4: MongoDB Connection Error

**Check .env file:**
```powershell
cd backend-php
Get-Content .env
```

**Verify MongoDB connection string:**
- Format: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database`
- Check MongoDB Atlas IP whitelist
- Verify credentials

### Issue 5: Permission Denied

**Check file permissions:**
```powershell
cd backend-php
Get-Acl . | Format-List
```

**Fix permissions (if needed):**
```powershell
icacls . /grant Users:F /T
```

## Quick Test

Run this complete test:

```powershell
# 1. Check PHP
php --version

# 2. Check Composer
composer --version

# 3. Go to backend folder
cd backend-php

# 4. Install dependencies
composer install

# 5. Check .env
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }

# 6. Start backend
php -S localhost:8000 -t .

# 7. In another terminal, test:
curl http://localhost:8000/api/health
```

## Still Not Working?

1. **Check error messages** in the terminal
2. **Check PHP error log:**
   ```powershell
   php -i | findstr error_log
   ```
3. **Test PHP manually:**
   ```powershell
   php -r "echo 'PHP is working';"
   ```
4. **Check firewall** - allow port 8000

---

**Need more help?** Check the main documentation files.

