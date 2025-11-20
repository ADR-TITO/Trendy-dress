<?php
/**
 * Trendy Dresses Backend API - PHP Router
 * Main entry point for all API requests
 */

// Load composer autoloader (optional - not required)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
// Note: Backend works without Composer - uses built-in PHP features

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    // Try to use dotenv if available
    if (class_exists('Dotenv\Dotenv')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
    } else {
        // Fallback: Simple .env parser (no Composer needed)
        $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim(trim($value), '"\'');
            putenv(trim($key) . '=' . trim(trim($value), '"\''));
        }
    }
} else {
    // Don't fail if .env doesn't exist - use defaults
    error_log('⚠️ .env file not found - using default values');
}

// Set headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php-errors.log');

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/logs')) {
    @mkdir(__DIR__ . '/logs', 0755, true);
}

// Get route from query string or PATH_INFO
$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Parse route
$routeParts = explode('/', trim($route, '/'));
$resource = $routeParts[0] ?? '';
$id = $routeParts[1] ?? null;

// Route to appropriate controller
try {
    switch ($resource) {
        case 'health':
            require_once __DIR__ . '/routes/health.php';
            break;
            
        case 'db-status':
            require_once __DIR__ . '/routes/db-status.php';
            break;
            
        case 'server-info':
            require_once __DIR__ . '/routes/server-info.php';
            break;
            
        case 'products':
            require_once __DIR__ . '/routes/products.php';
            break;
            
        case 'orders':
            require_once __DIR__ . '/routes/orders.php';
            break;
            
        case 'admin':
            require_once __DIR__ . '/routes/admin.php';
            break;
            
        case 'settings':
            require_once __DIR__ . '/routes/settings.php';
            break;
            
        case 'mpesa':
            require_once __DIR__ . '/routes/mpesa.php';
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found', 'route' => $route]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
    error_log('API Error: ' . $e->getMessage());
}

