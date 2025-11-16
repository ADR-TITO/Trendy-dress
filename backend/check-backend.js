#!/usr/bin/env node
/**
 * Backend Server Health Check Script
 * Checks if the backend server is running and accessible
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const HEALTH_ENDPOINT = `${BACKEND_URL}/api/health`;
const DB_STATUS_ENDPOINT = `${BACKEND_URL}/api/db-status`;

console.log('🔍 Checking backend server status...\n');
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log('');

// Check health endpoint
function checkHealth() {
    return new Promise((resolve, reject) => {
        const url = new URL(HEALTH_ENDPOINT);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve({ success: true, status: res.statusCode, data: json });
                    } catch (e) {
                        resolve({ success: true, status: res.statusCode, data: data });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Check database status
function checkDatabase() {
    return new Promise((resolve, reject) => {
        const url = new URL(DB_STATUS_ENDPOINT);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve({ success: true, status: res.statusCode, data: json });
                    } catch (e) {
                        resolve({ success: true, status: res.statusCode, data: data });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Run checks
(async () => {
    try {
        // Check health
        console.log('🔍 Checking health endpoint...');
        const healthResult = await checkHealth();
        console.log('✅ Backend server is running!');
        console.log(`   Status: ${healthResult.status}`);
        console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`);
        console.log('');

        // Check database
        console.log('🔍 Checking database connection...');
        try {
            const dbResult = await checkDatabase();
            const db = dbResult.data;
            console.log('✅ Database status check successful!');
            console.log(`   Initialized: ${db.initialized ? 'Yes' : 'No'}`);
            console.log(`   Connection State: ${db.readyStateText} (${db.readyState})`);
            console.log(`   Host: ${db.host}`);
            console.log(`   Database: ${db.name}`);
            
            if (db.readyState === 1) {
                console.log('');
                console.log('✅ MongoDB is connected and ready!');
            } else {
                console.log('');
                console.log('⚠️ MongoDB is not connected');
                console.log('   Please check your MongoDB connection string in .env file');
            }
        } catch (dbError) {
            console.log('⚠️ Could not check database status:', dbError.message);
            console.log('   (Backend is running but database check failed)');
        }

        console.log('');
        console.log('✅ Backend server is operational!');
        console.log(`   API Base URL: ${BACKEND_URL}/api`);
        console.log(`   Health Check: ${HEALTH_ENDPOINT}`);
        console.log(`   Database Status: ${DB_STATUS_ENDPOINT}`);

        process.exit(0);
    } catch (error) {
        console.log('');
        console.log('❌ Backend server is NOT running or not accessible!');
        console.log(`   Error: ${error.message}`);
        console.log('');
        console.log('Troubleshooting:');
        console.log('   1. Make sure the backend server is running:');
        console.log('      - Run: npm start (in backend folder)');
        console.log('      - Or use: start-backend.bat / start-backend.ps1');
        console.log('   2. Check if port 3000 is already in use');
        console.log('   3. Verify your .env file is configured correctly');
        console.log('   4. Check server logs for error messages');
        
        process.exit(1);
    }
})();

