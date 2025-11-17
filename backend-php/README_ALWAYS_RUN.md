# 🔄 Keep Backend Always Running

## Quick Setup

### For Production Server (Linux)

**Easiest method - Run setup script:**
```bash
cd backend-php
sudo bash setup-auto-start.sh
```

This will:
1. ✅ Check prerequisites
2. ✅ Install dependencies
3. ✅ Setup .env file
4. ✅ Configure process manager (Supervisor/systemd/PM2)
5. ✅ Setup health monitoring

### Manual Setup

**Option 1: Supervisor (Recommended)**
```bash
sudo bash install-supervisor.sh
```

**Option 2: systemd**
```bash
sudo bash install-service.sh
```

**Option 3: PM2**
```bash
bash install-pm2.sh
```

## What Gets Installed

### Process Manager
- **Supervisor** or **systemd** or **PM2**
- Auto-starts backend on server boot
- Auto-restarts if backend crashes
- Manages logs

### Health Monitor
- Cron job runs every 5 minutes
- Checks backend health
- Restarts if unhealthy
- Logs all events

## Verification

After setup:

```bash
# Check if running
curl http://localhost:8000/api/health

# Check process status
# Supervisor:
sudo supervisorctl status

# systemd:
sudo systemctl status trendy-dresses-backend

# PM2:
pm2 status
```

## Commands

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

## Logs

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

**Health Monitor:**
```bash
tail -f logs/health-monitor.log
```

## Auto-Start on Boot

All methods automatically start on server boot:
- ✅ No manual intervention needed
- ✅ Backend starts before web server
- ✅ Survives server reboots

## Troubleshooting

### Backend Not Starting

1. **Check PHP:**
   ```bash
   php --version
   ```

2. **Check .env file:**
   ```bash
   cat .env
   ```

3. **Test manually:**
   ```bash
   php -S localhost:8000 -t .
   ```

4. **Check logs:**
   ```bash
   tail -f /var/log/trendy-dresses-backend.log
   ```

### Service Keeps Restarting

1. Check MongoDB connection in `.env`
2. Check PHP errors in logs
3. Verify file permissions
4. Test backend manually first

---

**Your backend will now always run!** ✅

See `ALWAYS_RUN_SETUP.md` for detailed instructions.

