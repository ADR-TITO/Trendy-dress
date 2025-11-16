#!/bin/bash
# One-Command Backend Deployment Script
# Run this on your production server: bash deploy.sh

set -e  # Exit on error

echo "========================================"
echo "🚀 Trendy Dresses Backend Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Install Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env file not found!${NC}"
    if [ -f ENV_TEMPLATE.txt ]; then
        echo "Creating .env from template..."
        cp ENV_TEMPLATE.txt .env
        echo -e "${GREEN}✅ .env created${NC}"
        echo ""
        echo -e "${YELLOW}⚠️ IMPORTANT: Edit .env and add your MongoDB connection string!${NC}"
        echo "   Run: nano .env"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo -e "${RED}❌ ENV_TEMPLATE.txt not found!${NC}"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
    echo ""
fi

# Stop existing instance if running
pm2 delete trendy-dresses-api 2>/dev/null || true

# Start backend
echo "🚀 Starting backend..."
pm2 start npm --name "trendy-dresses-api" -- start
pm2 save

echo -e "${GREEN}✅ Backend started with PM2${NC}"
echo ""

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test backend
echo "🔍 Testing backend..."
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is running!${NC}"
    echo ""
    echo "📊 PM2 Status:"
    pm2 list
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure Nginx reverse proxy (see PRODUCTION_BACKEND_SETUP.md)"
    echo "2. Test: curl https://trendydresses.co.ke/api/health"
    echo "3. View logs: pm2 logs trendy-dresses-api"
else
    echo -e "${YELLOW}⚠️ Backend may still be starting...${NC}"
    echo "Check logs: pm2 logs trendy-dresses-api"
fi

echo ""
echo "Backend URL: http://localhost:3000/api"

