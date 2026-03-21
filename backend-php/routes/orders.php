<?php
/**
 * Orders Routes
 */

// Start output buffering to catch any unexpected output
ob_start();

require_once __DIR__ . '/../config/database.php';

// Autoload models
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

use App\Models\Order;
use App\Models\MpesaTransaction;
use App\Models\Product;
use App\Utils\Auth;

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$orderIdOrAction = $routeParts[1] ?? null;
$subAction = $routeParts[2] ?? null;

try {
    $orderModel = new Order();
    $mpesaModel = new MpesaTransaction();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to initialize models',
        'message' => $e->getMessage()
    ]);
    error_log('Model initialization error: ' . $e->getMessage());
    exit;
}

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
            if ($orderIdOrAction === 'verify') {
                // Verify M-Pesa code
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaCode = $data['mpesaCode'] ?? '';
                $amount = $data['amount'] ?? 0;
                $transactionDate = $data['transactionDate'] ?? date('Y-m-d H:i:s');
                
                if (empty($mpesaCode)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'M-Pesa code is required']);
                    exit;
                }
                
                // Find transaction by receipt number
                $transaction = $mpesaModel->findByReceiptNumber($mpesaCode);
                
                if (!$transaction) {
                    http_response_code(400);
                    echo json_encode([
                        'valid' => false,
                        'reason' => 'M-Pesa code not found'
                    ]);
                    exit;
                }
                
                // Verify amount matches
                $amountMatch = abs($transaction['amount'] - $amount) < 0.01;
                
                // Verify date is within reasonable range
                $txDate = strtotime($transaction['transactionDate']);
                $reqDate = strtotime($transactionDate);
                $dateValid = abs($txDate - $reqDate) < 86400; // Within 24 hours
                
                if (!$amountMatch || !$dateValid) {
                    http_response_code(400);
                    echo json_encode([
                        'valid' => false,
                        'reason' => $amountMatch ? 'Date mismatch' : 'Amount mismatch',
                        'amountMatch' => $amountMatch,
                        'dateValid' => $dateValid
                    ]);
                    exit;
                }
                
                // Check if already used
                $existingOrder = $orderModel->findByMpesaCode($mpesaCode);
                if ($existingOrder) {
                    http_response_code(400);
                    echo json_encode([
                        'valid' => false,
                        'reason' => 'duplicate',
                        'orderId' => $existingOrder['orderId']
                    ]);
                    exit;
                }
                
                http_response_code(200);
                echo json_encode([
                    'valid' => true,
                    'transaction' => $transaction
                ]);
            } else if (!empty($orderIdOrAction) && strpos($orderIdOrAction, 'ORD-') === 0) {
                // Get single order by ID (for customer tracking)
                try {
                    $order = $orderModel->findByOrderId($orderIdOrAction);
                    if ($order) {
                        header('Content-Type: application/json; charset=utf-8');
                        echo json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    } else {
                        http_response_code(404);
                        echo json_encode(['error' => 'Order not found']);
                    }
                } catch (Exception $e) {
                    ob_clean();
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to fetch order', 'message' => $e->getMessage()]);
                    exit;
                }
            } else {
                // Get all orders (requires admin auth)
                if (!Auth::isAdminAuthenticated()) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Unauthorized - Admin login required']);
                    exit;
                }
                
                try {
                    $completedOnly = isset($_GET['completed']) && $_GET['completed'] === 'true';
                    $orders = $orderModel->findAll($completedOnly);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                } catch (Exception $e) {
                    ob_clean();
                    error_log('Error fetching orders: ' . $e->getMessage());
                    error_log('Stack trace: ' . $e->getTraceAsString());
                    http_response_code(500);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode([
                        'error' => 'Failed to fetch orders',
                        'message' => $e->getMessage()
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }
            }
            break;

        case 'POST':
            if ($orderIdOrAction === 'send-whatsapp' || $subAction === 'send-whatsapp') {
                // Endpoint for frontend to trigger a WhatsApp notification record/log
                $data = json_decode(file_get_contents('php://input'), true);
                $orderIdForWhatsApp = ($orderIdOrAction !== 'send-whatsapp' ? $orderIdOrAction : ($routeParts[2] ?? ($data['orderId'] ?? null)));
                
                if (!$orderIdForWhatsApp) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Order ID is required']);
                    exit;
                }
                
                // For now, we log the request and return success.
                error_log("📱 WhatsApp notification requested for Order: $orderIdForWhatsApp");
                
                echo json_encode(['success' => true, 'message' => 'WhatsApp notification recorded']);
                exit;
            }
            
            // Create new order
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data']);
                exit;
            }
            
            // Verify M-Pesa code if provided
            if (!empty($data['mpesaCode'])) {
                $mpesaCode = strtoupper($data['mpesaCode']);
                $amount = $data['total'] ?? $data['totalAmount'] ?? 0;
                $transactionDate = $data['date'] ?? date('Y-m-d H:i:s');
                $skipTransactionCheck = $data['skipTransactionCheck'] ?? false;
                
                if (!$skipTransactionCheck) {
                    $transaction = $mpesaModel->findByReceiptNumber($mpesaCode);
                    if (!$transaction) {
                        http_response_code(400);
                        echo json_encode([
                            'error' => 'M-Pesa code not found',
                            'mpesaCode' => $mpesaCode
                        ]);
                        exit;
                    }
                    
                    // Verify amount
                    if (abs($transaction['amount'] - $amount) >= 0.01) {
                        http_response_code(400);
                        echo json_encode([
                            'error' => 'Amount mismatch',
                            'expected' => $transaction['amount'],
                            'provided' => $amount
                        ]);
                        exit;
                    }
                }
                
                // Check for duplicate (skip if it's a pending placeholder)
                if (strpos($mpesaCode, 'PENDING_') === false) {
                    $existingOrder = $orderModel->findByMpesaCode($mpesaCode);
                    if ($existingOrder) {
                        http_response_code(400);
                        echo json_encode([
                            'error' => 'M-Pesa code already used',
                            'orderId' => $existingOrder['orderId'],
                            'reason' => 'duplicate'
                        ]);
                        exit;
                    }
                }
            }

            // CRITICAL: Verify stock availability before creating order
            try {
                $items = $data['items'] ?? [];
                if (!is_array($items) && !empty($items)) {
                    $items = json_decode($items, true);
                }
                if (is_array($items)) {
                    $productModel = new Product();
                    foreach ($items as $item) {
                        $productId = $item['productId'] ?? $item['id'] ?? $item['_id'] ?? null;
                        $requestedQty = (int)($item['quantity'] ?? 1);
                        
                        if ($productId) {
                            $product = $productModel->findById($productId);
                            if (!$product) {
                                http_response_code(400);
                                echo json_encode(['error' => 'Product not found', 'productId' => $productId]);
                                exit;
                            }
                            
                            if ($product['quantity'] < $requestedQty) {
                                http_response_code(400);
                                echo json_encode([
                                    'error' => 'Insufficient stock',
                                    'productName' => $product['name'],
                                    'requested' => $requestedQty,
                                    'available' => $product['quantity']
                                ]);
                                error_log("🚫 Order blocked: Insufficient stock for " . $product['name'] . " (Requested: $requestedQty, Available: " . $product['quantity'] . ")");
                                exit;
                            }
                        }
                    }
                }
            } catch (Exception $stockEx) {
                error_log("⚠️ Error checking stock: " . $stockEx->getMessage());
            }
            
            try {
                $order = $orderModel->create($data);
                
                // Decrement inventory on backend
                try {
                    $items = $data['items'] ?? [];
                    if (!is_array($items) && !empty($items)) {
                        $items = json_decode($items, true);
                    }
                    if (is_array($items)) {
                        $productModel = new Product();
                        foreach ($items as $item) {
                            $productId = $item['productId'] ?? $item['id'] ?? $item['_id'] ?? null;
                            $quantity  = (int)($item['quantity'] ?? 1);
                            if ($productId) {
                                $productModel->decrementQuantity($productId, $quantity);
                            }
                        }
                    }
                } catch (\Exception $invEx) {
                    error_log("⚠️ Warning: Failed to decrement inventory on order create: " . $invEx->getMessage());
                }

                http_response_code(201);
                echo json_encode($order);
            } catch (Exception $createEx) {
                error_log("❌ Critical: Failed to create order in database: " . $createEx->getMessage());
                error_log("Data: " . json_encode($data));
                http_response_code(500);
                echo json_encode(['error' => 'Database error during order creation', 'message' => $createEx->getMessage()]);
            }

            break;

        case 'PATCH':
            if ($subAction === 'delivery-status' && $orderIdOrAction) {
                // Update delivery status (requires admin auth)
                if (!Auth::isAdminAuthenticated()) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Unauthorized - Admin login required']);
                    exit;
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                $status = $data['deliveryStatus'] ?? $data['status'] ?? 'delivered';
                $deliveredBy = $data['deliveredBy'] ?? 'admin';
                
                $updated = $orderModel->updateDeliveryStatus($orderIdOrAction, $status, $deliveredBy);
                if (!$updated) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Order not found']);
                    exit;
                }
                
                $order = $orderModel->findByOrderId($orderIdOrAction);
                echo json_encode($order);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid request']);
            }
            break;
            
        case 'DELETE':
            if ($orderIdOrAction) {
                // Delete order (requires admin auth)
                if (!Auth::isAdminAuthenticated()) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Unauthorized - Admin login required']);
                    exit;
                }
                
                $deleted = $orderModel->delete($orderIdOrAction);
                if (!$deleted) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Order not found']);
                    exit;
                }
                echo json_encode(['success' => true, 'message' => 'Order deleted successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Order ID is required']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    ob_clean();
    http_response_code(500);
    $errorMessage = $e->getMessage();
    error_log("Orders API Error: " . $errorMessage);
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Return proper JSON error
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $errorMessage,
        'type' => get_class($e),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
