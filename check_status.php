<?php
// check_status.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Database connection
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
} catch (Exception $e) {
    error_log("Payment status check connection failed: " . $e->getMessage());
    die(json_encode(['success' => false, 'status' => 'ERROR', 'message' => "An internal error occurred."]));
}

if (isset($_GET['checkout_request_id']) && !empty($_GET['checkout_request_id'])) {
    $checkout_request_id = trim($_GET['checkout_request_id']);
    
    $sql = "SELECT resultCode, receiptNumber as mpesa_receipt, amount, resultDesc FROM mpesa_transactions WHERE checkoutRequestID = ? ORDER BY id DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$checkout_request_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        $resultCode = $row['resultCode'];
        $receipt = $row['mpesa_receipt'] ?? '';
        $resultDesc = $row['resultDesc'] ?? '';
        $amount = (float)($row['amount'] ?? 0);

        if ($resultCode !== null && (int)$resultCode === 0 && !empty($receipt) && strpos($receipt, 'PENDING') === false) {
            echo json_encode([
                'success' => true,
                'status' => 'COMPLETED',
                'resultCode' => 0,
                'message' => 'Payment completed successfully',
                'mpesa_receipt' => $receipt,
                'amount' => $amount
            ]);
        } elseif ($resultCode !== null && (int)$resultCode !== 0) {
            echo json_encode([
                'success' => false,
                'status' => 'FAILED',
                'resultCode' => (int)$resultCode,
                'message' => $resultDesc ?: 'Payment was cancelled or failed',
                'error' => $resultDesc ?: 'Payment failed'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'status' => 'PENDING',
                'message' => 'Payment is still pending'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'status' => 'PENDING',
            'message' => 'Transaction not found yet, still waiting'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'status' => 'ERROR',
        'message' => 'Missing checkout_request_id parameter'
    ]);
}
?>