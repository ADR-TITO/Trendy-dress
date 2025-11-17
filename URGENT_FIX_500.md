# 🚨 URGENT: Fix 500 Error

## The Problem

Your backend is returning **500 Internal Server Error**.

## Root Cause

The `index.php` file was requiring Composer, but we made the backend work **without Composer**.

## Quick Fix

### Option 1: Upload Fixed File (Recommended)

I've fixed `backend-php/index.php` - it no longer requires Composer.

**Upload the updated `index.php` file to your server.**

### Option 2: Manual Fix

Edit `backend-php/index.php` on your server:

**Find this code (around line 7-17):**
```php
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Composer dependencies not installed',
        'message' => 'Run: composer install in backend-php/ directory'
    ]);
    exit;
}
```

**Replace with:**
```php
// Load composer autoloader (optional - not required)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
// Note: Backend works without Composer - uses built-in PHP features
```

## After Fix

1. **Test health endpoint:**
   ```
   https://trendydresses.co.ke/backend-php/api/health
   ```

2. **Should return:**
   ```json
   {"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
   ```

## Additional Checks

### 1. Check Debug Script

Visit: `https://trendydresses.co.ke/backend-php/debug.php`

This will show:
- ✅ PHP version
- ✅ Extensions
- ✅ Database connection
- ✅ Any errors

### 2. Check Database Connection

In debug.php output, verify:
- ✅ PDO MySQL extension installed
- ✅ Database connection successful
- ✅ `.env` file has correct credentials

### 3. Common Issues

**If still 500 after fix:**

1. **Database connection error:**
   - Check `.env` file credentials
   - Verify database exists in cPanel
   - Check user permissions

2. **Missing PHP extension:**
   - Enable `pdo_mysql` in cPanel
   - Select PHP 7.4+

3. **File permissions:**
   ```bash
   chmod 644 backend-php/index.php
   chmod 644 backend-php/*.php
   ```

---

**Fix the index.php file and the 500 error should be resolved!** ✅

