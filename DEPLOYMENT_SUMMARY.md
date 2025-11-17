# 📋 Deployment Summary for Your cPanel Server

## Your Server Information

- **Server Type:** Shared Hosting (cPanel)
- **Database:** MariaDB (but we use MongoDB Atlas)
- **User:** cpses_tr35jagar6@localhost
- **Domain:** trendydresses.co.ke

## Important Notes

⚠️ **Your backend uses MongoDB (not MariaDB)**
- The MariaDB shown is for other applications
- We use **MongoDB Atlas** (cloud database)
- No need to configure MariaDB

## Deployment Steps

### 1. Upload Backend Files

**Via cPanel File Manager:**
1. Login to cPanel
2. Open "File Manager"
3. Navigate to `public_html/`
4. Upload `backend-php/` folder

**Or via FTP:**
- Connect to your server
- Upload `backend-php/` folder to `public_html/`

### 2. Install Dependencies

**Via cPanel Terminal:**
```bash
cd public_html/backend-php
composer install --no-dev
```

**Or upload vendor folder:**
- Install locally: `composer install --no-dev`
- Upload `vendor/` folder to server

### 3. Configure .env File

1. **Create `.env` file:**
   ```bash
   cd public_html/backend-php
   cp .env.example .env
   ```

2. **Edit `.env` and add MongoDB connection:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses?retryWrites=true&w=majority
   ```

### 4. Set File Permissions

```bash
chmod 755 backend-php/
chmod 644 backend-php/*.php
chmod 644 backend-php/.htaccess
```

### 5. Configure PHP in cPanel

1. **Set PHP Version:**
   - Go to "Select PHP Version"
   - Choose PHP 7.4 or higher

2. **Enable Extensions:**
   - curl
   - fileinfo
   - mbstring
   - openssl

### 6. Setup MongoDB Atlas

1. **Create account:** https://www.mongodb.com/cloud/atlas
2. **Create free cluster**
3. **Get connection string**
4. **Add to `.env` file**
5. **Whitelist server IP** (or `0.0.0.0/0` for all)

### 7. Test Backend

Visit: `https://trendydresses.co.ke/backend-php/api/health`

Should return:
```json
{"status":"ok","message":"Trendy Dresses API is running","backend":"PHP"}
```

## Frontend Configuration

✅ **Frontend is already configured!**

The frontend automatically detects:
- Production: `https://trendydresses.co.ke/backend-php/api`
- Development: `http://localhost:8000/api`

No changes needed to frontend code!

## URL Structure

After deployment, your API will be at:
```
https://trendydresses.co.ke/backend-php/api/health
https://trendydresses.co.ke/backend-php/api/products
https://trendydresses.co.ke/backend-php/api/orders
```

## Quick Checklist

- [ ] Backend files uploaded to `public_html/backend-php/`
- [ ] Dependencies installed (`composer install`)
- [ ] `.env` file created with MongoDB connection
- [ ] File permissions set (755 for folders, 644 for files)
- [ ] PHP version set to 7.4+ in cPanel
- [ ] PHP extensions enabled
- [ ] MongoDB Atlas configured
- [ ] Health check works: `https://trendydresses.co.ke/backend-php/api/health`
- [ ] Frontend can connect (automatic)

## Troubleshooting

### 404 Error
- Check `.htaccess` file exists
- Verify mod_rewrite is enabled
- Check file paths

### 500 Error
- Check PHP error logs in cPanel
- Verify `.env` file is correct
- Check dependencies installed

### MongoDB Error
- Verify connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Test connection manually

---

**Your backend is ready to deploy!** ✅

See `DEPLOY_TO_SHARED_HOSTING.md` for detailed instructions.

