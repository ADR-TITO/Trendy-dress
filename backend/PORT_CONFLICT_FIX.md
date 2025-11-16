# Port Conflict (EADDRINUSE) Error Fix

## Problem
When starting the backend server, you may encounter:
```
Error: listen EADDRINUSE: address already in use :::3000
```

This happens when port 3000 is already being used by another process.

## Solutions Implemented

### 1. **Automatic Port Detection** (Recommended)
The server now automatically detects if port 3000 is in use and finds an available port:
- Checks if port 3000 is available
- If not, automatically tries ports 3001, 3002, 3003, etc. (up to 10 attempts)
- Starts the server on the first available port
- Logs a warning if using a different port

**Usage:**
```bash
cd backend
npm start
```

The server will automatically handle port conflicts.

### 2. **Manual Port Killer Script**
Kill the process using port 3000 before starting:

**Windows:**
```bash
cd backend
npm run kill-port:3000
# or
node kill-port.js 3000
```

**Linux/Mac:**
```bash
cd backend
node kill-port.js 3000
```

### 3. **Start Scripts with Port Check**
The `start-backend.ps1` and `start-backend.bat` scripts now:
- Check if port 3000 is in use
- Prompt you to kill the process
- Automatically find an available port if you choose not to kill

**Usage:**
```powershell
# PowerShell
.\start-backend.ps1
```

```cmd
# Command Prompt
start-backend.bat
```

## How It Works

### Port Checker (`utils/port-checker.js`)
- Uses Node.js `net` module to check port availability
- Tries to create a temporary server on the port
- If successful, port is available; if error, port is in use

### Port Killer (`kill-port.js`)
- **Windows**: Uses `netstat` to find PID, then `taskkill` to kill process
- **Linux/Mac**: Uses `lsof` to find PID, then `kill -9` to kill process

## Manual Port Change

If you want to use a different port permanently:

1. Edit `backend/.env`:
```env
PORT=3001
```

2. Or set environment variable:
```bash
# Windows
set PORT=3001
npm start

# Linux/Mac
PORT=3001 npm start
```

## Troubleshooting

### Server starts on different port
If the server starts on port 3001 instead of 3000:
- Update your frontend `api-service.js` to use the new port
- Or kill the process on port 3000 and restart

### Can't find process to kill
1. Check what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Kill manually:
   ```bash
   # Windows (replace PID with actual process ID)
   taskkill /F /PID <PID>
   
   # Linux/Mac
   kill -9 <PID>
   ```

### Multiple Node processes
If you have multiple Node.js processes:
```bash
# Windows - Kill all Node processes
taskkill /F /IM node.exe

# Linux/Mac - Kill all Node processes
pkill -9 node
```

## Best Practices

1. **Always stop the server properly**: Use `Ctrl+C` to stop the server
2. **Use PM2 in production**: PM2 manages processes and ports better
3. **Check before starting**: Use `npm run kill-port:3000` if you're unsure
4. **Use different ports for dev/prod**: Use port 3000 for dev, 3001 for staging, etc.

## Example Output

When port 3000 is in use:
```
⚠️ Port 3000 is already in use
🔍 Attempting to find an available port...
✅ Found available port: 3001
🚀 Server is running on http://localhost:3001
⚠️ Note: Server is running on port 3001 instead of 3000
⚠️ Update your frontend API_BASE_URL if needed
```

