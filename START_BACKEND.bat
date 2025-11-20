@echo off
echo ========================================
echo Starting PHP Backend Server
echo ========================================
echo.

cd backend-php

echo Starting server on http://localhost:8000
echo API will be available at http://localhost:8000/api
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

php -S localhost:8000 -t .

pause

