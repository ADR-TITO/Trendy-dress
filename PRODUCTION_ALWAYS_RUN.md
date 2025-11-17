# 🔄 Production Setup - Backend Always Running

## Complete Setup Guide

This ensures your PHP backend **always runs** on your production server.

## Quick Setup (Recommended)

### One Command Setup

```bash
cd backend-php
sudo bash setup-auto-start.sh
```

**This will:**
1. ✅ Install all dependencies
2. ✅ Configure process manager
3. ✅ Setup auto-start on boot
4. ✅ Setup health monitoring
5. ✅ Configure logging

## What Gets Installed

### 1. Process Manager
Choose one:
- **Supervisor** (Recommended for Linux)
- **systemd** (Modern Linux)
- **PM2** (If Node.js available)

### 2. Health Monitor
- Cron job checks backend every 5 minutes
- Auto-restarts if unhealthy
- Logs all events

### 3. Auto-Start
- Backend starts automatically on server boot
- No manual intervention needed
- Survives server reboots

## Installation Methods

### Method 1: Supervisor (Linux - Recommended)

```bash
cd backend-php
sudo bash install-supervisor.sh
```

**Features:**
- Auto-start on boot
- Auto-restart on crash
- Log rotation
- Process monitoring

### Method 2: systemd (Linux)

```bash
cd backend-php
sudo bash install-service.sh
```

**Features:**
- Native Linux service
- System integration
- Journal logging
- Dependency management

### Method 3: PM2 (Cross-platform)

```bash
cd backend-php
bash install-pm2.sh
```

**Features:**
- Works on Linux, Mac, Windows
- Easy monitoring
- Log management

### Method 4: NSSM (Windows)

```batch
cd backend-php
install-nssm.bat
```

**Features:**
- Windows service
- Auto-start on boot
- Service management

## Verification

After installation:

```bash
# Test backend
curl http://localhost:8000/api/health

# Check status
cd backend-php
bash check-status.sh

# View logs
tail -f /var/log/trendy-dresses-backend.log
```

## Management Commands

### Start/Stop/Restart

**Supervisor:**
```bash
sudo supervisorctl start trendy-dresses-backend
sudo supervisorctl stop trendy-dresses-backend
sudo supervisorctl restart trendy-dresses-backend
```

**systemd:**
```bash
sudo systemctl start trendy-dresses-backend
sudo systemctl stop trendy-dresses-backend
sudo systemctl restart trendy-dresses-backend
```

**PM2:**
```bash
pm2 start trendy-dresses-backend
pm2 stop trendy-dresses-backend
pm2 restart trendy-dresses-backend
```

## Health Monitoring

The setup includes automatic health checks:

- **Frequency:** Every 5 minutes
- **Action:** Restarts if unhealthy
- **Logs:** All events logged

**View health logs:**
```bash
tail -f backend-php/logs/health-monitor.log
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
2. Check PHP errors in logs
3. Verify file permissions
4. Test backend manually first

---

**Your backend will now always run!** ✅

See `backend-php/ALWAYS_RUN_SETUP.md` for detailed instructions.

