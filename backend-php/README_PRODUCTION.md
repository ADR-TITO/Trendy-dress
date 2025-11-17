# 🚀 Production Setup - Complete Guide

## Quick Start

**One command to set everything up:**
```bash
cd backend-php
sudo bash setup-auto-start.sh
```

## What This Does

1. ✅ **Installs dependencies** (`composer install`)
2. ✅ **Creates .env file** (from template)
3. ✅ **Sets up process manager** (Supervisor/systemd/PM2)
4. ✅ **Configures auto-start** (starts on server boot)
5. ✅ **Sets up health monitoring** (checks every 5 minutes)
6. ✅ **Configures logging** (all events logged)

## Process Managers

### Supervisor (Recommended)
```bash
sudo bash install-supervisor.sh
```

### systemd
```bash
sudo bash install-service.sh
```

### PM2
```bash
bash install-pm2.sh
```

## After Setup

**Test:**
```bash
curl http://localhost:8000/api/health
```

**Check status:**
```bash
bash check-status.sh
```

**Start production:**
```bash
bash start-production.sh
```

## Features

- ✅ **Auto-start on boot** - Backend starts automatically
- ✅ **Auto-restart on crash** - Never stays down
- ✅ **Health monitoring** - Checks every 5 minutes
- ✅ **Log management** - All events logged
- ✅ **Process monitoring** - Always know status

## Management

See `ALWAYS_RUN_SETUP.md` for complete management commands.

---

**Your backend is production-ready!** ✅

