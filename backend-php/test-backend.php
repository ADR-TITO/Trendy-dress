<?php
/**
 * Backend Test Script
 * Tests PHP backend configuration and database connection
 */

header('Content-Type: application/json');

$result = [
    'php_version' => PHP_VERSION,
    'pdo_mysql' => extension_loaded('pdo_mysql') ? 'installed' : 'not installed',
    'pdo' => extension_loaded('pdo') ? 'installed' : 'not installed',
    'dotenv_available' => class_exists('Dotenv\Dotenv'),
    'timestamp' => date('Y-m-d H:i:s')
];

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    // Try to use dotenv if available
    if (class_exists('Dotenv\Dotenv')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
    } else {
        // Simple .env parser
        $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim(trim($value), '"\'');
        }
    }
    $result['env_file'] = 'found';
    $result['db_host'] = $_ENV['DB_HOST'] ?? 'not set';
    $result['db_name'] = $_ENV['DB_NAME'] ?? 'not set';
    $result['db_user'] = $_ENV['DB_USER'] ?? 'not set';
    $result['db_pass'] = isset($_ENV['DB_PASS']) ? '***' : 'not set';
} else {
    $result['env_file'] = 'not found';
}

// Test MariaDB connection
if (extension_loaded('pdo_mysql')) {
    try {
        require_once __DIR__ . '/config/database.php';
        $status = Database::getStatus();
        $result['database_connection'] = $status['connected'] ? 'success' : 'failed';
        $result['database_status'] = $status;
    } catch (Exception $e) {
        $result['database_connection'] = 'failed';
        $result['database_error'] = $e->getMessage();
    }
} else {
    $result['database_connection'] = 'pdo_mysql extension not available';
}

echo json_encode($result, JSON_PRETTY_PRINT);
