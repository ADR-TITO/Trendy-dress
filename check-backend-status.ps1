# Check Backend Status Script (PowerShell)
# Tests if backend is running and accessible

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Backend Status Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Test 1: Local backend health
Write-Host "1. Testing local backend (localhost:3000)..." -ForegroundColor Yellow
try {
    $localResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($localResponse.StatusCode -eq 200) {
        Write-Host "✅ Local backend is running" -ForegroundColor Green
        $localResponse.Content | ConvertFrom-Json | ConvertTo-Json
    } else {
        Write-Host "❌ Local backend returned HTTP $($localResponse.StatusCode)" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "❌ Local backend is NOT running" -ForegroundColor Red
    Write-Host "   → Run: pm2 start npm --name 'trendy-dresses-api' -- start" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Test 2: Public backend health
Write-Host "2. Testing public backend (https://trendydresses.co.ke/api/health)..." -ForegroundColor Yellow
try {
    $publicResponse = Invoke-WebRequest -Uri "https://trendydresses.co.ke/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($publicResponse.StatusCode -eq 200) {
        Write-Host "✅ Public backend is accessible" -ForegroundColor Green
        $publicResponse.Content | ConvertFrom-Json | ConvertTo-Json
    } else {
        Write-Host "❌ Public backend returned HTTP $($publicResponse.StatusCode)" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "❌ Public backend is NOT accessible" -ForegroundColor Red
    Write-Host "   → Check Nginx configuration" -ForegroundColor Yellow
    Write-Host "   → Check if backend is running: pm2 list" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Test 3: MongoDB status
Write-Host "3. Testing MongoDB connection..." -ForegroundColor Yellow
try {
    $dbResponse = Invoke-WebRequest -Uri "https://trendydresses.co.ke/api/db-status" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $dbData = $dbResponse.Content | ConvertFrom-Json
    if ($dbData.readyState -eq 1) {
        Write-Host "✅ MongoDB is connected" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MongoDB is NOT connected (ReadyState: $($dbData.readyState))" -ForegroundColor Yellow
        Write-Host "   → Check MongoDB connection string in .env" -ForegroundColor Yellow
        Write-Host "   → Check MongoDB Atlas IP whitelist" -ForegroundColor Yellow
    }
    $dbData | ConvertTo-Json
} catch {
    Write-Host "❌ Could not check MongoDB status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ Backend is running and accessible!" -ForegroundColor Green
    Write-Host ""
    Write-Host "STK Push payment should work now!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend needs attention" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. See: ENSURE_BACKEND_RUNNING.md" -ForegroundColor Yellow
    Write-Host "2. Check PM2: pm2 list" -ForegroundColor Yellow
    Write-Host "3. Check logs: pm2 logs trendy-dresses-api" -ForegroundColor Yellow
    Write-Host "4. Check Nginx: sudo nginx -t" -ForegroundColor Yellow
}

