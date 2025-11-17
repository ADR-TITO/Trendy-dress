#!/bin/bash
# Complete Setup Script - Auto-start Backend
# This script sets up everything needed for the backend to always run

echo "========================================"
echo "Trendy Dresses Backend - Auto-Start Setup"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Some steps require root. Running with sudo..."
    SUDO="sudo"
else
    SUDO=""
fi

CURRENT_DIR=$(pwd)

echo "[1/5] Checking prerequisites..."
echo ""

# Check PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed!"
    echo "Install PHP: sudo apt-get install php"
    exit 1
fi
echo "✅ PHP: $(php --version | head -n 1)"

# Check Composer
if ! command -v composer &> /dev/null; then
    echo "⚠️  Composer not found. Installing..."
    curl -sS https://getcomposer.org/installer | php
    $SUDO mv composer.phar /usr/local/bin/composer
fi
echo "✅ Composer: $(composer --version)"

echo ""
echo "[2/5] Installing dependencies..."
if [ ! -d "vendor" ]; then
    composer install --no-dev
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "[3/5] Setting up .env file..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from template"
        echo "⚠️  IMPORTANT: Edit .env file and add your MongoDB connection string!"
    else
        echo "⚠️  .env.example not found. Creating basic .env..."
        echo "MONGODB_URI=" > .env
    fi
else
    echo "✅ .env file exists"
fi

echo ""
echo "[4/5] Setting up process manager..."
echo ""
echo "Choose a process manager:"
echo "  1) Supervisor (Recommended for production)"
echo "  2) systemd (Modern Linux)"
echo "  3) PM2 (If Node.js is installed)"
echo "  4) Skip (Manual setup)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Setting up Supervisor..."
        $SUDO bash install-supervisor.sh
        ;;
    2)
        echo "Setting up systemd..."
        $SUDO bash install-service.sh
        ;;
    3)
        echo "Setting up PM2..."
        bash install-pm2.sh
        ;;
    4)
        echo "Skipping process manager setup"
        echo "See ALWAYS_RUN_SETUP.md for manual setup"
        ;;
    *)
        echo "Invalid choice. Skipping..."
        ;;
esac

echo ""
echo "[5/5] Setting up health monitoring..."
# Create cron job for health monitoring
CRON_JOB="*/5 * * * * cd $CURRENT_DIR && php health-monitor.php"
(crontab -l 2>/dev/null | grep -v "health-monitor.php"; echo "$CRON_JOB") | crontab -
echo "✅ Health monitoring cron job added (checks every 5 minutes)"

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Your backend is now configured to:"
echo "  ✅ Auto-start on server boot"
echo "  ✅ Auto-restart if it crashes"
echo "  ✅ Monitor health every 5 minutes"
echo ""
echo "Test: curl http://localhost:8000/api/health"
echo ""

