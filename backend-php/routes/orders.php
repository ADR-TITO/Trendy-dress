<?php
/**
 * Orders Routes
 */

require_once __DIR__ . '/../config/database.php';

// Autoload models
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Models\Order;
use App\Models\MpesaTransaction;

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$action = $routeParts[1] ?? null;
$orderId = $routeParts[1] ?? null;

$orderModel = new Order();

try {
    if (!Database::isConnected()) {
        http_response_code(503);
        echo json_encode(['error' => 'Database not connected']);
        exit;
    }
    
    switch ($method) {
        case 'GET':
            if ($orderId && $action !== 'verify') {
                // Get single order
                $order = $orderModel->findByOrderId($orderId);
                if (!$order) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Order not found']);
                    exit;
                }
                echo json_encode($order);
            } else {
                // Get all orders
                $orders = $orderModel->findAll(false);
                echo json_encode($orders);
            }
            break;
            
        case 'POST':
            if ($action === 'verify') {
                // Verify M-Pesa code
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaCode = strtoupper(trim($data['mpesaCode'] ?? ''));
                $amount = (float)($data['amount'] ?? 0);
                
                if (!$mpesaCode) {
                    http_response_code(400);
                    echo json_encode(['error' => 'M-Pesa code is required']);
                    exit;
                }
                
                // Check for duplicate
                $existingOrder = $orderModel->findByMpesaCode($mpesaCode);
                if ($existingOrder) {
                    echo json_encode([
                        'valid' => false,
                        'verified' => false,
                        'reason' => 'duplicate',
                        'message' => 'This M-Pesa code has already been used'
                    ]);
                    exit;
                }
                
                // Validate format
                if (!preg_match('/^[A-Z0-9]{10}$/', $mpesaCode)) {
                    echo json_encode([
                        'valid' => false,
                        'verified' => false,
                        'reason' => 'invalid_format',
                        'message' => 'Invalid M-Pesa code format'
                    ]);
                    exit;
                }
                
                // Check transaction in database
                $transactionModel = new MpesaTransaction();
                $transaction = $transactionModel->findByReceiptNumber($mpesaCode);
                
                if ($transaction && $amount > 0) {
                    $amountMatch = abs($transaction['amount'] - $amount) < 1;
                    $dateValid = true; // Simplified for now
                    
                    echo json_encode([
                        'valid' => true,
                        'verified' => $amountMatch && $dateValid,
                        'code' => $mpesaCode,
                        'amountMatch' => $amountMatch,
                        'dateValid' => $dateValid,
                        'foundInMpesa' => true
                    ]);
                } else {
                    echo json_encode([
                        'valid' => true,
                        'verified' => false,
                        'code' => $mpesaCode,
                        'foundInMpesa' => false,
                        'message' => 'Transaction not found in database'
                    ]);
                }
            } else {
                // Create new order
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!$data) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid JSON data']);
                    exit;
                }
                
                $order = $orderModel->create($data);
                http_response_code(201);
                echo json_encode($order);
            }
            break;
            
        case 'PATCH':
            // Update delivery status
            if ($action === 'delivery-status') {
                $data = json_decode(file_get_contents('php://input'), true);
                $status = $data['deliveryStatus'] ?? 'pending';
                $deliveredBy = $data['deliveredBy'] ?? 'admin';
                
                $updated = $orderModel->updateDeliveryStatus($orderId, $status, $deliveredBy);
                if (!$updated) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Order not found']);
                    exit;
                }
                
                $order = $orderModel->findByOrderId($orderId);
                echo json_encode($order);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
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
    error_log("Orders API Error: " . $e->getMessage());
}

