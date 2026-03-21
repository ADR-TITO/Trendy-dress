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
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    // Try to use dotenv if available
    if (class_exists('Dotenv\Dotenv')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
    } else {
        // Fallback: Simple .env parser
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim(trim($value), '"\'');
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv("$key=$value");
        }
    }
} else {
    // Don't fail if .env doesn't exist - use defaults
    error_log('⚠️ .env file not found - using default values');
}

// Set headers
header('Content-Type: application/json; charset=utf-8');

// CORS: Reflect the requesting origin instead of wildcard (*)
// Wildcard CORS blocks cookies/sessions, so we must reflect the origin for credentials to work
$allowedOrigins = [
    'https://trendydresses.co.ke',
    'https://www.trendydresses.co.ke',
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1',
];
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($requestOrigin, $allowedOrigins) || strpos($requestOrigin, 'localhost') !== false || strpos($requestOrigin, '127.0.0.1') !== false) {
    header("Access-Control-Allow-Origin: $requestOrigin");
    header('Access-Control-Allow-Credentials: true');
} else {
    // Fallback for non-browser calls (Postman, cURL, etc.)
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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

// Get route from query string
$route = $_GET['route'] ?? '';

// Fallback for built-in PHP server or environments without .htaccess support
if (empty($route)) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    // Handle /api/ or /backend-php/api/
    if (strpos($uri, '/api/') !== false) {
        $parts = explode('/api/', $uri, 2);
        $route = $parts[1] ?? '';
    } elseif (strpos($uri, 'index.php/') !== false) {
        $parts = explode('index.php/', $uri, 2);
        $route = $parts[1] ?? '';
    }
}
$method = $_SERVER['REQUEST_METHOD'];

// Parse route
$routeParts = explode('/', trim($route, '/'));
$resource = $routeParts[0] ?? '';
$id = $routeParts[1] ?? null;

// Special handling for PATCH requests on nested routes
// Example: /products/{id}/quantity
if ($method === 'PATCH' && $resource === 'products' && isset($routeParts[2])) {
    // The logic for this is expected to be in the resource's route file
    require_once __DIR__ . '/routes/products.php';
    exit;
}
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
            
        case 'auth':
            require_once __DIR__ . '/routes/auth.php';
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
            
        case 'website-content':
            require_once __DIR__ . '/routes/website-content.php';
            break;
            
        case 'create-tables':
            require_once __DIR__ . '/create-tables.php';
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
