<?php
/**
 * Debug Script - Check Backend Configuration
 * Visit: https://trendydresses.co.ke/backend-php/debug.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<h1>Backend Debug Information</h1>";
echo "<pre>";

// PHP Version
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n\n";

// Check PDO MySQL
echo "=== PHP Extensions ===\n";
echo "PDO: " . (extension_loaded('pdo') ? '✅ Installed' : '❌ Not installed') . "\n";
echo "PDO MySQL: " . (extension_loaded('pdo_mysql') ? '✅ Installed' : '❌ Not installed') . "\n\n";

// Check files
echo "=== Files ===\n";
echo "index.php: " . (file_exists(__DIR__ . '/index.php') ? '✅ Exists' : '❌ Missing') . "\n";
echo "config/database.php: " . (file_exists(__DIR__ . '/config/database.php') ? '✅ Exists' : '❌ Missing') . "\n";
echo ".env: " . (file_exists(__DIR__ . '/.env') ? '✅ Exists' : '❌ Missing') . "\n";
echo ".htaccess: " . (file_exists(__DIR__ . '/.htaccess') ? '✅ Exists' : '❌ Missing') . "\n\n";

// Check .env file
if (file_exists(__DIR__ . '/.env')) {
    echo "=== .env File Content ===\n";
    $envContent = file_get_contents(__DIR__ . '/.env');
    // Hide password
    $envContent = preg_replace('/DB_PASS=(.*)/', 'DB_PASS=***', $envContent);
    echo $envContent . "\n\n";
} else {
    echo "=== .env File ===\n";
    echo "❌ .env file not found!\n\n";
}

// Try to load environment
echo "=== Environment Variables ===\n";
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim(trim($value), '"\'');
        if ($key === 'DB_PASS') $value = '***';
        echo "$key = $value\n";
    }
} else {
    echo "Using defaults:\n";
    echo "DB_HOST = localhost\n";
    echo "DB_NAME = trendydr_Shpo\n";
    echo "DB_USER = trendydr_Adrian\n";
    echo "DB_PASS = ***\n";
}
echo "\n";

// Test database connection
echo "=== Database Connection Test ===\n";
try {
    require_once __DIR__ . '/config/database.php';
    $status = Database::getStatus();
    echo "Connection: " . ($status['connected'] ? '✅ Connected' : '❌ Failed') . "\n";
    echo "Database: " . $status['name'] . "\n";
    echo "Host: " . $status['host'] . "\n";
    
    if (!$status['connected']) {
        echo "\n❌ Database connection failed!\n";
        echo "Check:\n";
        echo "1. Database credentials in .env file\n";
        echo "2. Database exists in cPanel\n";
        echo "3. User has proper permissions\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
echo "\n";

// Test API endpoint
echo "=== API Endpoint Test ===\n";
try {
    $ch = curl_init('http://localhost' . dirname($_SERVER['REQUEST_URI']) . '/api/health');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "✅ Health endpoint: Working\n";
        echo "Response: $response\n";
    } else {
        echo "❌ Health endpoint: Failed (HTTP $httpCode)\n";
    }
} catch (Exception $e) {
    echo "❌ Error testing API: " . $e->getMessage() . "\n";
}
echo "\n";

// Check file permissions
echo "=== File Permissions ===\n";
$files = ['index.php', 'config/database.php', '.env', '.htaccess'];
foreach ($files as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        $perms = substr(sprintf('%o', fileperms($path)), -4);
        echo "$file: $perms\n";
    }
}
echo "\n";

// PHP Error Log Location
echo "=== Error Log Location ===\n";
echo "error_log: " . ini_get('error_log') . "\n";
echo "log_errors: " . (ini_get('log_errors') ? 'On' : 'Off') . "\n";
echo "display_errors: " . (ini_get('display_errors') ? 'On' : 'Off') . "\n";

echo "</pre>";

