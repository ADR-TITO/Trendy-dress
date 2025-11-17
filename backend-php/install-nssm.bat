@echo off
REM Install PHP Backend as Windows Service using NSSM
REM Download NSSM from: https://nssm.cc/download

echo ========================================
echo Install Backend as Windows Service (NSSM)
echo ========================================
echo.

REM Check if NSSM is available
where nssm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NSSM is not installed or not in PATH
    echo.
    echo Download NSSM from: https://nssm.cc/download
    echo Extract and add to PATH, or place nssm.exe in this folder
    pause
    exit /b 1
)

REM Get current directory
set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%

echo [1/3] Installing service...
nssm install TrendyDressesBackend "%CURRENT_DIR%\php.exe" "-S 127.0.0.1:8000 -t %CURRENT_DIR%"

echo [2/3] Setting service options...
nssm set TrendyDressesBackend AppDirectory "%CURRENT_DIR%"
nssm set TrendyDressesBackend DisplayName "Trendy Dresses Backend"
nssm set TrendyDressesBackend Description "PHP Backend API for Trendy Dresses"
nssm set TrendyDressesBackend Start SERVICE_AUTO_START
nssm set TrendyDressesBackend AppStdout "%CURRENT_DIR%\logs\service.log"
nssm set TrendyDressesBackend AppStderr "%CURRENT_DIR%\logs\service-error.log"

echo [3/3] Starting service...
nssm start TrendyDressesBackend

echo.
echo ========================================
echo Service installed and started!
echo ========================================
echo.
echo Commands:
echo   Start:   nssm start TrendyDressesBackend
echo   Stop:    nssm stop TrendyDressesBackend
echo   Restart: nssm restart TrendyDressesBackend
echo   Status:  nssm status TrendyDressesBackend
echo   Remove:  nssm remove TrendyDressesBackend
echo.

pause

