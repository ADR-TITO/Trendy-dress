# ⚡ Quick Fix - Backend Not Starting

## The Error

```
curl http://localhost:8000/api/health
unable to connect to remote server
```

**This means:** PHP backend is not running.

## Immediate Solution

### Step 1: Check if PHP is Installed

```powershell
php --version
```

**If you see an error:** PHP is not installed. See `INSTALL_PHP_WINDOWS.md`

### Step 2: Start Backend

**Option A: Use Start Script (Easiest)**
```powershell
cd backend-php
.\START_NOW.bat
```

**Option B: Manual Start**
```powershell
cd backend-php
php -S localhost:8000 -t .
```

### Step 3: Test

In a **new terminal window**:
```powershell
curl http://localhost:8000/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

## Common Issues

### Issue 1: PHP Not Found

**Solution:** Install PHP
- Download XAMPP: https://www.apachefriends.org/
- Or standalone PHP: https://windows.php.net/download/
- Add to PATH
- Restart terminal

### Issue 2: Dependencies Not Installed

```powershell
cd backend-php
composer install
```

### Issue 3: .env File Missing

```powershell
cd backend-php
Copy-Item ".env.example" ".env"
# Then edit .env and add MongoDB connection string
```

### Issue 4: Port Already in Use

```powershell
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
php -S localhost:8001 -t .
```

## Complete Setup (If Starting Fresh)

```powershell
# 1. Install PHP (see INSTALL_PHP_WINDOWS.md)

# 2. Install Composer
# Download from: https://getcomposer.org/

# 3. Install dependencies
cd backend-php
composer install

# 4. Create .env
Copy-Item ".env.example" ".env"
# Edit .env and add MongoDB connection string

# 5. Start backend
php -S localhost:8000 -t .

# 6. Test (in new terminal)
curl http://localhost:8000/api/health
```

---

**Need more help?** See `TROUBLESHOOTING.md`

