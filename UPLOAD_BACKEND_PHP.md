# Upload backend-php/ Folder to Production Server

## What to Upload

Upload the **entire `backend-php/` folder** to your production server.

## Upload Methods

### Method 1: FTP/SFTP Client (Recommended)

**Using FileZilla, WinSCP, or similar:**

1. **Connect to your server:**
   - Host: `trendydresses.co.ke` (or your server IP)
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Navigate to your website root:**
   - Usually: `/public_html/` or `/www/` or `/var/www/trendydresses.co.ke/`
   - Same directory where your `index.html` is located

3. **Upload `backend-php/` folder:**
   - Drag and drop the entire `backend-php/` folder
   - Ensure all files and subfolders are uploaded
   - Wait for upload to complete

4. **Verify upload:**
   - Check that `backend-php/index.php` exists
   - Check that `backend-php/.htaccess` exists
   - Check that `backend-php/composer.json` exists

### Method 2: cPanel File Manager

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to your website root** (public_html or www)
4. **Click "Upload"**
5. **Select the `backend-php/` folder** (or zip it first, then extract)
6. **Wait for upload to complete**

### Method 3: ZIP and Upload

1. **Create ZIP file:**
   ```powershell
   Compress-Archive -Path "backend-php" -DestinationPath "backend-php.zip"
   ```

2. **Upload `backend-php.zip`** to your server

3. **Extract on server:**
   - Via cPanel File Manager: Right-click → Extract
   - Via SSH: `unzip backend-php.zip`

## Files to Upload

Ensure these files/folders are uploaded:

```
backend-php/
├── index.php              ✅ REQUIRED
├── .htaccess              ✅ REQUIRED
├── composer.json          ✅ REQUIRED
├── .env.example           ✅ REQUIRED (template)
├── config/
│   └── database.php       ✅ REQUIRED
├── src/
│   ├── Models/           ✅ REQUIRED
│   └── Services/         ✅ REQUIRED
├── routes/               ✅ REQUIRED
│   ├── health.php
│   ├── db-status.php
│   ├── server-info.php
│   ├── products.php
│   ├── orders.php
│   ├── admin.php
│   ├── mpesa.php
│   └── settings.php
└── test-backend.php       ✅ (for testing)
```

## After Upload - Next Steps

### Step 1: Install Dependencies

**If you have SSH access:**
```bash
cd /path/to/backend-php
composer install --no-dev
```

**If you don't have SSH:**
- Contact your hosting provider
- Ask them to run: `composer install` in `backend-php/` folder

### Step 2: Create .env File

**Via cPanel File Manager:**
1. Navigate to `backend-php/` folder
2. Copy `.env.example` to `.env`
3. Edit `.env` file
4. Add your MongoDB connection string

**Via SSH:**
```bash
cd backend-php
cp .env.example .env
nano .env
```

Add:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### Step 3: Set File Permissions

**Via cPanel File Manager:**
- Right-click `backend-php/` folder → Change Permissions → 755
- Right-click `.htaccess` → Change Permissions → 644

**Via SSH:**
```bash
chmod -R 755 backend-php
chmod 644 backend-php/.htaccess
```

### Step 4: Configure Web Server

**Apache:** Ensure `.htaccess` is enabled (usually is by default)

**Nginx:** Configure routing (see deployment guide)

### Step 5: Test

```bash
# Test 1: Health check
curl https://trendydresses.co.ke/api/health

# Test 2: Test script
# Visit: https://trendydresses.co.ke/backend-php/test-backend.php
```

## Upload Checklist

- [ ] Connected to FTP/SFTP server
- [ ] Navigated to website root directory
- [ ] Uploaded entire `backend-php/` folder
- [ ] Verified `index.php` exists
- [ ] Verified `.htaccess` exists
- [ ] Verified `composer.json` exists
- [ ] Set file permissions (755 for folders, 644 for files)
- [ ] Installed dependencies (`composer install`)
- [ ] Created `.env` file with MongoDB connection
- [ ] Tested: `curl https://trendydresses.co.ke/api/health`

## Troubleshooting

### Upload Fails
- Check file permissions on server
- Check disk space
- Try uploading files one by one

### Files Not Appearing
- Check upload location
- Refresh File Manager
- Check file permissions

### 404 After Upload
- Verify `.htaccess` is uploaded
- Check web server configuration
- Test: `https://trendydresses.co.ke/backend-php/test-backend.php`

---

**Once uploaded and configured, your website will work!** ✅

