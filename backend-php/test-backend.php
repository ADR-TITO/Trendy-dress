<?php
/**
 * Quick Test Script for PHP Backend
 * Visit: https://trendydresses.co.ke/backend-php/test-backend.php
 */

header('Content-Type: application/json');

$result = [
    'status' => 'ok',
    'message' => 'PHP backend is working',
    'php_version' => phpversion(),
    'mongodb_extension' => extension_loaded('mongodb') ? 'installed' : 'not installed',
    'composer_autoload' => file_exists(__DIR__ . '/vendor/autoload.php') ? 'exists' : 'missing',
    'env_file' => file_exists(__DIR__ . '/.env') ? 'exists' : 'missing',
    'htaccess' => file_exists(__DIR__ . '/.htaccess') ? 'exists' : 'missing',
    'index_php' => file_exists(__DIR__ . '/index.php') ? 'exists' : 'missing',
    'current_directory' => __DIR__,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
];

// Test MongoDB connection if extension is loaded
if (extension_loaded('mongodb') && file_exists(__DIR__ . '/vendor/autoload.php')) {
    try {
        require_once __DIR__ . '/vendor/autoload.php';
        
        if (file_exists(__DIR__ . '/.env')) {
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
            $dotenv->load();
            $mongodbUri = $_ENV['MONGODB_URI'] ?? '';
            
            if ($mongodbUri) {
                $result['mongodb_uri_configured'] = true;
                $result['mongodb_uri_preview'] = preg_replace('/\/\/[^:]+:[^@]+@/', '//***:***@', $mongodbUri);
                
                // Try to connect
                try {
                    $client = new MongoDB\Client($mongodbUri);
                    $client->selectDatabase('admin')->command(['ping' => 1]);
                    $result['mongodb_connection'] = 'success';
                } catch (Exception $e) {
                    $result['mongodb_connection'] = 'failed';
                    $result['mongodb_error'] = $e->getMessage();
                }
            } else {
                $result['mongodb_uri_configured'] = false;
            }
        }
    } catch (Exception $e) {
        $result['error'] = $e->getMessage();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);

