# Trendy Dresses Backend Server Starter (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Trendy Dresses Backend Server Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[1/4] Checking Node.js version..." -ForegroundColor Yellow
    Write-Host "      Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check if dependencies are installed
Write-Host "[2/4] Checking if dependencies are installed..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARNING] node_modules folder not found!" -ForegroundColor Yellow
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencies found" -ForegroundColor Green
}
Write-Host ""

# Check .env file
Write-Host "[3/4] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found!" -ForegroundColor Yellow
    if (Test-Path "ENV_TEMPLATE.txt") {
        Write-Host "Creating .env from template..." -ForegroundColor Yellow
        Copy-Item "ENV_TEMPLATE.txt" ".env"
        Write-Host "[OK] .env file created from template" -ForegroundColor Green
        Write-Host "[IMPORTANT] Please edit .env file and add your MongoDB connection string!" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to continue after editing .env file"
    } else {
        Write-Host "[ERROR] ENV_TEMPLATE.txt not found!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[OK] .env file found" -ForegroundColor Green
}
Write-Host ""

# Check if port 3001 is in use and optionally kill it
Write-Host "[4/5] Checking if port 3001 is available..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":3001.*LISTENING"
if ($portCheck) {
    Write-Host "[WARNING] Port 3001 is already in use!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to kill the process using port 3001? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Killing process on port 3001..." -ForegroundColor Yellow
        node kill-port.js 3001
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[INFO] Server will attempt to find an available port automatically" -ForegroundColor Cyan
    }
} else {
    Write-Host "[OK] Port 3001 is available" -ForegroundColor Green
}
Write-Host ""

# Start the server
Write-Host "[5/5] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server starting on http://localhost:3001" -ForegroundColor Green
Write-Host "API endpoints: http://localhost:3001/api" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

node server.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Server failed to start" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

