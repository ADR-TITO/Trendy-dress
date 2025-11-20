@echo off
REM Start PHP Backend in Production Mode (Windows)
REM For Windows, use Task Scheduler or NSSM to keep it running

echo ========================================
echo Start PHP Backend (Production)
echo ========================================
echo.

REM Check if PHP is installed
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP is not installed or not in PATH
    pause
    exit /b 1
)

REM Check .env file
if not exist ".env" (
    echo [WARNING] .env file not found!
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo [OK] .env file created from template
        echo [IMPORTANT] Please edit .env file and add your MongoDB connection string!
    )
)

REM Check dependencies
if not exist "vendor" (
    echo [WARNING] Dependencies not installed!
    echo Installing dependencies...
    composer install --no-dev
)

REM Create logs directory
if not exist "logs" mkdir logs

echo.
echo Starting PHP backend on http://127.0.0.1:8000...
echo.
echo ========================================
echo Server running on http://127.0.0.1:8000
echo API endpoints: http://127.0.0.1:8000/api
echo Press Ctrl+C to stop the server
echo ========================================
echo.
echo NOTE: For production, use a process manager:
echo   - NSSM (Non-Sucking Service Manager)
echo   - Task Scheduler (Windows)
echo   - Or run this script as a Windows Service
echo.

php -S 127.0.0.1:8000 -t .

