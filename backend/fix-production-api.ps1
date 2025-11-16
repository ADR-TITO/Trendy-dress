# Fix Production API 404 Error (PowerShell)
# Run this on your production server

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fixing Production API 404 Error" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if backend is running
Write-Host "Step 1: Checking if backend is running..." -ForegroundColor Yellow

try {
    $pm2Process = pm2 list | Select-String "trendy-dresses-api"
    if ($pm2Process) {
        Write-Host "✅ Backend process exists" -ForegroundColor Green
        Write-Host "   Starting backend if not running..." -ForegroundColor Yellow
        pm2 start trendy-dresses-api 2>&1 | Out-Null
    } else {
        Write-Host "⚠️ Backend is not running. Starting..." -ForegroundColor Yellow
        Set-Location "C:\path\to\backend"  # Update this path
        pm2 start npm --name "trendy-dresses-api" -- start
        pm2 save
        Write-Host "✅ Backend started" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error checking PM2. Make sure PM2 is installed." -ForegroundColor Red
    Write-Host "   Install: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

# Step 2: Test backend locally
Write-Host ""
Write-Host "Step 2: Testing backend on localhost..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend responds on localhost:3000" -ForegroundColor Green
        $response.Content
    }
} catch {
    Write-Host "❌ Backend is not responding on localhost:3000" -ForegroundColor Red
    Write-Host "   Check backend logs: pm2 logs trendy-dresses-api" -ForegroundColor Yellow
    exit 1
}

# Step 3: Instructions for Nginx
Write-Host ""
Write-Host "Step 3: Nginx Configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to add this to your Nginx config:" -ForegroundColor Yellow
Write-Host ""
Get-Content "nginx-api-config.conf" | Write-Host
Write-Host ""
Write-Host "1. Edit your Nginx config:" -ForegroundColor Yellow
Write-Host "   sudo nano /etc/nginx/sites-available/trendydresses.co.ke" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Add the location /api block shown above" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Test Nginx config:" -ForegroundColor Yellow
Write-Host "   sudo nginx -t" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Reload Nginx:" -ForegroundColor Yellow
Write-Host "   sudo systemctl reload nginx" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Press Enter after you've configured Nginx..."

# Step 4: Test API endpoint
Write-Host ""
Write-Host "Step 4: Testing API endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $apiResponse = Invoke-WebRequest -Uri "https://trendydresses.co.ke/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "✅ API is now accessible!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Test result:" -ForegroundColor Cyan
        $apiResponse.Content
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "✅ FIX COMPLETE!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If localhost works but public URL doesn't:" -ForegroundColor Yellow
    Write-Host "  1. Check Nginx config is correct" -ForegroundColor Yellow
    Write-Host "  2. Check SSL certificate is valid" -ForegroundColor Yellow
    Write-Host "  3. Check firewall allows connections" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check Nginx error logs:" -ForegroundColor Yellow
    Write-Host "  sudo tail -f /var/log/nginx/error.log" -ForegroundColor Cyan
}

