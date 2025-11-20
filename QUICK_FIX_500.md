# ⚡ Quick Fix - 500 Error

## The Error

```
https://trendydresses.co.ke/backend-php/api/health
[HTTP/3 500]
```

## Immediate Steps

### 1. Check Debug Script

Visit: `https://trendydresses.co.ke/backend-php/debug.php`

This shows what's wrong.

### 2. Most Common Issue: Database Connection

**Check in cPanel:**

1. **MySQL Databases:**
   - Database `trendydr_Shpo` exists?
   - User `trendydr_Adrian` has access?

2. **Select PHP Version:**
   - PHP 7.4+ selected?
   - `pdo_mysql` extension enabled?

3. **File Manager:**
   - `.env` file exists in `backend-php/`?
   - Contains correct credentials?

### 3. Quick Fixes

**Fix Database:**
```
1. Go to cPanel → MySQL Databases
2. Verify database exists
3. Verify user has access
4. Test connection in phpMyAdmin
```

**Fix PHP:**
```
1. Go to cPanel → Select PHP Version
2. Choose PHP 7.4 or higher
3. Enable: pdo_mysql extension
4. Save
```

**Fix .env:**
```
1. Go to File Manager
2. Open backend-php/.env
3. Verify:
   DB_HOST=localhost
   DB_NAME=trendydr_Shpo
   DB_USER=trendydr_Adrian
   DB_PASS=i"d)Z8NGP}8"?aa
```

### 4. Test Again

```
https://trendydresses.co.ke/backend-php/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

---

**See `FIX_500_ERROR.md` for detailed troubleshooting.**

