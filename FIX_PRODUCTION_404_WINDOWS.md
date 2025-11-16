# 🔧 Fix Production API 404 - Windows Guide

## Understanding the Setup

- **Your Windows Machine**: Where you develop and test locally
- **Your Production Server** (`trendydresses.co.ke`): Linux server where your website is hosted

The `sudo` commands are for your **production Linux server**, not your Windows machine.

---

## Option 1: Fix from Windows (SSH into Production Server)

### Step 1: Connect to Your Production Server

**Using PowerShell or Command Prompt:**
```powershell
# If you have SSH access
ssh username@your-server-ip

# Or if using PuTTY, open PuTTY and connect to your server
```

**Once connected, you'll be on the Linux server** - then use the Linux commands below.

---

## Option 2: Use Your Server's Control Panel

If you have a hosting control panel (cPanel, Plesk, etc.):

### 1. Start Backend via Control Panel

- Look for "Terminal" or "SSH Access" in your control panel
- Or use "Cron Jobs" or "Task Scheduler" to start the backend

### 2. Configure Nginx via Control Panel

- Look for "Nginx Configuration" or "Web Server Settings"
- Add the `/api` location block manually through the interface

---

## Option 3: Contact Your Hosting Provider

If you don't have SSH access, contact your hosting provider and ask them to:

1. **Start the backend server** on port 3001:
   ```bash
   cd /var/www/trendydresses.co.ke/backend
   pm2 start npm --name "trendy-dresses-api" -- start
   ```

2. **Add Nginx configuration** for `/api`:
   ```nginx
   location /api {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

---

## For Local Windows Development

If you want to test locally on Windows (not production):

### Start Backend Locally:
```powershell
cd backend
npm start
```

The backend will run on `http://localhost:3001` (or next available port).

### Test Locally:
Open in browser: `http://localhost:3001/api/health`

---

## Quick Checklist

**For Production Server (Linux):**
- [ ] SSH into production server
- [ ] Navigate to backend folder
- [ ] Start backend with PM2
- [ ] Configure Nginx to proxy `/api` to `localhost:3001`
- [ ] Reload Nginx

**For Local Windows:**
- [ ] Open PowerShell/Command Prompt
- [ ] Navigate to `backend` folder
- [ ] Run `npm start`
- [ ] Test at `http://localhost:3001/api/health`

---

## Need Help?

**If you don't have SSH access:**
1. Contact your hosting provider
2. Ask them to configure the backend and Nginx
3. Provide them with the Nginx configuration from `backend/nginx-api-config.conf`

**If you have SSH access but need Windows tools:**
- Use **PuTTY** (free SSH client for Windows)
- Use **WinSCP** (free SFTP client for Windows)
- Use **Windows Terminal** with SSH support

---

## Alternative: Use Windows Subsystem for Linux (WSL)

If you have WSL installed:
```bash
# Open WSL terminal
wsl

# Then you can use Linux commands
ssh username@your-server-ip
```

---

**The key point:** The `sudo` commands are for your **Linux production server**, not your Windows development machine!

