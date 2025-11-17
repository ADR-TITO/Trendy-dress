<?php
/**
 * Products Routes
 */

require_once __DIR__ . '/../config/database.php';

// Autoload Product model
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Models\Product;

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$id = $routeParts[1] ?? null;

$productModel = new Product();

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
                    $includeImages = isset($_GET['includeImages']) && $_GET['includeImages'] === 'true';

                    $products = $productModel->findAll($category === 'all' ? null : $category, $includeImages);

                    // Add caching headers
                    header('Cache-Control: public, max-age=600');
                    header('ETag: "' . count($products) . '-' . time() . '"');

                    echo json_encode($products);
                } catch (Exception $e) {
                    error_log('Error fetching products: ' . $e->getMessage());
                    error_log('Stack trace: ' . $e->getTraceAsString());
                    http_response_code(500);
                    echo json_encode([
                        'error' => 'Failed to fetch products',
                        'message' => $e->getMessage()
                    ]);
                    exit;
                }
            }
            break;
            
        case 'POST':
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
                echo json_encode(['error' => 'Product not found']);
                exit;
            }
            echo json_encode($product);
            break;
            
        case 'DELETE':
            // Delete product
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Product ID required']);
                exit;
            }
            
            $deleted = $productModel->delete($id);
            if (!$deleted) {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
                exit;
            }
            echo json_encode(['message' => 'Product deleted successfully']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $e->getMessage()
    ]);
    error_log("Products API Error: " . $e->getMessage());
}

