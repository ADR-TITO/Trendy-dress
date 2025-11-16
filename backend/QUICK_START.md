# Quick Start Guide - Backend Server

## For Windows Users

### Option 1: Using Batch File (Easiest)
1. Double-click `start-backend.bat`
2. The script will:
   - Check if Node.js is installed
   - Install dependencies if needed
   - Create .env file if missing
   - Start the backend server

### Option 2: Using PowerShell
1. Right-click `start-backend.ps1`
2. Select "Run with PowerShell"
3. Follow the same steps as above

### Option 3: Manual Start
1. Open Command Prompt or PowerShell
2. Navigate to backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies (first time only):
   ```bash
   npm install
   ```
4. Create .env file if needed:
   ```bash
   copy ENV_TEMPLATE.txt .env
   ```
5. Edit .env file and add your MongoDB connection string
6. Start the server:
   ```bash
   npm start
   ```

## Verify Backend is Running

### Method 1: Using Check Script
```bash
npm run check
```

### Method 2: Using Browser
1. Open browser
2. Visit: `http://localhost:3000/api/health`
3. Should see: `{"status":"ok","message":"Trendy Dresses API is running"}`

### Method 3: Using curl (if installed)
```bash
curl http://localhost:3000/api/health
```

## Check Database Connection

```bash
npm run check
```

Or visit: `http://localhost:3000/api/db-status`

Should show MongoDB connection status.

## Verify Environment Variables

```bash
npm run verify-env
```

This checks if your .env file is configured correctly.

## Troubleshooting

### Port 3000 Already in Use
1. Find what's using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Kill the process or change PORT in .env file:
   ```env
   PORT=3001
   ```

### MongoDB Connection Failed
1. Check your MongoDB connection string in .env
2. Verify MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0)
3. Wait 1-2 minutes after updating IP whitelist

### Dependencies Not Installing
1. Make sure Node.js is installed: `node --version`
2. Update npm: `npm install -g npm@latest`
3. Clear npm cache: `npm cache clean --force`
4. Delete node_modules and try again: `rmdir /s node_modules && npm install`

## Next Steps

Once backend is running:
1. Test API: Visit `http://localhost:3000/api/health`
2. Test frontend: Open your website and check browser console
3. Verify MongoDB: Check `/api/db-status` endpoint

## Production Deployment

For production deployment on your server, see:
- `PRODUCTION_BACKEND_SETUP.md` - Complete production guide
- `ecosystem.config.js` - PM2 configuration for production

## Support

If you encounter issues:
1. Check server logs in the console
2. Run `npm run check` to verify status
3. Run `npm run verify-env` to check configuration
4. Check MongoDB Atlas connection status

