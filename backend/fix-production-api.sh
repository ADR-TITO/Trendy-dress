#!/bin/bash

# Fix Production API 404 Error
# This script sets up the backend API on your production server

echo "=========================================="
echo "Fixing Production API 404 Error"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if backend is running
echo "Step 1: Checking if backend is running..."
if pm2 list | grep -q "trendy-dresses-api"; then
    STATUS=$(pm2 list | grep "trendy-dresses-api" | awk '{print $10}')
    if [ "$STATUS" = "online" ]; then
        echo -e "${GREEN}✅ Backend is running${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend exists but is not online. Starting...${NC}"
        pm2 start trendy-dresses-api
    fi
else
    echo -e "${YELLOW}⚠️ Backend is not running. Starting...${NC}"
    cd /var/www/trendydresses.co.ke/backend || cd $(dirname "$0")
    pm2 start npm --name "trendy-dresses-api" -- start
    pm2 save
    echo -e "${GREEN}✅ Backend started${NC}"
fi

# Step 2: Test backend locally
echo ""
echo "Step 2: Testing backend on localhost..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend responds on localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend is not responding on localhost:3000${NC}"
    echo "   Check backend logs: pm2 logs trendy-dresses-api"
    exit 1
fi

# Step 3: Check Nginx configuration
echo ""
echo "Step 3: Checking Nginx configuration..."

NGINX_CONFIG="/etc/nginx/sites-available/trendydresses.co.ke"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}⚠️ Nginx config not found at $NGINX_CONFIG${NC}"
    echo "   Please provide the path to your Nginx config file"
    read -p "Nginx config path: " NGINX_CONFIG
fi

if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${RED}❌ Nginx config file not found${NC}"
    exit 1
fi

# Check if /api location already exists
if grep -q "location /api" "$NGINX_CONFIG"; then
    echo -e "${YELLOW}⚠️ /api location already exists in Nginx config${NC}"
    echo "   Checking if it's configured correctly..."
    
    if grep -q "proxy_pass http://localhost:3000" "$NGINX_CONFIG"; then
        echo -e "${GREEN}✅ Nginx config looks correct${NC}"
    else
        echo -e "${RED}❌ /api location exists but proxy_pass is incorrect${NC}"
        echo "   Please check your Nginx config manually"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ /api location not found in Nginx config${NC}"
    echo "   You need to add it manually:"
    echo ""
    echo "   Add this to your server block in $NGINX_CONFIG:"
    echo ""
    cat nginx-api-config.conf
    echo ""
    read -p "Press Enter after you've added the configuration..."
fi

# Step 4: Test Nginx configuration
echo ""
echo "Step 4: Testing Nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo "   Please fix the errors shown above"
    exit 1
fi

# Step 5: Reload Nginx
echo ""
echo "Step 5: Reloading Nginx..."
if sudo systemctl reload nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload Nginx${NC}"
    exit 1
fi

# Step 6: Test API endpoint
echo ""
echo "Step 6: Testing API endpoint..."
sleep 2  # Wait a moment for Nginx to reload

if curl -s https://trendydresses.co.ke/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ API is now accessible!${NC}"
    echo ""
    echo "Test result:"
    curl -s https://trendydresses.co.ke/api/health
    echo ""
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ FIX COMPLETE!"
    echo "==========================================${NC}"
    echo ""
    echo "Your API is now accessible at:"
    echo "  https://trendydresses.co.ke/api/health"
    echo ""
else
    echo -e "${YELLOW}⚠️ API test failed. Checking...${NC}"
    echo ""
    echo "Testing localhost:"
    curl -s http://localhost:3000/api/health
    echo ""
    echo "If localhost works but public URL doesn't, check:"
    echo "  1. Nginx config is correct"
    echo "  2. SSL certificate is valid"
    echo "  3. Firewall allows connections"
    echo ""
    echo "Check Nginx error logs:"
    echo "  sudo tail -f /var/log/nginx/error.log"
fi

