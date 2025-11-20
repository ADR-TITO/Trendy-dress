# Node.js Backend Removed

## What Was Removed

The entire `backend/` folder (Node.js/Express backend) has been removed from the project.

## Current Backend

**Only PHP backend remains:**
- Location: `backend-php/`
- Technology: PHP 7.4+ with MongoDB
- Deployment: Via web server (Apache/Nginx)

## Changes Made

### Code Updates
- ✅ `api-service.js` - Removed Node.js fallback, PHP only
- ✅ `script.js` - Updated error messages to mention PHP only
- ✅ `README.md` - Removed all Node.js references
- ✅ `.gitignore` - Removed Node.js exclusions

### Files Deleted
- ✅ `backend/` folder (entire Node.js backend)
- ✅ All Node.js dependencies and scripts

## Migration Notes

If you were using the Node.js backend:

1. **Deploy PHP backend instead:**
   ```bash
   cd backend-php
   composer install
   cp .env.example .env
   # Configure .env with MongoDB connection
   ```

2. **Configure web server** to route `/api` to PHP

3. **Test:**
   ```bash
   curl https://trendydresses.co.ke/api/health
   ```

## Benefits

- ✅ Simpler codebase (one backend only)
- ✅ Better hosting compatibility (most hosts support PHP)
- ✅ No separate server process needed
- ✅ Easier deployment (just upload files)

---

**The project now uses PHP backend exclusively.** 🚀

