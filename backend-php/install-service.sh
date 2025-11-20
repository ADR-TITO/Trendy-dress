#!/bin/bash
# Install PHP Backend as a systemd service
# Run with: sudo bash install-service.sh

echo "========================================"
echo "Install Trendy Dresses Backend Service"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
SERVICE_FILE="trendy-dresses-backend.service"

# Update service file with current path
sed -i "s|/var/www/trendydresses.co.ke/backend-php|$CURRENT_DIR|g" $SERVICE_FILE

# Copy service file
cp $SERVICE_FILE /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable service (start on boot)
systemctl enable trendy-dresses-backend.service

# Start service
systemctl start trendy-dresses-backend.service

# Check status
systemctl status trendy-dresses-backend.service

echo ""
echo "========================================"
echo "Service installed and started!"
echo "========================================"
echo ""
echo "Commands:"
echo "  Start:   sudo systemctl start trendy-dresses-backend"
echo "  Stop:    sudo systemctl stop trendy-dresses-backend"
echo "  Restart: sudo systemctl restart trendy-dresses-backend"
echo "  Status:  sudo systemctl status trendy-dresses-backend"
echo "  Logs:    sudo journalctl -u trendy-dresses-backend -f"
echo ""

