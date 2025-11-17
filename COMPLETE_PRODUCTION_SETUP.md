# 🚀 Complete Production Setup - Backend Always Running

## Overview

This guide sets up your PHP backend to **always run** on your production server with:
- ✅ Auto-start on server boot
- ✅ Auto-restart if crashes
- ✅ Health monitoring
- ✅ Log management
- ✅ Process management

## Quick Setup (Recommended)

### Step 1: Upload Backend

Upload `backend-php/` folder to your server.

### Step 2: Run Setup Script

```bash
cd backend-php
sudo bash setup-auto-start.sh
```

This script will:
1. Check prerequisites
2. Install dependencies
3. Setup .env file
4. Configure process manager
5. Setup health monitoring

### Step 3: Verify

```bash
curl http://localhost:8000/api/health
```

Should return: `{"status":"ok","backend":"PHP"}`

## Manual Setup Options

### Option 1: Supervisor (Recommended)

```bash
cd backend-php
sudo bash install-supervisor.sh
```

**Features:**
- Auto-start on boot
- Auto-restart on crash
- Log rotation
- Process monitoring

### Option 2: systemd Service

```bash
cd backend-php
sudo bash install-service.sh
```

**Features:**
- Native Linux service
- Integrated logging
- Dependency management
- System integration

### Option 3: PM2

```bash
cd backend-php
bash install-pm2.sh
```

**Features:**
- Cross-platform
- Easy monitoring
- Log management
- Process clustering

## Web Server Configuration

### Apache

1. **Enable site:**
   ```bash
   sudo cp backend-php/apache-production.conf /etc/apache2/sites-available/trendydresses.co.ke.conf
   sudo a2ensite trendydresses.co.ke
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. **Update paths** in config file to match your server

### Nginx

1. **Enable site:**
   ```bash
   sudo cp backend-php/nginx-production.conf /etc/nginx/sites-available/trendydresses.co.ke
   sudo ln -s /etc/nginx/sites-available/trendydresses.co.ke /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

2. **Update paths** in config file to match your server

## Health Monitoring

The setup includes automatic health monitoring:

- **Cron job** runs every 5 minutes
- **Checks** backend health
- **Restarts** if unhealthy
- **Logs** all events

**View health logs:**
```bash
tail -f backend-php/logs/health-monitor.log
```

## Verification Checklist

After setup, verify:

- [ ] Backend starts on server boot
- [ ] Backend restarts if it crashes
- [ ] Health monitoring is active
- [ ] Logs are being written
- [ ] API responds: `curl http://localhost:8000/api/health`
- [ ] Frontend can connect: `curl https://trendydresses.co.ke/api/health`

## Management Commands

### Check Status

**Supervisor:**
```bash
sudo supervisorctl status trendy-dresses-backend
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

### Restart

**Supervisor:**
```bash
sudo supervisorctl restart trendy-dresses-backend
```

**systemd:**
```bash
sudo systemctl restart trendy-dresses-backend
```

**PM2:**
```bash
pm2 restart trendy-dresses-backend
```

## Troubleshooting

### Backend Not Starting

1. **Check PHP:**
   ```bash
   php --version
   ```

2. **Check .env:**
   ```bash
   cat backend-php/.env
   ```

3. **Test manually:**
   ```bash
   cd backend-php
   php -S localhost:8000 -t .
   ```

4. **Check logs:**
   ```bash
   tail -f /var/log/trendy-dresses-backend.log
   ```

### Service Keeps Restarting

1. Check MongoDB connection
2. Check PHP errors
3. Verify file permissions
4. Test backend manually

### Port Conflicts

Change port in:
- Supervisor: `supervisor.conf`
- systemd: `.service` file
- PM2: `ecosystem.config.js`

---

**Your backend will now always run!** ✅

See `backend-php/ALWAYS_RUN_SETUP.md` for detailed instructions.

