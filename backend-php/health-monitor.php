<?php
/**
 * Health Monitor Script
 * Monitors backend health and restarts if needed
 * Run with cron: */5 * * * * php /path/to/health-monitor.php
 */

$backendURL = 'http://127.0.0.1:8000/api/health';
$logFile = __DIR__ . '/logs/health-monitor.log';
$maxFailures = 3;
$failureFile = __DIR__ . '/logs/failures.txt';

// Create logs directory
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

function checkHealth($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 200;
}

function restartBackend() {
    // Try different restart methods based on how backend is running
    
    // Method 1: Supervisor
    exec('supervisorctl restart trendy-dresses-backend 2>&1', $output, $return);
    if ($return === 0) {
        return true;
    }
    
    // Method 2: systemd
    exec('systemctl restart trendy-dresses-backend 2>&1', $output, $return);
    if ($return === 0) {
        return true;
    }
    
    // Method 3: PM2
    exec('pm2 restart trendy-dresses-backend 2>&1', $output, $return);
    if ($return === 0) {
        return true;
    }
    
    return false;
}

// Check health
$isHealthy = checkHealth($backendURL);

if (!$isHealthy) {
    // Read failure count
    $failures = 0;
    if (file_exists($failureFile)) {
        $failures = (int)file_get_contents($failureFile);
    }
    
    $failures++;
    file_put_contents($failureFile, $failures);
    
    logMessage("Health check failed (failure #$failures)");
    
    if ($failures >= $maxFailures) {
        logMessage("Maximum failures reached. Attempting restart...");
        
        if (restartBackend()) {
            logMessage("Backend restarted successfully");
            // Reset failure count
            file_put_contents($failureFile, '0');
        } else {
            logMessage("Failed to restart backend. Manual intervention required.");
        }
    }
} else {
    // Reset failure count on success
    if (file_exists($failureFile)) {
        file_put_contents($failureFile, '0');
    }
    logMessage("Health check passed");
}

