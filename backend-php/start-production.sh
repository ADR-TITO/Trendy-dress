#!/bin/bash
# Start Backend in Production Mode
# This script starts the backend with proper configuration

echo "========================================"
echo "Starting Trendy Dresses Backend"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    if [ -f ".env.example" ]; then
        echo "Creating .env from template..."
        cp .env.example .env
        echo "✅ .env created. Please edit it and add your MongoDB connection string!"
        exit 1
    else
        echo "❌ .env.example not found. Cannot proceed."
        exit 1
    fi
fi

# Check if vendor exists
if [ ! -d "vendor" ]; then
    echo "⚠️  Dependencies not installed!"
    echo "Installing dependencies..."
    composer install --no-dev
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create logs directory
mkdir -p logs

# Start backend
echo "Starting PHP backend on http://127.0.0.1:8000..."
echo ""

# Use process manager if available
if command -v supervisorctl &> /dev/null; then
    echo "Using Supervisor..."
    sudo supervisorctl start trendy-dresses-backend
elif systemctl is-active --quiet trendy-dresses-backend 2>/dev/null; then
    echo "Using systemd..."
    sudo systemctl start trendy-dresses-backend
elif command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 start ecosystem.config.js
else
    echo "No process manager found. Starting directly..."
    echo "⚠️  For production, use a process manager (Supervisor/systemd/PM2)"
    echo ""
    php -S 127.0.0.1:8000 -t .
fi

echo ""
echo "✅ Backend started!"
echo "Test: curl http://localhost:8000/api/health"
echo ""

