# PowerShell Script to Start PHP Backend (Local Development)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Start PHP Backend (Local Development)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PHP is installed
try {
    $phpVersion = php --version
    Write-Host "[1/4] Checking PHP version..." -ForegroundColor Yellow
    Write-Host "      $phpVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] PHP is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PHP from https://www.php.net/downloads.php" -ForegroundColor Red
    Write-Host "Or use XAMPP/WAMP which includes PHP" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check if Composer is installed
Write-Host "[2/4] Checking Composer..." -ForegroundColor Yellow
try {
    $composerVersion = composer --version
    Write-Host "      $composerVersion" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Composer not found" -ForegroundColor Yellow
    Write-Host "Dependencies may not be installed" -ForegroundColor Yellow
}
Write-Host ""

# Check if dependencies are installed
Write-Host "[3/4] Checking if dependencies are installed..." -ForegroundColor Yellow
if (-not (Test-Path "vendor")) {
    Write-Host "[WARNING] vendor folder not found!" -ForegroundColor Yellow
    if (Get-Command composer -ErrorAction SilentlyContinue) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        composer install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Composer not available - skipping dependency installation" -ForegroundColor Yellow
        Write-Host "Install Composer from https://getcomposer.org/" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Dependencies found" -ForegroundColor Green
}
Write-Host ""

# Check .env file
Write-Host "[4/4] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found!" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from template..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] .env file created from template" -ForegroundColor Green
        Write-Host "[IMPORTANT] Please edit .env file and add your MongoDB connection string!" -ForegroundColor Yellow
    } else {
        Write-Host "[WARNING] .env.example not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] .env file found" -ForegroundColor Green
}
Write-Host ""

# Start the server
Write-Host "Starting PHP built-in server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server starting on http://localhost:8000" -ForegroundColor Green
Write-Host "API endpoints: http://localhost:8000/api" -ForegroundColor Green
Write-Host "Health check: http://localhost:8000/api/health" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

php -S localhost:8000 -t .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Server failed to start" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

