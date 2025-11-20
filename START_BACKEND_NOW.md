# 🚀 Start Backend Now

## Quick Start (Windows)

### Option 1: Double-Click (Easiest)

1. **Navigate to:** `backend-php/` folder
2. **Double-click:** `START_NOW.bat`
3. **Server starts on:** `http://localhost:8000`

### Option 2: Command Line

```powershell
cd backend-php
.\START_NOW.bat
```

### Option 3: Manual Start

```powershell
cd backend-php
php -S localhost:8000 -t .
```

## Verify It's Running

After starting, test in another terminal:

```powershell
curl http://localhost:8000/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

## Troubleshooting

### "PHP is not installed"

1. **Install PHP:**
   - Download from: https://www.php.net/downloads.php
   - Or use XAMPP/WAMP (includes PHP)

2. **Add to PATH:**
   - Add PHP installation folder to system PATH
   - Restart terminal

3. **Verify:**
   ```powershell
   php --version
   ```

### "Dependencies not installed"

```powershell
cd backend-php
composer install
```

If Composer is not installed:
- Download from: https://getcomposer.org/
- Or use: `php -r "copy('https://getcomposer.org/installer', 'composer-setup.php'); php composer-setup.php"`

### "Port 8000 already in use"

Change port in start command:
```powershell
php -S localhost:8001 -t .
```

Then update `api-service.js` to use port 8001.

### Backend Starts But Can't Connect

1. **Check firewall:**
   - Allow port 8000 in Windows Firewall

2. **Check if running:**
   ```powershell
   netstat -ano | findstr :8000
   ```

3. **Test locally:**
   ```powershell
   curl http://127.0.0.1:8000/api/health
   ```

## Keep Backend Running

To keep backend running after closing terminal:

1. **Use Task Scheduler** (Windows)
2. **Use NSSM** (Windows Service)
3. **Use PM2** (if Node.js installed)

See `PRODUCTION_ALWAYS_RUN.md` for production setup.

---

**Your backend is now running!** ✅

