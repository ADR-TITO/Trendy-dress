#!/bin/bash
# Install PHP Backend with Supervisor
# Run with: sudo bash install-supervisor.sh

echo "========================================"
echo "Install Backend with Supervisor"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install supervisor if not installed
if ! command -v supervisorctl &> /dev/null; then
    echo "Installing Supervisor..."
    apt-get update
    apt-get install -y supervisor
fi

# Get current directory (absolute path)
CURRENT_DIR=$(cd "$(dirname "$0")" && pwd)
CONF_FILE="supervisor.conf"

# Update config with current path
sed -i "s|/var/www/trendydresses.co.ke/backend-php|$CURRENT_DIR|g" $CONF_FILE

# Copy config
cp $CONF_FILE /etc/supervisor/conf.d/trendy-dresses-backend.conf

# Create log directory
mkdir -p /var/log
touch /var/log/trendy-dresses-backend.log
chmod 644 /var/log/trendy-dresses-backend.log

# Reload supervisor
supervisorctl reread
supervisorctl update
supervisorctl start trendy-dresses-backend

echo ""
echo "========================================"
echo "Supervisor configured!"
echo "========================================"
echo ""
echo "Commands:"
echo "  Start:   sudo supervisorctl start trendy-dresses-backend"
echo "  Stop:    sudo supervisorctl stop trendy-dresses-backend"
echo "  Restart: sudo supervisorctl restart trendy-dresses-backend"
echo "  Status:  sudo supervisorctl status trendy-dresses-backend"
echo "  Logs:    tail -f /var/log/trendy-dresses-backend.log"
echo ""

