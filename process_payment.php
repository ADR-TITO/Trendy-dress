<?php
// process_payment.php

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

    // Get input data
    $phone_number = $_POST['phoneNumber'] ?? '';
    $amount = $_POST['amount'] ?? 0;
    $order_id = $_POST['orderId'] ?? ('ORDER_' . time()); // Fallback for testing

    if (empty($phone_number) || empty($amount)) {
        throw new Exception("Phone number and amount are required.");
    }

    // Use the central MpesaService
    $mpesaService = new \App\Services\MpesaService();
    
    // The service fetches amount from DB based on orderId, but we can also pass it
    // For process_payment.php (used by frontend), we initiate STK push
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
            'checkout_request_id' => $result['CheckoutRequestID'] ?? ''
        ]);
    } else {
        $detail = $result['errorMessage'] ?? $result['CustomerMessage'] ?? json_encode($result);
        echo json_encode(['success' => false, 'message' => 'M-Pesa Error: ' . $detail, 'debug' => $result]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
?>