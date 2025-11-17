#!/bin/bash
# Check Backend Status
# Run: bash check-status.sh

echo "========================================"
echo "Backend Status Check"
echo "========================================"
echo ""

# Check if backend is running
echo "[1/4] Checking if backend is running..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend is running"
    curl -s http://localhost:8000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/api/health
else
    echo "❌ Backend is NOT running"
fi
echo ""

# Check process manager
echo "[2/4] Checking process manager..."

# Supervisor
if command -v supervisorctl &> /dev/null; then
    echo "Supervisor:"
    sudo supervisorctl status trendy-dresses-backend 2>/dev/null || echo "  Not managed by Supervisor"
fi

# systemd
if systemctl list-units --type=service | grep -q trendy-dresses-backend; then
    echo "systemd:"
    sudo systemctl status trendy-dresses-backend --no-pager -l
fi

# PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q trendy-dresses-backend; then
        echo "PM2:"
        pm2 status | grep trendy-dresses-backend
    fi
fi

echo ""

# Check MongoDB connection
echo "[3/4] Checking MongoDB connection..."
if curl -s http://localhost:8000/api/db-status > /dev/null; then
    echo "MongoDB Status:"
    curl -s http://localhost:8000/api/db-status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/api/db-status
else
    echo "⚠️  Cannot check MongoDB status (backend not running)"
fi
echo ""

# Check logs
echo "[4/4] Recent log entries..."
if [ -f "/var/log/trendy-dresses-backend.log" ]; then
    echo "Last 5 lines:"
    tail -n 5 /var/log/trendy-dresses-backend.log
elif [ -f "logs/keep-alive.log" ]; then
    echo "Last 5 lines from keep-alive:"
    tail -n 5 logs/keep-alive.log
else
    echo "No log files found"
fi

echo ""
echo "========================================"

