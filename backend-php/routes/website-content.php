<?php
/**
 * Website Content Routes
 * Handle hero image, title, description, settings
 */

require_once __DIR__ . '/../Models/WebsiteContent.php';

use App\Models\WebsiteContent;

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();

try {
    // Get database connection
    $db = $GLOBALS['db'] ?? null;
    
    if (!$db) {
        http_response_code(503);
        echo json_encode(['error' => 'Database not connected']);
        exit;
    }

    $websiteContent = new WebsiteContent($db);

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
            
            // Check authentication
            if (empty($_SESSION['admin_logged_in'])) {
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
