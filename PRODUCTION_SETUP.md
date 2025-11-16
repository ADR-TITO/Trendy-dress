# Production Setup Guide for trendydresses.co.ke

Complete guide to connect your production website to MongoDB Atlas.

## Quick Start Checklist

- [ ] Create MongoDB Atlas account and cluster
- [ ] Configure database user and network access
- [ ] Get MongoDB Atlas connection string
- [ ] Create `.env` file in `backend/` folder
- [ ] Export local MongoDB data (if applicable)
- [ ] Import data to MongoDB Atlas
- [ ] Test connection
- [ ] Deploy backend to production server
- [ ] Verify website is working

## Step-by-Step Instructions

### 1. MongoDB Atlas Setup

Follow the detailed guide: **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)**

Quick summary:
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster
3. Create database user (save username/password)
4. Configure network access (whitelist server IP or 0.0.0.0/0)
5. Get connection string

### 2. Configure Backend .env File

1. **On your production server**, navigate to backend folder:
   ```bash
   cd backend
   ```

2. **Create .env file**:
   ```bash
   # Copy the template
   cp ENV_TEMPLATE.txt .env
   
   # Or create manually
   nano .env  # or use your preferred editor
   ```

3. **Add your MongoDB Atlas connection string**:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
   PORT=3000
   ```

4. **Replace placeholders**:
   - `your-username` → Your MongoDB Atlas database username
   - `your-password` → Your MongoDB Atlas database password
   - `cluster0.xxxxx` → Your actual cluster name

5. **Save the file**

### 3. Export and Import Data

Follow the detailed guide: **[MONGODB_EXPORT_IMPORT.md](./MONGODB_EXPORT_IMPORT.md)**

**Quick method using migration function:**
1. Open your website in browser
2. Open browser console (F12)
3. Run: `migrateFromIndexedDBToMongoDB()`
4. Wait for migration to complete

### 4. Test Connection

1. **Start backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Check for success messages**:
   ```
   ✅ Connected to MongoDB successfully
   📊 Database: trendy-dresses
   🔗 Host: cluster0.xxxxx.mongodb.net
   ```

3. **Test API endpoint**:
   - Visit: `https://trendydresses.co.ke/api/health`
   - Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`
   - **All API endpoints**: Available at `https://trendydresses.co.ke/api/*`

4. **Test data writing**:
   - Log in to admin panel
   - Add a test product
   - Check MongoDB Atlas → Browse Collections → products
   - Verify product appears

### 5. Deploy to Production

#### Option A: Same Server (Recommended)

If your backend runs on the same server as your website:

1. **Set up process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name trendy-dresses-api
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

2. **Configure reverse proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name trendydresses.co.ke;
       
       # Frontend
       location / {
           root /path/to/your/website;
           index index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Option B: Separate Server

If backend runs on a different server:

1. **Update frontend API URL** in `api-service.js`:
   - Change to your backend server URL
   - Example: `https://api.trendydresses.co.ke/api`

2. **Configure CORS** in `backend/server.js`:
   - Update `origin: '*'` to your website domain
   - Example: `origin: 'https://trendydresses.co.ke'`

### 6. Verify Everything Works

1. **Website loads products from MongoDB**:
   - Visit: https://trendydresses.co.ke
   - Check browser console for: `✅ MongoDB backend is available`
   - Products should load from MongoDB Atlas

2. **Admin panel works**:
   - Log in to admin panel
   - Add/edit/delete products
   - Verify changes appear in MongoDB Atlas

3. **Orders are saved**:
   - Create a test order
   - Check MongoDB Atlas → orders collection
   - Verify order was saved

## Troubleshooting

### Connection Issues

**"MongoServerSelectionError"**:
- Check IP whitelist in MongoDB Atlas
- Verify connection string is correct
- Wait 2-3 minutes after updating IP whitelist

**"Authentication failed"**:
- Verify username and password
- Check database user has read/write permissions
- URL-encode special characters in password

### Data Not Appearing

**Products not loading**:
- Check backend server is running
- Verify MongoDB connection in server logs
- Check browser console for errors
- Verify API endpoint: `https://trendydresses.co.ke/api/products`

**Orders not saving**:
- Check backend server logs
- Verify MongoDB connection
- Check CORS settings

## Security Checklist

- [ ] `.env` file is not committed to Git (add to `.gitignore`)
- [ ] Strong database password is used
- [ ] IP whitelist is configured (not 0.0.0.0/0 for production)
- [ ] HTTPS is enabled for production
- [ ] CORS is configured for specific domains
- [ ] Regular backups are set up in MongoDB Atlas

## Maintenance

### Regular Backups

MongoDB Atlas provides automated backups:
1. Go to MongoDB Atlas → Backup
2. Enable automated backups
3. Set backup schedule

### Monitoring

1. **MongoDB Atlas Monitoring**:
   - Check cluster metrics
   - Monitor connection count
   - Watch for errors

2. **Server Monitoring**:
   - Monitor server logs
   - Check API response times
   - Monitor database connection status

## Support Resources

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB Status**: https://status.mongodb.com/
- **Connection String Format**: https://docs.mongodb.com/manual/reference/connection-string/

## Next Steps

After setup is complete:
1. Set up automated backups
2. Configure monitoring alerts
3. Set up SSL certificate (HTTPS)
4. Optimize database indexes
5. Set up staging environment for testing

