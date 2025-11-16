@echo off
echo ========================================
echo Trendy Dresses Backend Server Starter
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js version...
node --version
echo.

echo [2/4] Checking if dependencies are installed...
if not exist "node_modules" (
    echo [WARNING] node_modules folder not found!
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
) else (
    echo [OK] Dependencies found
)
echo.

echo [3/4] Checking .env file...
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating .env from template...
    if exist "ENV_TEMPLATE.txt" (
        copy "ENV_TEMPLATE.txt" ".env" >nul
        echo [OK] .env file created from template
        echo [IMPORTANT] Please edit .env file and add your MongoDB connection string!
        echo.
        pause
    ) else (
        echo [ERROR] ENV_TEMPLATE.txt not found!
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file found
)
echo.

echo [4/4] Starting backend server...
echo.
echo ========================================
echo Server starting on http://localhost:3000
echo API endpoints: http://localhost:3000/api
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server failed to start
    echo Check the error messages above
    pause
    exit /b 1
)

