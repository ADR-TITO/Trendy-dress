# 📧 Hosting Support Request Template

## Copy and send this to your hosting provider:

---

**Subject:** Need Backend API Server Configured for trendydresses.co.ke

**Message:**

Hello,

I need help configuring my backend API server for my website `trendydresses.co.ke`. Currently, the API endpoint `https://trendydresses.co.ke/api/health` returns a 404 error.

**What I need:**

1. **Start the backend server** using PM2:
   - Location: `/var/www/trendydresses.co.ke/backend/` (or wherever the backend folder is)
   - Command: `pm2 start npm --name "trendy-dresses-api" -- start`
   - The server should run on port 3001 (or next available port)
   - Make sure PM2 starts on server reboot: `pm2 save && pm2 startup`

2. **Configure Nginx** to proxy `/api` requests to the backend:
   - Add this location block to the Nginx configuration for `trendydresses.co.ke`:

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

   - This should be added to both HTTP (port 80) and HTTPS (port 443) server blocks
   - After adding, test with: `nginx -t` and reload: `systemctl reload nginx`

3. **Verify it works:**
   - Test: `curl https://trendydresses.co.ke/api/health`
   - Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`

**Backend Requirements:**
- Node.js installed
- PM2 installed (if not: `npm install -g pm2`)
- Backend folder contains `package.json` and `server.js`
- `.env` file configured with MongoDB connection string

**Files I can provide:**
- Backend folder structure
- Nginx configuration template
- PM2 configuration

Please let me know if you need any additional information or if there are any issues.

Thank you!

---

## Alternative: Step-by-Step Instructions

If your hosting provider prefers step-by-step instructions, send them this:

### Step 1: Locate Backend Folder
The backend folder should be at:
- `/var/www/trendydresses.co.ke/backend/`
- Or wherever the website files are located

### Step 2: Install Dependencies (if needed)
```bash
cd /var/www/trendydresses.co.ke/backend
npm install
```

### Step 3: Check .env File
Make sure `.env` file exists with:
```
MONGODB_URI=mongodb+srv://...
PORT=3001
NODE_ENV=production
```

### Step 4: Start Backend with PM2
```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
pm2 startup
```

### Step 5: Test Backend Locally
```bash
curl http://localhost:3001/api/health
```

### Step 6: Configure Nginx
Edit: `/etc/nginx/sites-available/trendydresses.co.ke`

Add the location block (see above) inside the `server` block.

### Step 7: Test and Reload Nginx
```bash
nginx -t
systemctl reload nginx
```

### Step 8: Verify Public Access
```bash
curl https://trendydresses.co.ke/api/health
```

---

## What to Provide Your Hosting Provider

1. **Backend folder location** (if you know it)
2. **Nginx configuration file location** (usually `/etc/nginx/sites-available/trendydresses.co.ke`)
3. **This support request document**
4. **The `backend/nginx-api-config.conf` file** from this project

---

## Follow-Up Questions to Ask

After they configure it, ask:

1. "What port is the backend running on?" (should be 3001)
2. "Can you verify `curl https://trendydresses.co.ke/api/health` works?"
3. "Is PM2 configured to start on server reboot?"
4. "Are there any errors in the backend logs?" (`pm2 logs trendy-dresses-api`)

---

## If They Need More Information

Provide them with:
- `backend/nginx-api-config.conf` - Nginx configuration
- `backend/package.json` - Shows dependencies
- `backend/server.js` - Shows it's a Node.js Express server
- `FIX_PRODUCTION_API_404.md` - Full troubleshooting guide

