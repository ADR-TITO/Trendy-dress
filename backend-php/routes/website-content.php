<?php
/**
 * Website Content Routes
 * Handle hero image, title, description, settings
 */

// Autoload model
spl_autoload_register(function ($class) {
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4);
    }
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Models\WebsiteContent;

/**
 * Check if the current request is from an authenticated admin.
 * Accepts EITHER a valid PHP session OR a Bearer token.
 */
function isAdminAuthenticated(): bool {
    // Method 1: PHP session cookie
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        return true;
    }

    // Method 2: Bearer token from Authorization header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        if (!empty($token) && isset($_SESSION['auth_token']) && hash_equals($_SESSION['auth_token'], $token)) {
            return true;
        }
        $tokenFile = sys_get_temp_dir() . '/trendy_admin_' . hash('sha256', $token) . '.tok';
        if (file_exists($tokenFile)) {
            $storedData = json_decode(file_get_contents($tokenFile), true);
            if ($storedData && isset($storedData['expires']) && $storedData['expires'] > time()) {
                return true;
            }
        }
    }
    return false;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Start session to check auth
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $websiteContent = new WebsiteContent();

    switch ($method) {
        case 'GET':
            // Get website content (public endpoint - no auth required)
            $content = $websiteContent->getContent();
            http_response_code(200);
            echo json_encode($content);
            break;

        case 'POST':
        case 'PUT':
            // Save website content (requires admin auth)
            
            // Check authentication (consistent with admin routes)
            if (!isAdminAuthenticated()) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized - Admin login required']);
                exit;
            }

            // Get request body
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON input']);
                exit;
            }

            // Save content
            $result = $websiteContent->saveContent($input);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Website content saved successfully',
                'data' => $result
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (\Exception $e) {
    error_log('Website content route error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
