# How to Start the Backend Server

## Quick Start

1. **Open a new PowerShell or Command Prompt window**

2. **Navigate to the backend folder:**
   ```powershell
   cd "C:\Users\user\TRENDY DRESSES\backend"
   ```

3. **Start the server:**
   ```powershell
   node server.js
   ```

4. **Wait for these messages:**
   ```
   🚀 Server is running on http://localhost:3000
   ✅ Connected to MongoDB successfully
   ```

5. **Keep this window open** - Don't close it while using the website!

## Verify Server is Running

Open a new browser tab and go to:
- http://localhost:3000/api/health

You should see:
```json
{"status":"ok","message":"Trendy Dresses API is running"}
```

## If Server Won't Start

1. **Check if port 3000 is already in use:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   If you see results, kill the process:
   ```powershell
   taskkill /PID <process_id> /F
   ```

2. **Check MongoDB connection:**
   - Look for error messages in the server window
   - Verify `.env` file exists in `backend/` folder
   - Check MongoDB Atlas IP whitelist

3. **Reinstall dependencies (if needed):**
   ```powershell
   cd backend
   npm install
   ```

## Troubleshooting

### "Cannot find module" errors
Run: `npm install` in the `backend/` folder

### "Port already in use" errors
Kill existing Node processes:
```powershell
Get-Process -Name node | Stop-Process -Force
```

### MongoDB connection errors
- Check your internet connection
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `.env` file has correct `MONGODB_URI`

## Important Notes

- **Keep the server window open** while using the website
- The server must be running for MongoDB to work
- If you close the server, refresh your website and it will fall back to localStorage
