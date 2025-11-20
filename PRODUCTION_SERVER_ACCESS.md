# 🔐 How to Access Your Production Server

## Understanding Your Setup

You have:
- **Windows Development Machine** (where you code)
- **Linux Production Server** (where `trendydresses.co.ke` is hosted)

The production server needs to be configured, which requires Linux commands.

---

## Method 1: SSH from Windows

### Using Windows PowerShell (Windows 10/11)

```powershell
# Connect to your server
ssh username@your-server-ip

# Example:
ssh root@123.456.789.0
# or
ssh admin@trendydresses.co.ke
```

**After connecting, you'll be on the Linux server** - then you can run:
```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
```

### Using PuTTY (If SSH not available in PowerShell)

1. Download PuTTY: https://www.putty.org/
2. Install and open PuTTY
3. Enter your server IP or hostname
4. Click "Open"
5. Enter username and password when prompted

---

## Method 2: Using Your Hosting Control Panel

### cPanel
1. Log into cPanel
2. Find "Terminal" or "SSH Access"
3. Open terminal
4. Run the commands

### Plesk
1. Log into Plesk
2. Go to "Websites & Domains"
3. Find "SSH Access" or "Terminal"
4. Open terminal

### Other Control Panels
- Look for "Terminal", "SSH", "Command Line", or "Shell Access"

---

## Method 3: File Manager + Support Ticket

If you can't access terminal:

1. **Upload backend files** via File Manager (FTP/SFTP)
2. **Contact hosting support** and ask them to:
   - Start the backend: `cd /var/www/trendydresses.co.ke/backend && pm2 start npm --name "trendy-dresses-api" -- start`
   - Configure Nginx (provide them `backend/nginx-api-config.conf`)

---

## Method 4: Windows Subsystem for Linux (WSL)

If you have WSL installed:

```bash
# Open WSL terminal
wsl

# Now you can use Linux commands
ssh username@your-server-ip
```

---

## Finding Your Server Details

**Check with your hosting provider:**
- Server IP address
- SSH username
- SSH password or SSH key
- Server type (shared hosting, VPS, dedicated)

**Common server locations:**
- `/var/www/trendydresses.co.ke/`
- `/home/username/public_html/`
- `/var/www/html/`

---

## Quick Commands Once Connected

```bash
# 1. Navigate to backend
cd /var/www/trendydresses.co.ke/backend

# 2. Check if backend is running
pm2 list

# 3. Start backend (if not running)
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save

# 4. Check backend logs
pm2 logs trendy-dresses-api

# 5. Test backend locally
curl http://localhost:3001/api/health

# 6. Edit Nginx config
sudo nano /etc/nginx/sites-available/trendydresses.co.ke

# 7. Test Nginx config
sudo nginx -t

# 8. Reload Nginx
sudo systemctl reload nginx
```

---

## Troubleshooting Access

### "SSH not available"
- Contact hosting provider to enable SSH
- Or use hosting control panel terminal

### "Permission denied"
- Check username and password
- May need to use SSH key instead of password

### "Command not found"
- May need to install Node.js/PM2 on server
- Contact hosting provider

---

## Need Help?

**If you're unsure how to access your server:**
1. Contact your hosting provider
2. Ask: "How do I access SSH/Terminal for my server?"
3. Provide them with the configuration files from this project

**Common hosting providers:**
- **cPanel hosting**: Usually has "Terminal" in cPanel
- **VPS/Dedicated**: Usually has SSH access
- **Shared hosting**: May not have SSH (use File Manager + support)

---

**Remember:** You need to access your **Linux production server** to fix the 404 error, not your Windows machine!

