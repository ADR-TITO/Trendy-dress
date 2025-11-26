<?php
/**
 * Products Routes
 */

// Start output buffering to catch any unexpected output
ob_start();

// Start session securely
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
    session_start();
}

require_once __DIR__ . '/../config/database.php';

// Autoload Product model
spl_autoload_register(function ($class) {
    // Handle App namespace mapping to src directory
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4); // Remove 'App\' prefix
    }
    
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Models\Product;

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Check MariaDB connection
    if (!Database::isConnected()) {
        http_response_code(503);
        echo json_encode([
            'error' => 'MariaDB not connected',
            'message' => 'Database connection failed. Please check database credentials in .env file.'
        ]);
        exit;
    }
    
    // Test database connection with a simple query
    try {
        $pdo = Database::getConnection();
        $pdo->query("SELECT 1");
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode([
            'error' => 'Database connection error',
            'message' => 'Failed to connect to database: ' . $e->getMessage()
        ]);
        error_log('Database connection error: ' . $e->getMessage());
        exit;
    }
    
    // Instantiate Product model
    $productModel = new Product();
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single product
                try {
                    $product = $productModel->findById($id);
                    if (!$product) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Product not found']);
                        exit;
                    }
                    echo json_encode($product);
                } catch (Exception $e) {
                    error_log('Error fetching product: ' . $e->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'error' => 'Failed to fetch product',
                        'message' => $e->getMessage()
                    ]);
                    exit;
                }
            } else {
                // Get all products
                try {
                    $category = $_GET['category'] ?? 'all';
                    // Always include images by default (changed from false to true)
                    $includeImages = isset($_GET['includeImages']) ? $_GET['includeImages'] === 'true' : true;

                    $products = $productModel->findAll($category === 'all' ? null : $category, $includeImages);

                    // Clean any unexpected output
                    ob_clean();
                    
                    // Add caching headers
                    header('Content-Type: application/json; charset=utf-8');
                    header('Cache-Control: public, max-age=600');
                    header('ETag: "' . count($products) . '-' . time() . '"');

                    echo json_encode($products, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                } catch (Exception $e) {
                    ob_clean();
                    error_log('Error fetching products: ' . $e->getMessage());
                    error_log('Stack trace: ' . $e->getTraceAsString());
                    http_response_code(500);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode([
                        'error' => 'Failed to fetch products',
                        'message' => $e->getMessage()
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }
            }
            break;
            
        case 'POST':
            // Admin-only: Check if user is logged in
            if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }

            // Create new product
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data']);
                exit;
            }
            
            $product = $productModel->create($data);
            http_response_code(201);
            echo json_encode($product);
            break;
            
        case 'PUT':
            // Admin-only: Check if user is logged in
            if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }

            // Update product
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Product ID required']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data']);
                exit;
            }
            
            $product = $productModel->update($id, $data);
            if (!$product) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Product not found',
                    'received_id' => $id,
                    'id_length' => strlen($id)
                ]);
                exit;
            }
            echo json_encode($product);
            break;
            
        case 'DELETE':
            // Admin-only: Check if user is logged in
            if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }

            // Delete product
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Product ID required']);
                exit;
            }
            
            error_log("Attempting to delete product with ID: " . $id);
            
            $deleted = $productModel->delete($id);
            
            if (!$deleted) {
                error_log("Delete failed - Product not found: " . $id);
                http_response_code(404);
                echo json_encode([
                    'error' => 'Product not found',
                    'received_id' => $id,
                    'id_length' => strlen($id)
                ]);
                exit;
            }
            error_log("Product deleted successfully: " . $id);
            echo json_encode(['message' => 'Product deleted successfully']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    ob_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    error_log("Products API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
}

