#!/bin/bash
# Install PHP Backend with PM2
# Run with: bash install-pm2.sh

echo "========================================"
echo "Install Backend with PM2"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Get current directory (absolute path)
CURRENT_DIR=$(cd "$(dirname "$0")" && pwd)

# Update ecosystem config with current path
sed -i "s|/var/www/trendydresses.co.ke/backend-php|$CURRENT_DIR|g" ecosystem.config.js

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "========================================"
echo "PM2 configured!"
echo "========================================"
echo ""
echo "Commands:"
echo "  Start:   pm2 start trendy-dresses-backend"
echo "  Stop:    pm2 stop trendy-dresses-backend"
echo "  Restart: pm2 restart trendy-dresses-backend"
echo "  Status:  pm2 status"
echo "  Logs:    pm2 logs trendy-dresses-backend"
echo ""

