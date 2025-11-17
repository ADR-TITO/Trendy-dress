# Local Development Setup - PHP Backend

## Quick Start

### Option 1: Use Start Scripts (Easiest)

**Windows:**
```powershell
cd backend-php
.\START_LOCAL.ps1
```

**Or double-click:**
- `START_LOCAL.bat` (Windows)

### Option 2: Manual Start

```bash
cd backend-php
composer install
php -S localhost:8000 -t .
```

## Prerequisites

1. **PHP 7.4+** installed
   - Windows: Download from [php.net](https://www.php.net/downloads.php) or use XAMPP/WAMP
   - Linux: `sudo apt-get install php`
   - Mac: `brew install php`

2. **Composer** installed
   - Download from [getcomposer.org](https://getcomposer.org/)

3. **MongoDB PHP Extension**
   - Windows: Download from [pecl.php.net](https://pecl.php.net/package/mongodb)
   - Linux: `sudo apt-get install php-mongodb`
   - Mac: `brew install php-mongodb`

## Setup Steps

### 1. Install Dependencies

```bash
cd backend-php
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # or edit with any text editor
```

Add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### 3. Start Server

```bash
php -S localhost:8000 -t .
```

### 4. Test

Open browser:
- Health: http://localhost:8000/api/health
- Test script: http://localhost:8000/test-backend.php

## Frontend Connection

The frontend will automatically detect the PHP backend on port 8000.

Open your `index.html` in a browser - it will connect to:
- `http://localhost:8000/api`

## Troubleshooting

### Port 8000 Already in Use

Change port in start command:
```bash
php -S localhost:8001 -t .
```

Update `api-service.js` to try port 8001 first.

### Composer Not Found

Install Composer:
- Windows: Download installer from [getcomposer.org](https://getcomposer.org/)
- Linux: `curl -sS https://getcomposer.org/installer | php`
- Mac: `brew install composer`

### MongoDB Extension Not Found

**Windows:**
1. Download DLL from [pecl.php.net](https://pecl.php.net/package/mongodb)
2. Place in `php/ext/` folder
3. Enable in `php.ini`: `extension=mongodb`

**Linux:**
```bash
sudo apt-get install php-mongodb
sudo systemctl restart apache2  # if using Apache
```

**Mac:**
```bash
brew install php-mongodb
```

### Connection Timeout

1. Check server is running: `http://localhost:8000/api/health`
2. Check firewall isn't blocking port 8000
3. Try different port: `php -S localhost:8001 -t .`

## Development Workflow

1. **Start backend:**
   ```bash
   cd backend-php
   php -S localhost:8000 -t .
   ```

2. **Open frontend:**
   - Open `index.html` in browser
   - Frontend will auto-connect to `http://localhost:8000/api`

3. **Make changes:**
   - Edit PHP files
   - Refresh browser to see changes

4. **Stop server:**
   - Press `Ctrl+C` in terminal

---

**Your local development environment is ready!** 🚀

