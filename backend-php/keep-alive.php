<?php
/**
 * Keep-Alive Script for PHP Backend
 * This script ensures the backend stays running
 * Run with: php keep-alive.php
 * Or use with process manager (Supervisor, systemd, PM2)
 */

// Set unlimited execution time
set_time_limit(0);
ignore_user_abort(true);

// Configuration
$host = '127.0.0.1';
$port = 8000;
$checkInterval = 30; // Check every 30 seconds
$maxRestarts = 10;
$restartDelay = 5; // Wait 5 seconds before restart

$restartCount = 0;
$logFile = __DIR__ . '/logs/keep-alive.log';

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    echo $logEntry;
}

function checkBackend($host, $port) {
    $url = "http://$host:$port/api/health";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 200;
}

function startBackend($host, $port) {
    $command = "php -S $host:$port -t " . escapeshellarg(__DIR__);
    
    // Start in background (platform-specific)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows
        $command = "start /B $command";
    } else {
        // Linux/Mac
        $command = "$command > /dev/null 2>&1 &";
    }
    
    exec($command);
    logMessage("Started backend: $command");
}

logMessage("Keep-Alive script started");
logMessage("Monitoring backend on http://$host:$port");

while (true) {
    if (!checkBackend($host, $port)) {
        logMessage("Backend is down! Restarting...");
        
        if ($restartCount >= $maxRestarts) {
            logMessage("Maximum restart attempts reached. Exiting.");
            exit(1);
        }
        
        startBackend($host, $port);
        $restartCount++;
        sleep($restartDelay);
    } else {
        $restartCount = 0; // Reset counter on success
    }
    
    sleep($checkInterval);
}

