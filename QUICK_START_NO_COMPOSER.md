# ⚡ Quick Start - No Composer Needed!

## Good News!

✅ **Composer is NOT required** for the backend to work!

The backend now:
- ✅ Works without Composer
- ✅ Uses built-in PHP PDO (no external packages needed)
- ✅ Has simple .env file parser (no dotenv package needed)

## Quick Setup

### 1. Ensure PHP is Installed

```powershell
php --version
```

If not installed, see `INSTALL_PHP_WINDOWS.md`

### 2. Configure Database

The `.env` file is already created with your credentials:
```
DB_HOST=localhost
DB_NAME=trendydr_Shpo
DB_USER=trendydr_Adrian
DB_PASS=i"d)Z8NGP}8"?aa
```

### 3. Start Backend

```powershell
cd backend-php
php -S localhost:8000 -t .
```

### 4. Test

```powershell
curl http://localhost:8000/api/health
```

## What Works Without Composer

✅ **Database connection** - Uses PDO (built into PHP)
✅ **All API endpoints** - Products, Orders, M-Pesa
✅ **Environment variables** - Simple parser included
✅ **All models** - Product, Order, MpesaTransaction

## What's Optional

- **Composer** - Only needed if you want to use dotenv package
- **vendor folder** - Not required for basic functionality

## For Production

On your cPanel server:
1. Upload `backend-php/` folder
2. Ensure `.env` file has correct credentials
3. Backend will work immediately!

---

**You can start using the backend right now!** ✅

No Composer installation needed.

