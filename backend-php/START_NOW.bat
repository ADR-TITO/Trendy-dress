@echo off
REM Quick Start Script for PHP Backend
REM This will start the backend immediately

echo ========================================
echo Starting PHP Backend
echo ========================================
echo.

REM Check if PHP is installed
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP is not installed or not in PATH
    echo.
    echo Please install PHP:
    echo   1. Download from https://www.php.net/downloads.php
    echo   2. Or use XAMPP/WAMP which includes PHP
    echo   3. Add PHP to your system PATH
    echo.
    pause
    exit /b 1
)

echo [OK] PHP found
php --version
echo.

REM Check if we're in the right directory
if not exist "index.php" (
    echo [ERROR] index.php not found!
    echo Please run this script from the backend-php folder
    pause
    exit /b 1
)

REM Check dependencies
if not exist "vendor" (
    echo [WARNING] Dependencies not installed
    echo Installing dependencies...
    echo.
    if exist "composer.json" (
        composer install
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to install dependencies
            echo Please install Composer from https://getcomposer.org/
            pause
            exit /b 1
        )
    ) else (
        echo [WARNING] composer.json not found - skipping dependency installation
    )
)

REM Check .env file
if not exist ".env" (
    echo [WARNING] .env file not found
    if exist ".env.example" (
        echo Creating .env from template...
        copy ".env.example" ".env"
        echo [OK] .env file created
        echo [IMPORTANT] Please edit .env file and add your MongoDB connection string!
    )
)

REM Create logs directory
if not exist "logs" mkdir logs

echo.
echo ========================================
echo Starting PHP Backend Server
echo ========================================
echo.
echo Server will start on: http://localhost:8000
echo API endpoints: http://localhost:8000/api
echo Health check: http://localhost:8000/api/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start PHP built-in server
php -S localhost:8000 -t .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server failed to start
    echo Check the error messages above
    pause
    exit /b 1
)

