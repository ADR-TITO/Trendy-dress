# 🚀 Quick Start - Local Development

## The Problem

You're seeing:
```
⚠️ Could not auto-detect PHP backend, using default port 8000
⚠️ Backend check timed out
```

**This means:** PHP backend is not running locally.

## Quick Fix

### Windows (Easiest)

1. **Open PowerShell or Command Prompt**
2. **Navigate to backend-php folder:**
   ```powershell
   cd backend-php
   ```

3. **Run start script:**
   ```powershell
   .\START_LOCAL.ps1
   ```
   Or double-click: `START_LOCAL.bat`

4. **Server will start on:** `http://localhost:8000`

5. **Open your website:** `index.html` in browser

### Manual Start

```bash
cd backend-php
composer install
php -S localhost:8000 -t .
```

## Verify It's Working

1. **Check server is running:**
   - Visit: http://localhost:8000/api/health
   - Should see: `{"status":"ok","backend":"PHP"}`

2. **Refresh your website:**
   - Open `index.html`
   - Check browser console
   - Should see: `✅ Detected PHP backend on port 8000`

## Stop Server

Press `Ctrl+C` in the terminal where server is running.

---

**That's it! Your local development is ready.** ✅

