<?php
// process_payment.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    // Autoload classes (Simple autoloader for App namespace)
    spl_autoload_register(function ($class) {
        if (strpos($class, 'App\\') === 0) {
            $class = substr($class, 4); // Remove 'App\' prefix
        }
        $file = __DIR__ . '/backend-php/src/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    });

    // Database connection
    require_once __DIR__ . '/backend-php/config/database.php';
    $pdo = Database::getConnection();

    // Get input data (support both FormData and JSON)
    $jsonData = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $phone_number = $_POST['phoneNumber'] ?? $jsonData['phoneNumber'] ?? '';
    $amount = $_POST['amount'] ?? $jsonData['amount'] ?? 0;
    $order_id = $_POST['orderId'] ?? $jsonData['orderId'] ?? ('ORDER_' . time());

    if (empty($phone_number) || empty($amount)) {
        throw new Exception("Phone number and amount are required.");
    }

    // Use the central MpesaService
    $mpesaService = new \App\Services\MpesaService();
    
    $result = $mpesaService->initiateSTKPush(
        $phone_number,
        $order_id,
        'TrendyDresses',
        'Payment for order ' . $order_id,
        (float)$amount
    );

    if (isset($result['ResponseCode']) && $result['ResponseCode'] == "0") {
        echo json_encode([
            'success' => true,
            'message' => 'Payment request sent successfully. Please check your phone.',
            'checkout_request_id' => $result['CheckoutRequestID'] ?? '',
            'checkoutRequestID' => $result['CheckoutRequestID'] ?? '',
            'customerMessage' => $result['CustomerMessage'] ?? 'Success'
        ]);
    } else {
        $detail = $result['errorMessage'] ?? $result['CustomerMessage'] ?? json_encode($result);
        echo json_encode(['success' => false, 'message' => 'M-Pesa Error: ' . $detail, 'debug' => $result]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Payment processing error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage() ?: 'An internal server error occurred while processing your payment.'
    ]);
}
?>