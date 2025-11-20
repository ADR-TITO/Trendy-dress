#!/bin/bash

# Check Backend Status Script
# Tests if backend is running and accessible

echo "=========================================="
echo "Backend Status Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Local backend health
echo "1. Testing local backend (localhost:3000)..."
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
if [ "$LOCAL_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Local backend is running${NC}"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo -e "${RED}❌ Local backend is NOT running (HTTP $LOCAL_RESPONSE)${NC}"
    echo "   → Run: pm2 start npm --name 'trendy-dresses-api' -- start"
fi
echo ""

# Test 2: Public backend health
echo "2. Testing public backend (https://trendydresses.co.ke/api/health)..."
PUBLIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://trendydresses.co.ke/api/health 2>/dev/null)
if [ "$PUBLIC_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Public backend is accessible${NC}"
    curl -s https://trendydresses.co.ke/api/health | python3 -m json.tool 2>/dev/null || curl -s https://trendydresses.co.ke/api/health
else
    echo -e "${RED}❌ Public backend is NOT accessible (HTTP $PUBLIC_RESPONSE)${NC}"
    echo "   → Check Nginx configuration"
    echo "   → Check if backend is running: pm2 list"
fi
echo ""

# Test 3: MongoDB status
echo "3. Testing MongoDB connection..."
DB_RESPONSE=$(curl -s https://trendydresses.co.ke/api/db-status 2>/dev/null)
if [ $? -eq 0 ]; then
    READY_STATE=$(echo "$DB_RESPONSE" | grep -o '"readyState":[0-9]*' | cut -d':' -f2)
    if [ "$READY_STATE" = "1" ]; then
        echo -e "${GREEN}✅ MongoDB is connected${NC}"
    else
        echo -e "${YELLOW}⚠️ MongoDB is NOT connected (ReadyState: $READY_STATE)${NC}"
        echo "   → Check MongoDB connection string in .env"
        echo "   → Check MongoDB Atlas IP whitelist"
    fi
    echo "$DB_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DB_RESPONSE"
else
    echo -e "${RED}❌ Could not check MongoDB status${NC}"
fi
echo ""

# Test 4: PM2 status
echo "4. Checking PM2 process..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep "trendy-dresses-api" | awk '{print $10}')
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ PM2 process is online${NC}"
        pm2 list | grep "trendy-dresses-api"
    else
        echo -e "${RED}❌ PM2 process is NOT running${NC}"
        echo "   → Run: pm2 start npm --name 'trendy-dresses-api' -- start"
    fi
else
    echo -e "${YELLOW}⚠️ PM2 is not installed${NC}"
    echo "   → Install: npm install -g pm2"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ "$LOCAL_RESPONSE" = "200" ] && [ "$PUBLIC_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is running and accessible!${NC}"
    exit 0
else
    echo -e "${RED}❌ Backend needs attention${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check PM2: pm2 list"
    echo "2. Check logs: pm2 logs trendy-dresses-api"
    echo "3. Check Nginx: sudo nginx -t"
    echo "4. See: ENSURE_BACKEND_RUNNING.md"
    exit 1
fi

