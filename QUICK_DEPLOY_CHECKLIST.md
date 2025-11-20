# ✅ Quick Deployment Checklist

## For Your cPanel Server

### 1. Upload Files ✅
- [ ] Upload `backend-php/` folder to `public_html/`
- [ ] Verify all files uploaded correctly

### 2. Install Dependencies ✅
- [ ] Run `composer install --no-dev` in `backend-php/`
- [ ] Or upload `vendor/` folder from local installation

### 3. Configure Environment ✅
- [ ] Create `.env` file from `.env.example`
- [ ] Add MongoDB Atlas connection string
- [ ] Verify `.env` file permissions (644)

### 4. Set Permissions ✅
```bash
chmod 755 backend-php/
chmod 644 backend-php/*.php
chmod 644 backend-php/.htaccess
```

### 5. Configure PHP ✅
- [ ] Set PHP version to 7.4+ in cPanel
- [ ] Enable required extensions (curl, fileinfo, mbstring, openssl)

### 6. Setup MongoDB ✅
- [ ] Create MongoDB Atlas account
- [ ] Create cluster
- [ ] Get connection string
- [ ] Add to `.env` file
- [ ] Whitelist server IP in MongoDB Atlas

### 7. Test Backend ✅
- [ ] Visit: `https://trendydresses.co.ke/backend-php/api/health`
- [ ] Should return: `{"status":"ok","backend":"PHP"}`

### 8. Update Frontend ✅
- [ ] Update `api-service.js` with production URL
- [ ] Test frontend connection

## Quick Commands

```bash
# Upload files (via FTP or cPanel File Manager)
# Then SSH/Terminal:

cd public_html/backend-php
composer install --no-dev
cp .env.example .env
# Edit .env and add MongoDB connection string
chmod 755 .
chmod 644 *.php
chmod 644 .htaccess

# Test
curl https://trendydresses.co.ke/backend-php/api/health
```

## MongoDB Atlas Setup

1. **Sign up:** https://www.mongodb.com/cloud/atlas
2. **Create cluster:** Free tier available
3. **Get connection string:** 
   ```
   mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses
   ```
4. **Whitelist IP:** Add your server IP (or 0.0.0.0/0 for all)
5. **Add to .env:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses?retryWrites=true&w=majority
   ```

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

**Once all checked, your backend is deployed!** ✅

