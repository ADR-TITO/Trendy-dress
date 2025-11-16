# ⚡ Quick Backend Check

## Test Backend Status

**From your browser or terminal, test:**

```
https://trendydresses.co.ke/api/health
```

**Expected response:**
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

## If Backend is NOT Running

### On Windows (Local Testing):
```powershell
.\check-backend-status.ps1
```

### On Linux/Mac (Production Server):
```bash
bash check-backend-status.sh
```

## Quick Fix Commands

**SSH into your server and run:**
```bash
cd /var/www/trendydresses.co.ke/backend
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save
```

**Check if running:**
```bash
pm2 list
curl http://localhost:3000/api/health
```

## Full Guide

See **ENSURE_BACKEND_RUNNING.md** for complete setup instructions.

