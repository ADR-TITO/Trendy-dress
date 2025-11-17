# 🚀 Start Local Development

## Quick Start

### Windows (Easiest)

1. **Double-click:** `backend-php/START_LOCAL.bat`
   - Or run: `cd backend-php; .\START_LOCAL.ps1`

2. **Server will start on:** `http://localhost:8000`

3. **Open your website:** `index.html` in browser

### Manual Start

```bash
cd backend-php
composer install
php -S localhost:8000 -t .
```

## What Happens

1. ✅ PHP backend starts on port 8000
2. ✅ Frontend automatically detects it
3. ✅ Website connects to `http://localhost:8000/api`
4. ✅ MongoDB operations work (if configured)

## Test

- Health: http://localhost:8000/api/health
- Test: http://localhost:8000/test-backend.php

## Stop Server

Press `Ctrl+C` in the terminal where server is running.

---

**See `LOCAL_DEVELOPMENT_SETUP.md` for detailed setup.**

