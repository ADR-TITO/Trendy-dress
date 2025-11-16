#!/bin/bash
# Production Deployment Script for Trendy Dresses Backend
# Run this script on your production server

echo "========================================"
echo "Trendy Dresses Backend - Production Deployment"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js v14 or higher from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found!"
    echo "Creating .env from template..."
    if [ -f ENV_TEMPLATE.txt ]; then
        cp ENV_TEMPLATE.txt .env
        echo "✅ .env file created from template"
        echo ""
        echo "⚠️ IMPORTANT: Edit .env file and add your MongoDB connection string!"
        echo "   Run: nano .env"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo "❌ ENV_TEMPLATE.txt not found!"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PM2"
        exit 1
    fi
    
    echo "✅ PM2 installed"
    echo ""
fi

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start npm --name "trendy-dresses-api" -- start

if [ $? -ne 0 ]; then
    echo "❌ Failed to start backend"
    exit 1
fi

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "⚙️ Setting up PM2 startup script..."
echo "Run this command and follow the instructions:"
echo "pm2 startup"
echo ""

# Wait a moment for server to start
sleep 3

# Test backend
echo "🔍 Testing backend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$response" = "200" ]; then
    echo "✅ Backend is running successfully!"
    echo ""
    echo "📊 PM2 Status:"
    pm2 list
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure Nginx/Apache reverse proxy (see PRODUCTION_BACKEND_SETUP.md)"
    echo "2. Test public URL: https://trendydresses.co.ke/api/health"
    echo "3. View logs: pm2 logs trendy-dresses-api"
else
    echo "⚠️ Backend may not be fully started yet"
    echo "Check logs: pm2 logs trendy-dresses-api"
fi

echo ""
echo "✅ Deployment complete!"
echo "Backend URL: http://localhost:3000/api"

