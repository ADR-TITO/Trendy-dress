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

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$action = $routeParts[1] ?? null;

try {
    if (!Database::isConnected()) {
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
            if ($action === 'webhook') {
                // M-Pesa webhook
                $data = json_decode(file_get_contents('php://input'), true);
                
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
                        $amount = 0;
                        $phoneNumber = '';
                        
                        foreach ($metadata as $item) {
                            if ($item['Name'] === 'MpesaReceiptNumber') {
                                $receiptNumber = $item['Value'] ?? '';
                            } elseif ($item['Name'] === 'Amount') {
                                $amount = (float)($item['Value'] ?? 0);
                            } elseif ($item['Name'] === 'PhoneNumber') {
                                $phoneNumber = $item['Value'] ?? '';
                            }
                        }
                        
                        if ($existingTransaction) {
                            // Update existing pending transaction
                            $transactionModel->update($existingTransaction['_id'], [
                                'receiptNumber' => $receiptNumber,
                                'amount' => $amount,
                                'phoneNumber' => $phoneNumber,
                                'resultCode' => 0,
                                'resultDesc' => 'Success'
                            ]);
                        } else {
                            // Create new transaction (fallback)
                            $transactionModel->create([
                                'receiptNumber' => $receiptNumber,
                                'amount' => $amount,
                                'phoneNumber' => $phoneNumber,
                                'merchantRequestID' => $callback['MerchantRequestID'] ?? '',
                                'checkoutRequestID' => $checkoutRequestID,
                                'resultCode' => 0,
                                'resultDesc' => 'Success',
                                'transactionDate' => date('Y-m-d H:i:s')
                            ]);
                        }
                    } else {
                        // Payment failed or cancelled
                        if ($existingTransaction) {
                            $transactionModel->update($existingTransaction['_id'], [
                                'resultCode' => $resultCode,
                                'resultDesc' => $callback['ResultDesc'] ?? 'Failed'
                            ]);
                        }
                    }
                }
                
                // Always respond success to M-Pesa
                echo json_encode([
                    'ResultCode' => 0,
                    'ResultDesc' => 'Success'
                ]);
            } elseif ($action === 'stk-push') {
                // Initiate STK Push
                $data = json_decode(file_get_contents('php://input'), true);
                $mpesaService = new MpesaService();
                
                $result = $mpesaService->initiateSTKPush(
                    $data['phoneNumber'] ?? '',
                    $data['amount'] ?? 0,
                    $data['accountReference'] ?? 'TrendyDresses',
                    $data['transactionDesc'] ?? 'Payment for order'
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


