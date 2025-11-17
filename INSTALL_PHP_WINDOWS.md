# 🔧 Install PHP on Windows

## The Problem

You're getting: `unable to connect to remote server` because PHP is not installed or not in your PATH.

## Quick Solution

### Option 1: Install XAMPP (Easiest - Recommended)

1. **Download XAMPP:**
   - Go to: https://www.apachefriends.org/download.html
   - Download XAMPP for Windows
   - Run installer

2. **Add PHP to PATH:**
   - XAMPP installs PHP in: `C:\xampp\php`
   - Add this to your System PATH:
     - Right-click "This PC" → Properties
     - Click "Advanced system settings"
     - Click "Environment Variables"
     - Under "System variables", find "Path" → Edit
     - Click "New" → Add: `C:\xampp\php`
     - Click OK on all dialogs

3. **Restart your terminal/PowerShell**

4. **Verify:**
   ```powershell
   php --version
   ```

### Option 2: Install PHP Standalone

1. **Download PHP:**
   - Go to: https://windows.php.net/download/
   - Download PHP 8.x Thread Safe ZIP
   - Extract to: `C:\php`

2. **Add to PATH:**
   - Same steps as Option 1
   - Add: `C:\php`

3. **Configure PHP:**
   - Copy `php.ini-development` to `php.ini`
   - Edit `php.ini` and uncomment:
     ```
     extension=curl
     extension=fileinfo
     extension=mbstring
     extension=openssl
     ```

4. **Restart terminal**

5. **Verify:**
   ```powershell
   php --version
   ```

### Option 3: Use Chocolatey (If you have it)

```powershell
choco install php
```

## After Installing PHP

### 1. Install Composer (Required for dependencies)

1. **Download Composer:**
   - Go to: https://getcomposer.org/Composer-Setup.exe
   - Run installer (it will detect PHP automatically)

2. **Verify:**
   ```powershell
   composer --version
   ```

### 2. Install Backend Dependencies

```powershell
cd backend-php
composer install
```

### 3. Create .env File

```powershell
cd backend-php
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env file created - please edit it and add MongoDB connection string"
}
```

### 4. Start Backend

```powershell
cd backend-php
php -S localhost:8000 -t .
```

Or double-click: `START_NOW.bat`

### 5. Test

In a new terminal:
```powershell
curl http://localhost:8000/api/health
```

## Quick Checklist

- [ ] PHP installed
- [ ] PHP added to PATH
- [ ] Terminal restarted
- [ ] `php --version` works
- [ ] Composer installed
- [ ] `composer --version` works
- [ ] Dependencies installed (`composer install`)
- [ ] .env file created
- [ ] Backend started (`php -S localhost:8000 -t .`)
- [ ] Health check works (`curl http://localhost:8000/api/health`)

## Troubleshooting

### "php is not recognized"

1. **Check PHP is installed:**
   - Look for PHP folder (usually `C:\xampp\php` or `C:\php`)

2. **Check PATH:**
   ```powershell
   $env:PATH -split ';' | Select-String php
   ```

3. **Add to PATH manually:**
   - Follow steps in Option 1 or 2 above

4. **Restart terminal:**
   - Close and reopen PowerShell/Command Prompt

### "Composer not found"

1. **Install Composer:**
   - Download: https://getcomposer.org/Composer-Setup.exe
   - Run installer

2. **Or install manually:**
   ```powershell
   php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
   php composer-setup.php
   php -r "unlink('composer-setup.php');"
   ```

### Port 8000 Already in Use

```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID_NUMBER> /F

# Or use different port
php -S localhost:8001 -t .
```

---

**Once PHP is installed, you can start the backend!** ✅

