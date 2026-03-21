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
use App\Utils\Auth;

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
            if (!Auth::isAdminAuthenticated()) {
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
