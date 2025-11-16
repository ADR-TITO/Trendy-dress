#!/usr/bin/env node

/**
 * Script to kill a process using a specific port
 * Usage: node kill-port.js [port]
 */

const { exec } = require('child_process');
const os = require('os');

const port = process.argv[2] || process.env.PORT || 3001;

console.log(`🔍 Checking for process using port ${port}...`);

if (os.platform() === 'win32') {
    // Windows: Use netstat to find PID, then taskkill
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
        if (error || !stdout) {
            console.log(`✅ Port ${port} is not in use`);
            return;
        }
        
        // Extract PID from netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 0) {
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) {
                    pids.add(pid);
                }
            }
        });
        
        if (pids.size === 0) {
            console.log(`✅ Port ${port} is not in use`);
            return;
        }
        
        console.log(`⚠️ Found ${pids.size} process(es) using port ${port}`);
        pids.forEach(pid => {
            console.log(`   PID: ${pid}`);
        });
        
        // Kill each process
        pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (killError, killStdout, killStderr) => {
                if (killError) {
                    console.error(`❌ Failed to kill process ${pid}: ${killError.message}`);
                } else {
                    console.log(`✅ Killed process ${pid}`);
                }
            });
        });
    });
} else {
    // Linux/Mac: Use lsof to find PID, then kill
    exec(`lsof -ti :${port}`, (error, stdout, stderr) => {
        if (error || !stdout) {
            console.log(`✅ Port ${port} is not in use`);
            return;
        }
        
        const pids = stdout.trim().split('\n').filter(pid => pid);
        
        if (pids.length === 0) {
            console.log(`✅ Port ${port} is not in use`);
            return;
        }
        
        console.log(`⚠️ Found ${pids.length} process(es) using port ${port}`);
        pids.forEach(pid => {
            console.log(`   PID: ${pid}`);
        });
        
        // Kill each process
        pids.forEach(pid => {
            exec(`kill -9 ${pid}`, (killError, killStdout, killStderr) => {
                if (killError) {
                    console.error(`❌ Failed to kill process ${pid}: ${killError.message}`);
                } else {
                    console.log(`✅ Killed process ${pid}`);
                }
            });
        });
    });
}

