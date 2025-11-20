# 🔧 Fix 500 Error on Production

## The Problem

You're getting:
```
https://trendydresses.co.ke/backend-php/api/health
[HTTP/3 500]
```

**500 = Internal Server Error** - PHP code is running but encountering an error.

## Quick Diagnosis

### Step 1: Check Debug Script

Visit: `https://trendydresses.co.ke/backend-php/debug.php`

This will show:
- ✅ PHP version
- ✅ Extensions installed
- ✅ Files present
- ✅ Database connection status
- ✅ Error details

### Step 2: Check Error Logs

**In cPanel:**
1. Go to "Error Log" or "Error Logs"
2. Look for recent PHP errors
3. Check for database connection errors

**Or check file:**
- `backend-php/logs/php-errors.log` (if created)

## Common Causes & Fixes

### Issue 1: Database Connection Failed

**Symptoms:**
- 500 error
- Database connection error in logs

**Fix:**
1. **Verify database credentials in `.env`:**
   ```
   DB_HOST=localhost
   DB_NAME=trendydr_Shpo
   DB_USER=trendydr_Adrian
   DB_PASS=i"d)Z8NGP}8"?aa
   ```

2. **Check database exists in cPanel:**
   - Go to "MySQL Databases"
   - Verify `trendydr_Shpo` exists

3. **Check user permissions:**
   - User `trendydr_Adrian` should have access to database
   - Check in "MySQL Users" section

4. **Test connection manually:**
   - Use cPanel "phpMyAdmin"
   - Try to connect with credentials

### Issue 2: Missing PHP Extensions

**Symptoms:**
- PDO MySQL not available

**Fix:**
1. **In cPanel:**
   - Go to "Select PHP Version"
   - Enable: `pdo_mysql` extension
   - Save changes

### Issue 3: File Permissions

**Symptoms:**
- Files exist but can't be read

**Fix:**
```bash
# Via cPanel File Manager or SSH
chmod 644 backend-php/*.php
chmod 644 backend-php/.htaccess
chmod 755 backend-php/
chmod 755 backend-php/config/
chmod 755 backend-php/src/
chmod 755 backend-php/logs/
```

### Issue 4: .env File Missing or Wrong

**Symptoms:**
- Database connection fails
- Using default values

**Fix:**
1. **Check `.env` file exists:**
   - Should be in `backend-php/.env`

2. **Verify content:**
   ```
   DB_HOST=localhost
   DB_NAME=trendydr_Shpo
   DB_USER=trendydr_Adrian
   DB_PASS=i"d)Z8NGP}8"?aa
   ```

3. **Check file permissions:**
   ```bash
   chmod 644 backend-php/.env
   ```

### Issue 5: PHP Version Too Old

**Symptoms:**
- Syntax errors
- Missing features

**Fix:**
1. **In cPanel:**
   - Go to "Select PHP Version"
   - Choose PHP 7.4 or higher
   - Save

### Issue 6: .htaccess Not Working

**Symptoms:**
- Routes not working
- 404 errors

**Fix:**
1. **Check mod_rewrite enabled:**
   - In cPanel, check Apache modules
   - Enable mod_rewrite if needed

2. **Verify .htaccess exists:**
   - Should be in `backend-php/.htaccess`

## Step-by-Step Fix

### 1. Upload Debug Script

Upload `backend-php/debug.php` to your server.

### 2. Visit Debug URL

```
https://trendydresses.co.ke/backend-php/debug.php
```

### 3. Check Output

Look for:
- ❌ Red X marks (problems)
- ✅ Green checkmarks (working)

### 4. Fix Issues

Based on debug output:
- Fix database connection
- Enable PHP extensions
- Fix file permissions
- Update .env file

### 5. Test Again

```
https://trendydresses.co.ke/backend-php/api/health
```

Should return:
```json
{"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
```

## Quick Checklist

- [ ] `.env` file exists and has correct credentials
- [ ] Database `trendydr_Shpo` exists in cPanel
- [ ] User `trendydr_Adrian` has access to database
- [ ] PHP version 7.4+ selected
- [ ] PDO MySQL extension enabled
- [ ] File permissions correct (644 for files, 755 for folders)
- [ ] `.htaccess` file exists
- [ ] mod_rewrite enabled

## Still Not Working?

1. **Check cPanel Error Logs:**
   - Most detailed error information

2. **Contact Hosting Support:**
   - Provide error logs
   - Ask about PHP configuration
   - Request PDO MySQL extension

3. **Test with debug.php:**
   - Share output for diagnosis

---

**Once fixed, your backend will work!** ✅

