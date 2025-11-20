# MongoDB Atlas Setup for Production (trendydresses.co.ke)

This guide will help you connect your production website to MongoDB Atlas and migrate your local data.

## Step 1: Create MongoDB Atlas Account & Cluster

1. **Sign up for MongoDB Atlas** (Free tier available):
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with your email

2. **Create a Free Cluster**:
   - Click "Build a Database"
   - Choose "M0 FREE" (Free tier)
   - Select a cloud provider (AWS, Google Cloud, or Azure)
   - Choose a region closest to your server (e.g., `us-east-1` for US, `eu-west-1` for Europe)
   - Click "Create Cluster"
   - Wait 3-5 minutes for cluster to be created

## Step 2: Configure Database Access

1. **Create Database User**:
   - Go to: **Database Access** (left sidebar)
   - Click **Add New Database User**
   - Choose **Password** authentication
   - Enter a username (e.g., `trendydresses-admin`)
   - Click **Autogenerate Secure Password** or create your own
   - **IMPORTANT**: Copy and save the password - you'll need it for the connection string!
   - Under "Database User Privileges", select **Read and write to any database**
   - Click **Add User**

2. **Configure Network Access**:
   - Go to: **Network Access** (left sidebar)
   - Click **Add IP Address**
   - For production, you have two options:
     - **Option A (Recommended for Production)**: Add your server's IP address
       - Click **Add Current IP Address** (if setting up from your server)
       - Or manually enter your server's IP
     - **Option B (For Testing)**: Allow all IPs temporarily
       - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
       - ⚠️ **Security Note**: Only use this for testing. For production, use specific IPs.
   - Click **Confirm**
   - Wait 1-2 minutes for changes to take effect

## Step 3: Get Connection String

1. **Get Your Connection String**:
   - Go to: **Database** (left sidebar)
   - Click **Connect** on your cluster
   - Choose **Connect your application**
   - Select **Node.js** and version **5.5 or later**
   - Copy the connection string (it looks like):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

2. **Replace Placeholders**:
   - Replace `<username>` with your database username (e.g., `trendydresses-admin`)
   - Replace `<password>` with your database password
   - Add database name: Replace `?` with `/trendy-dresses?` (or your preferred database name)
   - Final connection string should look like:
     ```
     mongodb+srv://trendydresses-admin:YourPassword123@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
     ```

## Step 4: Configure Backend .env File

1. **On Your Production Server**:
   - Navigate to the `backend` folder
   - Create or edit the `.env` file:
     ```bash
     cd backend
     nano .env  # or use your preferred text editor
     ```

2. **Add MongoDB Atlas Connection String**:
   ```env
   MONGODB_URI=mongodb+srv://trendydresses-admin:YourPassword123@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
   PORT=3000
   ```

3. **Save the file** (make sure it's named `.env` with no extension)

4. **IMPORTANT**: Never commit `.env` to Git! It contains sensitive credentials.

## Step 5: Test Connection

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Check for Success Messages**:
   You should see:
   ```
   🔄 Attempting to connect to MongoDB...
   ✅ Connected to MongoDB successfully
   📊 Database: trendy-dresses
   🔗 Host: cluster0.xxxxx.mongodb.net
   ```

3. **Test API Endpoint**:
   - Visit: `https://trendydresses.co.ke/api/health`
   - Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`
   - **Production URL**: All API endpoints are available at `https://trendydresses.co.ke/api/*`

## Step 6: Verify Data Writing

1. **Add a Test Product** (via Admin Panel):
   - Log in to admin panel
   - Add a new product
   - Check MongoDB Atlas to verify it was saved:
     - Go to: **Database** → **Browse Collections**
     - You should see a `products` collection with your test product

2. **Check Orders** (after a test order):
   - Create a test order
   - Check MongoDB Atlas for `orders` collection

## Troubleshooting

### Connection Timeout
- **Check IP Whitelist**: Make sure your server IP is whitelisted in Network Access
- **Wait Time**: After adding IP, wait 2-3 minutes for changes to propagate
- **Check Firewall**: Ensure your server allows outbound connections on port 27017

### Authentication Failed
- **Verify Username/Password**: Check Database Access settings
- **Check Connection String**: Make sure password is URL-encoded (special characters need encoding)
- **Reset Password**: If needed, create a new database user

### Server Selection Error
- **Check Cluster Status**: Ensure cluster is running (not paused)
- **Verify Connection String**: Check cluster name matches your actual cluster
- **Network Issues**: Check server's internet connection

## Next Steps

After setting up MongoDB Atlas, proceed to:
- [Export Local MongoDB Data](./MONGODB_EXPORT_IMPORT.md) - Export your local data
- [Import to MongoDB Atlas](./MONGODB_EXPORT_IMPORT.md) - Import data to Atlas

## Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords for database users
2. **Limit IP Access**: Only whitelist necessary IP addresses
3. **Regular Backups**: Set up automated backups in MongoDB Atlas
4. **Monitor Access**: Regularly check Database Access logs
5. **Rotate Credentials**: Change passwords periodically

## Support

If you encounter issues:
1. Check MongoDB Atlas status: https://status.mongodb.com/
2. Review MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
3. Check server logs for detailed error messages

