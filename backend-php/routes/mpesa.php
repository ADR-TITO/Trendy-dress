<?php
/**
 * M-Pesa Routes
 */

require_once __DIR__ . '/../config/database.php';

// Autoload models and services
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

use App\Models\MpesaTransaction;
use App\Services\MpesaService;
use App\Models\Order;
use App\Models\Product;

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$action = $routeParts[1] ?? null;

try {
    if (!\Database::isConnected()) {
        http_response_code(503);
        echo json_encode(['error' => 'Database not connected']);
        exit;
    }
    
    switch ($method) {
        case 'GET':
            if ($action === 'transactions') {
                // Get recent transactions (for frontend polling)
                $phoneNumber = $_GET['phoneNumber'] ?? null;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                
                $transactionModel = new MpesaTransaction();
                $transactions = $transactionModel->findAll($phoneNumber, $limit);
                
                echo json_encode([
                    'success' => true,
                    'transactions' => $transactions
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
            }
            break;
            
        case 'POST':
            if ($action === 'verify-code') {
                // Manual M-Pesa code verification with amount check
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaCode = strtoupper(trim($data['mpesaCode'] ?? ''));
                $amount = (float)($data['amount'] ?? 0);
                $orderId = $data['orderId'] ?? '';

                // Validate code format (10 characters, alphanumeric)
                if (strlen($mpesaCode) !== 10) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Invalid M-Pesa code format. Code must be exactly 10 characters.',
                        'code' => 'INVALID_FORMAT'
                    ]);
                    break;
                }
                if (!preg_match('/^[A-Z0-9]+$/', $mpesaCode)) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Invalid M-Pesa code. Only letters and numbers are allowed.',
                        'code' => 'INVALID_CHARACTERS'
                    ]);
                    break;
                }
                // Verify amount against order (if orderId provided)
                if ($orderId !== '') {
                    try {
                        $pdo = \Database::getConnection();
                        $stmt = $pdo->prepare("SELECT totalAmount FROM orders WHERE orderId = :orderId");
                        $stmt->execute([':orderId' => $orderId]);
                        $order = $stmt->fetch(PDO::FETCH_ASSOC);
                        if (!$order) {
                            echo json_encode([
                                'success' => false,
                                'error' => 'Order not found for amount verification.',
                                'code' => 'ORDER_NOT_FOUND'
                            ]);
                            break;
                        }
                        if (abs($order['totalAmount'] - $amount) > 0.01) {
                            echo json_encode([
                                'success' => false,
                                'error' => 'Paid amount does not match order total.',
                                'code' => 'AMOUNT_MISMATCH'
                            ]);
                            break;
                        }
                    } catch (\Exception $e) {
                        error_log('Amount verification error: ' . $e->getMessage());
                        echo json_encode([
                            'success' => false,
                            'error' => 'Unable to verify amount at this time.',
                            'code' => 'SERVICE_ERROR'
                        ]);
                        break;
                    }
                }
                // Check if code has been used before
                try {
                    $pdo = \Database::getConnection();
                    if ($orderId !== '') {
                        $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE mpesaCode = :code AND orderId != :orderId");
                        $stmt->execute([':code' => $mpesaCode, ':orderId' => $orderId]);
                    } else {
                        $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE mpesaCode = :code");
                        $stmt->execute([':code' => $mpesaCode]);
                    }
                    $count = $stmt->fetchColumn();
                    if ($count > 0) {
                        echo json_encode([
                            'success' => false,
                            'error' => 'This M-Pesa code has already been used. Please use a different transaction code.',
                            'code' => 'DUPLICATE_CODE'
                        ]);
                        break;
                    }
                    // Code is valid and not used
                    echo json_encode([
                        'success' => true,
                        'message' => 'M-Pesa code verified successfully',
                        'mpesaCode' => $mpesaCode,
                        'verified' => true
                    ]);
                } catch (\Exception $e) {
                    error_log("M-Pesa verification error: " . $e->getMessage());
                    echo json_encode([
                        'success' => false,
                        'error' => 'Payment verification service is temporarily unavailable. Please try again.',
                        'code' => 'SERVICE_ERROR'
                    ]);
                }
            } elseif ($action === 'webhook') {
                // M-Pesa webhook for STK Push Callbacks
                $rawInput = file_get_contents('php://input');
                error_log("📥 Webhook Received: " . ($rawInput ?: 'EMPTY_BODY'));
                $data = json_decode($rawInput, true);
                
                if (isset($data['Body']['stkCallback'])) {
                    $callback = $data['Body']['stkCallback'];
                    $checkoutRequestID = $callback['CheckoutRequestID'] ?? '';
                    $resultCode = $callback['ResultCode'] ?? -1;
                    
                    $transactionModel = new MpesaTransaction();
                    
                    // Find existing pending transaction
                    $existingTransaction = $transactionModel->findByCheckoutRequestID($checkoutRequestID);
                    
                    if ($resultCode === 0) {
                        // Payment successful
                        $metadata = $callback['CallbackMetadata']['Item'] ?? [];
                        
                        $receiptNumber = '';
                        $mpesaAmount = 0;
                        $phoneNumber = '';
                        
                        foreach ($metadata as $item) {
                            if ($item['Name'] === 'MpesaReceiptNumber') {
                                $receiptNumber = $item['Value'] ?? '';
                            } elseif ($item['Name'] === 'Amount') {
                                $mpesaAmount = (float)($item['Value'] ?? 0);
                            } elseif ($item['Name'] === 'PhoneNumber') {
                                $phoneNumber = $item['Value'] ?? '';
                            }
                        }
                        
                        if ($existingTransaction) {
                            $orderId = $existingTransaction['orderId'] ?? null;
                            $expectedAmount = 0;
                            
                            if ($orderId) {
                                try {
                                    $pdo = \Database::getConnection();
                                    $stmt = $pdo->prepare("SELECT totalAmount FROM orders WHERE orderId = :orderId");
                                    $stmt->execute([':orderId' => $orderId]);
                                    $order = $stmt->fetch(PDO::FETCH_ASSOC);
                                    if ($order) {
                                        $expectedAmount = (float)$order['totalAmount'];
                                    }
                                } catch (\Exception $e) {
                                    error_log('Error fetching order amount for webhook validation: ' . $e->getMessage());
                                }
                            }
                            
                            $statusUpdate = [
                                'receiptNumber' => $receiptNumber,
                                'amount' => $mpesaAmount,
                                'phoneNumber' => $phoneNumber,
                                'resultCode' => 0,
                                'resultDesc' => 'Success'
                            ];
                            
                            if ($expectedAmount > 0 && abs($expectedAmount - $mpesaAmount) > 0.01) {
                                $statusUpdate['resultCode'] = 1;
                                $statusUpdate['resultDesc'] = 'Payment successful but amount mismatch. Expected ' . $expectedAmount . ', received ' . $mpesaAmount;
                            }
                            
                            $transactionModel->update($existingTransaction['_id'], $statusUpdate);

                            if ($orderId) {
                                try {
                                    $orderModel = new App\Models\Order();
                                    $existingOrder = $orderModel->findByOrderId($orderId);

                                    if ($existingOrder) {
                                        $orderModel->update($existingOrder['_id'], [
                                            'paymentStatus' => 'paid',
                                            'mpesaCode' => $receiptNumber,
                                            'totalPaid' => $mpesaAmount,
                                            'verified' => true
                                        ]);
                                        error_log("✅ Order $orderId updated with successful STK Push payment.");
                                        
                                        // Update Inventory
                                        try {
                                            $items = $existingOrder['items'] ?? [];
                                            if (!is_array($items) && !empty($items)) {
                                                $items = json_decode($items, true);
                                            }
                                            
                                            if (is_array($items)) {
                                                $productModel = new Product();
                                                foreach ($items as $item) {
                                                    $productId = $item['id'] ?? $item['_id'] ?? null;
                                                    $quantity = (int)($item['quantity'] ?? 1);
                                                    
                                                    if ($productId) {
                                                        $productModel->decrementQuantity($productId, $quantity);
                                                        error_log("📉 Decremented inventory for product $productId by $quantity");
                                                    }
                                                }
                                            }
                                        } catch (\Exception $invEx) {
                                            error_log("⚠️ Warning: Failed to update inventory for order $orderId: " . $invEx->getMessage());
                                        }
                                    }
                                } catch (\Exception $e) {
                                    error_log('❌ Webhook: Error updating order: ' . $e->getMessage());
                                }
                            }
                        } else {
                            $transactionModel->create([
                                'receiptNumber' => $receiptNumber,
                                'amount' => $mpesaAmount,
                                'phoneNumber' => $phoneNumber,
                                'merchantRequestID' => $callback['MerchantRequestID'] ?? '',
                                'checkoutRequestID' => $checkoutRequestID,
                                'resultCode' => 0,
                                'resultDesc' => 'Success',
                                'transactionDate' => date('Y-m-d H:i:s')
                            ]);
                        }
                    } else if ($existingTransaction) {
                        $transactionModel->update($existingTransaction['_id'], [
                            'resultCode' => $resultCode,
                            'resultDesc' => $callback['ResultDesc'] ?? 'Failed'
                        ]);
                    }
                } elseif (isset($data['TransID'])) {
                    // C2B Confirmation or Validation
                    $receiptNumber = $data['TransID'];
                    $mpesaAmount = (float)$data['TransAmount'];
                    $phoneNumber = $data['MSISDN'];
                    $orderId = $data['BillRefNumber']; // Usually contains order ID

                    error_log("💰 C2B Notification Received: Receipt $receiptNumber, Amount $mpesaAmount, Order $orderId");

                    $transactionModel = new MpesaTransaction();
                    
                    // Check if already processed
                    $existing = $transactionModel->findByReceiptNumber($receiptNumber);
                    if (!$existing) {
                        $transactionModel->create([
                            'receiptNumber' => $receiptNumber,
                            'amount' => $mpesaAmount,
                            'phoneNumber' => $phoneNumber,
                            'orderId' => $orderId,
                            'resultCode' => 0,
                            'resultDesc' => 'C2B Payment',
                            'transactionDate' => date('Y-m-d H:i:s')
                        ]);

                        // Update order if orderId matches
                        if (!empty($orderId)) {
                            try {
                                $orderModel = new App\Models\Order();
                                $existingOrder = $orderModel->findByOrderId($orderId);
                                if ($existingOrder) {
                                    $orderModel->update($existingOrder['_id'], [
                                        'paymentStatus' => 'paid',
                                        'mpesaCode' => $receiptNumber,
                                        'totalPaid' => $mpesaAmount,
                                        'verified' => true
                                    ]);
                                    error_log("✅ Order $orderId updated with successful C2B payment.");
                                    
                                    // Update Inventory
                                    try {
                                        $items = $existingOrder['items'] ?? [];
                                        if (!is_array($items) && !empty($items)) {
                                            $items = json_decode($items, true);
                                        }
                                        
                                        if (is_array($items)) {
                                            $productModel = new Product();
                                            foreach ($items as $item) {
                                                $productId = $item['id'] ?? $item['_id'] ?? null;
                                                $quantity = (int)($item['quantity'] ?? 1);
                                                
                                                if ($productId) {
                                                    $productModel->decrementQuantity($productId, $quantity);
                                                    error_log("📉 C2B: Decremented inventory for product $productId by $quantity");
                                                }
                                            }
                                        }
                                    } catch (\Exception $invEx) {
                                        error_log("⚠️ Warning: C2B: Failed to update inventory for order $orderId: " . $invEx->getMessage());
                                    }
                                }
                            } catch (\Exception $e) {
                                error_log('❌ C2B Webhook: Error updating order: ' . $e->getMessage());
                            }
                        }
                    }
                }
                
                // Always respond success to M-Pesa
                echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Success']);
            } elseif ($action === 'stk-push') {
                // Initiate STK Push
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaService = new MpesaService();
                
                $orderId = $data['orderId'] ?? null;
                
                if (!$orderId) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Order ID is required for STK Push.'
                    ]);
                    break;
                }
                
                $result = $mpesaService->initiateSTKPush(
                    $data['phoneNumber'] ?? '',
                    $orderId, // Pass orderId instead of amount
                    $data['accountReference'] ?? 'TrendyDresses',
                    $data['transactionDesc'] ?? 'Payment for order ' . $orderId
                );
                
                // Save pending transaction
                if (isset($result['CheckoutRequestID'])) {
                    $transactionModel = new MpesaTransaction();
                    try {
                        $transactionModel->create([
                            'phoneNumber' => $data['phoneNumber'] ?? '',
                            'amount' => $data['amount'] ?? 0,
                            'merchantRequestID' => $result['MerchantRequestID'] ?? '',
                            'checkoutRequestID' => $result['CheckoutRequestID'],
                            'orderId' => $orderId, // Save orderId with pending transaction
                            'transactionDate' => date('Y-m-d H:i:s')
                            // receiptNumber will be auto-generated as PENDING_...
                        ]);
                    } catch (\Exception $e) {
                        error_log("Error saving pending transaction: " . $e->getMessage());
                    }
                }
                
                // Return result with success flag
                $result['success'] = isset($result['ResponseCode']) && $result['ResponseCode'] === '0';
                echo json_encode($result);
            } elseif ($action === 'stk-push-status') {
                // Query STK Push status
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaService = new MpesaService();
                $result = $mpesaService->querySTKPushStatus($data['checkoutRequestID'] ?? '');
                echo json_encode($result);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $e->getMessage()
    ]);
    error_log("M-Pesa API Error: " . $e->getMessage());
}


