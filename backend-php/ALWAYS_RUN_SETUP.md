# 🔄 Keep Backend Always Running - Setup Guide

## Overview

This guide shows you how to ensure the PHP backend **always runs** and **auto-restarts** if it crashes.

## Options

### Option 1: Supervisor (Recommended for Linux)

**Best for:** Production Linux servers

**Installation:**
```bash
cd backend-php
sudo bash install-supervisor.sh
```

**Features:**
- ✅ Auto-start on server boot
- ✅ Auto-restart if crashes
- ✅ Log management
- ✅ Process monitoring

**Commands:**
```bash
sudo supervisorctl start trendy-dresses-backend
sudo supervisorctl stop trendy-dresses-backend
sudo supervisorctl restart trendy-dresses-backend
sudo supervisorctl status trendy-dresses-backend
```

### Option 2: systemd Service (Linux)

**Best for:** Modern Linux distributions

**Installation:**
```bash
cd backend-php
sudo bash install-service.sh
```

**Features:**
- ✅ Auto-start on boot
- ✅ Auto-restart on failure
- ✅ Integrated with system logs
- ✅ Dependency management

**Commands:**
```bash
sudo systemctl start trendy-dresses-backend
sudo systemctl stop trendy-dresses-backend
sudo systemctl restart trendy-dresses-backend
sudo systemctl status trendy-dresses-backend
sudo journalctl -u trendy-dresses-backend -f  # View logs
```

### Option 3: PM2 (Cross-platform)

**Best for:** If you have Node.js installed

**Installation:**
```bash
cd backend-php
bash install-pm2.sh
```

**Features:**
- ✅ Auto-restart
- ✅ Log management
- ✅ Process monitoring
- ✅ Works on Linux, Mac, Windows

**Commands:**
```bash
pm2 start ecosystem.config.js
pm2 stop trendy-dresses-backend
pm2 restart trendy-dresses-backend
pm2 status
pm2 logs trendy-dresses-backend
```

### Option 4: PHP-FPM + Nginx/Apache (Production)

**Best for:** Production web servers

**Setup:**
1. Configure PHP-FPM
2. Configure Nginx/Apache to use PHP-FPM
3. Backend runs automatically with web server

**See:** `DEPLOY_PHP_BACKEND_PRODUCTION.md`

### Option 5: Keep-Alive Script (Simple)

**Best for:** Testing or simple setups

**Run:**
```bash
cd backend-php
php keep-alive.php
```

**Features:**
- ✅ Monitors backend health
- ✅ Auto-restarts if down
- ✅ Simple, no dependencies

## Quick Setup (Choose One)

### For Production Server (Linux)

```bash
# Option 1: Supervisor (Recommended)
cd backend-php
sudo bash install-supervisor.sh

# OR Option 2: systemd
cd backend-php
sudo bash install-service.sh
```

### For Development

```bash
# Use PM2 or Keep-Alive script
cd backend-php
pm2 start ecosystem.config.js
# OR
php keep-alive.php
```

## Verification

After installation, verify:

```bash
# Check if running
curl http://localhost:8000/api/health

# Check process
ps aux | grep php

# Check logs
tail -f /var/log/trendy-dresses-backend.log
```

## Auto-Start on Boot

All methods above automatically start on server boot:
- ✅ Supervisor: `autostart=true`
- ✅ systemd: `systemctl enable`
- ✅ PM2: `pm2 startup`

## Monitoring

### Check Status

**Supervisor:**
```bash
sudo supervisorctl status
```

**systemd:**
```bash
sudo systemctl status trendy-dresses-backend
```

**PM2:**
```bash
pm2 status
```

### View Logs

**Supervisor:**
```bash
tail -f /var/log/trendy-dresses-backend.log
```

**systemd:**
```bash
sudo journalctl -u trendy-dresses-backend -f
```

**PM2:**
```bash
pm2 logs trendy-dresses-backend
```

## Troubleshooting

### Service Not Starting

1. **Check PHP is installed:**
   ```bash
   php --version
   ```

2. **Check file permissions:**
   ```bash
   chmod +x index.php
   chmod 755 backend-php/
   ```

3. **Check logs:**
   ```bash
   # Supervisor
   sudo tail -f /var/log/trendy-dresses-backend.log
   
   # systemd
   sudo journalctl -u trendy-dresses-backend -n 50
   ```

### Port Already in Use

Change port in configuration:
- Supervisor: Edit `supervisor.conf`
- systemd: Edit `.service` file
- PM2: Edit `ecosystem.config.js`

### Backend Keeps Restarting

1. Check `.env` file exists and is correct
2. Check MongoDB connection
3. Check PHP errors in logs
4. Test manually: `php -S localhost:8000 -t .`

---

**Once configured, your backend will always run!** ✅

