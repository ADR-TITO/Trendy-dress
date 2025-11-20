# Upload Backend to Production Server
# This script helps you upload the backend folder to your production server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Upload Backend to Production Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get server details
$serverIP = Read-Host "Enter your server IP address or hostname"
$serverUser = Read-Host "Enter your SSH username"
$serverPath = Read-Host "Enter server path (e.g., /var/www/trendydresses.co.ke)" -Default "/var/www/trendydresses.co.ke"

Write-Host ""
Write-Host "Server Details:" -ForegroundColor Yellow
Write-Host "  IP/Hostname: $serverIP"
Write-Host "  Username: $serverUser"
Write-Host "  Path: $serverPath"
Write-Host ""

$confirm = Read-Host "Continue with upload? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Upload cancelled." -ForegroundColor Yellow
    exit
}

# Check if SCP is available (Git Bash or OpenSSH)
$scpAvailable = $false
if (Get-Command scp -ErrorAction SilentlyContinue) {
    $scpAvailable = $true
    Write-Host "✅ SCP found - using SCP to upload" -ForegroundColor Green
} else {
    Write-Host "⚠️ SCP not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can:" -ForegroundColor Yellow
    Write-Host "1. Install Git for Windows (includes SCP)"
    Write-Host "2. Use FileZilla (FTP client)"
    Write-Host "3. Use cPanel File Manager"
    Write-Host ""
    Write-Host "Manual upload instructions:" -ForegroundColor Cyan
    Write-Host "  Upload the 'backend' folder to: $serverPath/backend/"
    Write-Host ""
    exit
}

# Upload backend folder
Write-Host ""
Write-Host "📤 Uploading backend folder..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend folder not found at: $backendPath" -ForegroundColor Red
    exit 1
}

# Build SCP command
$scpCommand = "scp -r `"$backendPath`" ${serverUser}@${serverIP}:${serverPath}/"

Write-Host "Running: $scpCommand" -ForegroundColor Gray
Write-Host ""

try {
    # Execute SCP command
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Upload successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. SSH into your server: ssh ${serverUser}@${serverIP}"
        Write-Host "2. Navigate to: cd ${serverPath}/backend"
        Write-Host "3. Run: npm install"
        Write-Host "4. Create .env file: nano .env"
        Write-Host "5. Start backend: pm2 start npm --name 'trendy-dresses-api' -- start"
        Write-Host ""
        Write-Host "See DEPLOY_NOW.md for complete instructions"
    } else {
        Write-Host ""
        Write-Host "❌ Upload failed. Check your credentials and server access." -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative methods:" -ForegroundColor Yellow
        Write-Host "1. Use FileZilla (FTP client)"
        Write-Host "2. Use cPanel File Manager"
        Write-Host "3. Use Git to clone/pull on server"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error during upload: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manual upload using FileZilla or cPanel File Manager" -ForegroundColor Yellow
}

