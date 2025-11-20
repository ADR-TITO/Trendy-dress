# PowerShell Script to Prepare backend-php for Upload
# This script creates a ZIP file ready for upload

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Prepare backend-php for Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend-php folder exists
if (-not (Test-Path "backend-php")) {
    Write-Host "[ERROR] backend-php folder not found!" -ForegroundColor Red
    Write-Host "Please ensure you're in the project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Checking backend-php folder..." -ForegroundColor Yellow
$requiredFiles = @(
    "backend-php\index.php",
    "backend-php\.htaccess",
    "backend-php\composer.json",
    "backend-php\config\database.php"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "[WARNING] Missing required files:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
} else {
    Write-Host "[OK] All required files found" -ForegroundColor Green
}
Write-Host ""

# Create ZIP file
Write-Host "[2/3] Creating ZIP file..." -ForegroundColor Yellow
$zipPath = "backend-php.zip"

# Remove existing ZIP if it exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "  Removed existing ZIP file" -ForegroundColor Yellow
}

# Create ZIP
try {
    Compress-Archive -Path "backend-php\*" -DestinationPath $zipPath -Force
    Write-Host "[OK] ZIP file created: $zipPath" -ForegroundColor Green
    
    # Get file size
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "  Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Failed to create ZIP file: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Create upload instructions
Write-Host "[3/3] Creating upload instructions..." -ForegroundColor Yellow
$instructions = @"
========================================
UPLOAD INSTRUCTIONS
========================================

1. Upload the file: backend-php.zip
   To your website root directory (same as index.html)

2. Extract the ZIP file on your server:
   - Via cPanel: Right-click → Extract
   - Via SSH: unzip backend-php.zip

3. After extraction, you should have:
   /your-website-root/backend-php/
   ├── index.php
   ├── .htaccess
   ├── composer.json
   └── ...

4. Next steps:
   - Run: composer install (in backend-php folder)
   - Create .env file with MongoDB connection string
   - Test: curl https://trendydresses.co.ke/api/health

See: UPLOAD_BACKEND_PHP.md for detailed instructions

========================================
"@

$instructions | Out-File -FilePath "UPLOAD_INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "[OK] Instructions saved to: UPLOAD_INSTRUCTIONS.txt" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Ready for Upload!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  📦 backend-php.zip" -ForegroundColor Cyan
Write-Host "  📄 UPLOAD_INSTRUCTIONS.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Upload backend-php.zip to your server" -ForegroundColor White
Write-Host "  2. Extract on server" -ForegroundColor White
Write-Host "  3. Follow UPLOAD_INSTRUCTIONS.txt" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"

