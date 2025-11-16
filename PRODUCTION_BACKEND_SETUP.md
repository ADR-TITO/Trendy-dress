# Production Backend Server Setup Guide

This guide explains how to deploy and run the backend server on your production website `https://trendydresses.co.ke/`.

## Overview

The frontend is configured to use `https://trendydresses.co.ke/api` as the backend URL. You have two options:

1. **Option A: Same Domain with Proxy** (Recommended)
   - Frontend: `https://trendydresses.co.ke/`
   - Backend API: `https://trendydresses.co.ke/api` (proxied through Nginx)

2. **Option B: Subdomain**
   - Frontend: `https://trendydresses.co.ke/`
   - Backend API: `https://api.trendydresses.co.ke/api`

## Prerequisites

- Server with Node.js installed (v14+)
- Nginx or Apache web server
- SSH access to your server
- Domain: `trendydresses.co.ke`

## Step 1: Upload Backend Files to Server

Upload the `backend/` folder to your server. For example:
```
/var/www/trendydresses.co.ke/backend/
```

## Step 2: Install Backend Dependencies

SSH into your server and run:

```bash
cd /var/www/trendydresses.co.ke/backend
npm install
```

## Step 3: Configure Environment Variables

Create/update `.env` file in the backend folder:

```bash
cd /var/www/trendydresses.co.ke/backend
nano .env
```

Add your configuration:
```env
# Server Port (backend will run on this port)
PORT=3000

# MongoDB Connection String
MONGODB_URI=your_mongodb_atlas_connection_string_here

# M-Pesa Credentials (if using M-Pesa)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://trendydresses.co.ke/api/mpesa

# Node Environment
NODE_ENV=production
```

**Important**: Replace all placeholder values with your actual credentials!

## Step 4: Test Backend Server Locally

Before setting up the proxy, test if the backend works:

```bash
cd /var/www/trendydresses.co.ke/backend
npm start
```

The server should start on port 3000. Test it:
```bash
curl http://localhost:3000/api/health
```

You should see: `{"status":"ok","message":"Trendy Dresses API is running"}`

Press `Ctrl+C` to stop the server.

## Step 5: Set Up Process Manager (PM2) - Recommended

Install PM2 globally (if not already installed):
```bash
npm install -g pm2
```

Start the backend with PM2:
```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
```

Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

This will automatically start the backend server when your server reboots.

**PM2 Commands:**
- `pm2 list` - View running processes
- `pm2 logs trendy-dresses-api` - View logs
- `pm2 restart trendy-dresses-api` - Restart backend
- `pm2 stop trendy-dresses-api` - Stop backend
- `pm2 delete trendy-dresses-api` - Remove from PM2

## Step 6: Configure Nginx Reverse Proxy (Option A - Recommended)

If you're using Nginx, add this configuration to your Nginx site config:

```nginx
# Edit your Nginx config
sudo nano /etc/nginx/sites-available/trendydresses.co.ke
```

Add the following inside the `server` block:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trendydresses.co.ke www.trendydresses.co.ke;
    
    # SSL Configuration (adjust paths to your SSL certificates)
    ssl_certificate /path/to/your/ssl/certificate.crt;
    ssl_certificate_key /path/to/your/ssl/private.key;
    
    # Root directory for frontend files
    root /var/www/trendydresses.co.ke/public_html;
    index index.html;
    
    # Proxy API requests to backend server
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Test Nginx configuration:
```bash
sudo nginx -t
```

If successful, reload Nginx:
```bash
sudo systemctl reload nginx
```

## Step 7: Configure Apache Reverse Proxy (Alternative)

If you're using Apache, enable required modules:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
```

Edit your Apache virtual host:
```bash
sudo nano /etc/apache2/sites-available/trendydresses.co.ke.conf
```

Add the following:

```apache
<VirtualHost *:443>
    ServerName trendydresses.co.ke
    ServerAlias www.trendydresses.co.ke
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/ssl/certificate.crt
    SSLCertificateKeyFile /path/to/your/ssl/private.key
    
    # Document root for frontend
    DocumentRoot /var/www/trendydresses.co.ke/public_html
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    # Frontend files
    <Directory /var/www/trendydresses.co.ke/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Headers for API proxy
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    ProxyPassReverseCookiePath /api /api
</VirtualHost>
```

Test and reload Apache:
```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## Step 8: Verify Backend is Working

1. **Check if backend is running:**
   ```bash
   pm2 list
   # Should show "trendy-dresses-api" as online
   ```

2. **Test backend health endpoint:**
   ```bash
   curl https://trendydresses.co.ke/api/health
   ```
   Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`

3. **Check backend logs:**
   ```bash
   pm2 logs trendy-dresses-api
   ```

4. **Test MongoDB connection:**
   ```bash
   curl https://trendydresses.co.ke/api/db-status
   ```
   Should return MongoDB connection status.

## Step 9: Update Frontend Configuration (If Needed)

The frontend is already configured to use `https://trendydresses.co.ke/api` for production. Verify in `api-service.js`:

```javascript
if (window.location.hostname === 'trendydresses.co.ke' || 
    window.location.hostname === 'www.trendydresses.co.ke') {
    return window.location.origin + '/api';  // https://trendydresses.co.ke/api
}
```

If your backend is on a subdomain, update `api-service.js`:
```javascript
return 'https://api.trendydresses.co.ke/api';
```

## Troubleshooting

### Backend not accessible
1. Check if backend is running: `pm2 list`
2. Check backend logs: `pm2 logs trendy-dresses-api`
3. Test locally: `curl http://localhost:3000/api/health`
4. Check firewall: `sudo ufw status`

### CORS Errors
1. Verify `NODE_ENV=production` in `.env`
2. Check backend `server.js` CORS configuration
3. Ensure your domain is in `allowedOrigins`

### 502 Bad Gateway
1. Backend might be down: `pm2 restart trendy-dresses-api`
2. Check proxy configuration in Nginx/Apache
3. Verify backend is running on port 3000: `netstat -tulpn | grep 3000`

### MongoDB Connection Issues
1. Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` or your server IP)
2. Verify connection string in `.env`
3. Check MongoDB connection logs in PM2 logs

### Port Already in Use
If port 3000 is in use:
1. Change `PORT` in `.env` to another port (e.g., `3001`)
2. Update Nginx/Apache proxy to use the new port
3. Restart backend: `pm2 restart trendy-dresses-api`

## Security Recommendations

1. **Firewall**: Only allow ports 80, 443, and 22 (SSH) publicly
2. **SSL**: Use valid SSL certificates (Let's Encrypt recommended)
3. **Environment Variables**: Never commit `.env` file to Git
4. **MongoDB**: Use strong passwords and limit IP access
5. **PM2**: Set up PM2 monitoring and auto-restart on crashes

## Monitoring

Set up PM2 monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Next Steps

After backend is running:
1. Test STK Push payment functionality
2. Verify product CRUD operations work
3. Check admin panel orders sync
4. Monitor PM2 logs for any errors

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs trendy-dresses-api`
2. Check Nginx/Apache error logs
3. Verify all environment variables are set correctly
4. Test backend endpoints directly with `curl`

