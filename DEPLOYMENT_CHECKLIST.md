# PHP Backend Deployment Checklist

## ⚠️ Current Status: NOT DEPLOYED

Your production server returns **404** because PHP backend is not deployed.

## Deployment Checklist

### ✅ Step 1: Upload Files
- [ ] Upload `backend-php/` folder to production server
- [ ] Location: Same directory as `index.html` OR web root
- [ ] Verify all files uploaded correctly

### ✅ Step 2: Install Dependencies
- [ ] SSH to server (or contact hosting provider)
- [ ] Run: `cd backend-php && composer install --no-dev`
- [ ] Verify `vendor/` folder exists

### ✅ Step 3: Configure Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Add MongoDB connection string to `.env`
- [ ] Verify `.env` file is in `backend-php/` folder

### ✅ Step 4: Configure Web Server

**Apache:**
- [ ] Ensure `mod_rewrite` is enabled
- [ ] Ensure `.htaccess` is in `backend-php/` folder
- [ ] If `backend-php/` is in subdirectory, configure virtual host

**Nginx:**
- [ ] Add routing configuration for `/api`
- [ ] Restart Nginx

### ✅ Step 5: Test

**Test 1: Health Check**
```bash
curl https://trendydresses.co.ke/api/health
```
Expected: `{"status":"ok","backend":"PHP"}`

**Test 2: Test Script**
```
https://trendydresses.co.ke/backend-php/test-backend.php
```
Should show PHP info and MongoDB extension status

**Test 3: Database Status**
```bash
curl https://trendydresses.co.ke/api/db-status
```
Should show MongoDB connection status

### ✅ Step 6: Verify Frontend

- [ ] Refresh website
- [ ] Check browser console - should see "✅ MongoDB backend is available"
- [ ] Test product loading
- [ ] Test M-Pesa payment

## Troubleshooting

### Still Getting 404?

1. **Check file structure:**
   ```
   /var/www/trendydresses.co.ke/
   ├── index.html
   ├── backend-php/
   │   ├── index.php
   │   ├── .htaccess
   │   ├── .env
   │   └── vendor/
   ```

2. **Test PHP directly:**
   ```
   https://trendydresses.co.ke/backend-php/test-backend.php
   ```

3. **Check Apache error logs:**
   ```bash
   tail -f /var/log/apache2/error.log
   ```

4. **Verify .htaccess is working:**
   - Check if `mod_rewrite` is enabled
   - Check file permissions (644 for .htaccess)

## Quick Reference

**Files to upload:**
- Entire `backend-php/` folder

**Commands to run:**
```bash
cd backend-php
composer install --no-dev
cp .env.example .env
nano .env  # Add MongoDB connection string
```

**Test commands:**
```bash
curl https://trendydresses.co.ke/api/health
curl https://trendydresses.co.ke/api/db-status
```

---

**Once all steps are complete, your website will work!** ✅

