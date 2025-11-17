@echo off
echo ========================================
echo Start PHP Backend (Local Development)
echo ========================================
echo.

REM Check if PHP is installed
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP is not installed or not in PATH
    echo Please install PHP from https://www.php.net/downloads.php
    echo Or use XAMPP/WAMP which includes PHP
    pause
    exit /b 1
)

echo [1/3] Checking PHP version...
php --version
echo.

echo [2/3] Checking if dependencies are installed...
if not exist "vendor" (
    echo [WARNING] vendor folder not found!
    echo Installing dependencies...
    call composer install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        echo Please install Composer from https://getcomposer.org/
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
) else (
    echo [OK] Dependencies found
)
echo.

echo [3/3] Starting PHP built-in server...
echo.
echo ========================================
echo Server starting on http://localhost:8000
echo API endpoints: http://localhost:8000/api
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

