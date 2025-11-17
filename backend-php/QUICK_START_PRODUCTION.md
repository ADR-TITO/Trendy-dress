# 🚀 Quick Start - Production (Backend Always Running)

## One-Command Setup

```bash
cd backend-php
sudo bash setup-auto-start.sh
```

**That's it!** Your backend will:
- ✅ Auto-start on server boot
- ✅ Auto-restart if crashes
- ✅ Monitor health every 5 minutes
- ✅ Always be available

## What the Script Does

1. ✅ Checks PHP and Composer
2. ✅ Installs dependencies
3. ✅ Creates .env file
4. ✅ Sets up process manager (Supervisor/systemd/PM2)
5. ✅ Configures health monitoring

## After Setup

**Test:**
```bash
curl http://localhost:8000/api/health
```

**Check status:**
```bash
bash check-status.sh
```

**View logs:**
```bash
tail -f /var/log/trendy-dresses-backend.log
```

## Management

**Start:**
```bash
# Supervisor
sudo supervisorctl start trendy-dresses-backend

# systemd
sudo systemctl start trendy-dresses-backend

# PM2
pm2 start trendy-dresses-backend
```

**Restart:**
```bash
# Supervisor
sudo supervisorctl restart trendy-dresses-backend

# systemd
sudo systemctl restart trendy-dresses-backend

# PM2
pm2 restart trendy-dresses-backend
```

---

**Your backend is now production-ready!** ✅

