# 🔄 Setup Backend to Always Run

## Quick Start (One Command)

```bash
cd backend-php
sudo bash setup-auto-start.sh
```

**That's it!** Your backend will:
- ✅ Auto-start on server boot
- ✅ Auto-restart if crashes
- ✅ Monitor health every 5 minutes
- ✅ Always be available

## What Gets Installed

### 1. Process Manager
Choose one:
- **Supervisor** (Recommended)
- **systemd** (Modern Linux)
- **PM2** (If Node.js available)

### 2. Health Monitor
- Checks backend every 5 minutes
- Auto-restarts if unhealthy
- Logs all events

### 3. Auto-Start
- Starts automatically on server boot
- No manual intervention needed

## Installation Methods

### Method 1: Complete Setup (Recommended)
```bash
cd backend-php
sudo bash setup-auto-start.sh
```

### Method 2: Supervisor Only
```bash
cd backend-php
sudo bash install-supervisor.sh
```

### Method 3: systemd Only
```bash
cd backend-php
sudo bash install-service.sh
```

### Method 4: PM2 Only
```bash
cd backend-php
bash install-pm2.sh
```

## Verification

After installation:

```bash
# Test backend
curl http://localhost:8000/api/health

# Check status
cd backend-php
bash check-status.sh
```

## Management

**Start:**
```bash
sudo supervisorctl start trendy-dresses-backend
# OR
sudo systemctl start trendy-dresses-backend
# OR
pm2 start trendy-dresses-backend
```

**Restart:**
```bash
sudo supervisorctl restart trendy-dresses-backend
# OR
sudo systemctl restart trendy-dresses-backend
# OR
pm2 restart trendy-dresses-backend
```

**Status:**
```bash
sudo supervisorctl status trendy-dresses-backend
# OR
sudo systemctl status trendy-dresses-backend
# OR
pm2 status
```

## Files Created

- `supervisor.conf` - Supervisor configuration
- `trendy-dresses-backend.service` - systemd service
- `ecosystem.config.js` - PM2 configuration
- `health-monitor.php` - Health monitoring script
- `keep-alive.php` - Keep-alive script
- `setup-auto-start.sh` - Complete setup script
- `install-*.sh` - Individual installation scripts
- `check-status.sh` - Status checking script

## Documentation

- `ALWAYS_RUN_SETUP.md` - Detailed setup guide
- `README_ALWAYS_RUN.md` - Quick reference
- `QUICK_START_PRODUCTION.md` - Quick start guide
- `COMPLETE_PRODUCTION_SETUP.md` - Complete guide

---

**Your backend will now always run!** ✅

