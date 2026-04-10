
<?php
// check_status.php

header('Content-Type: application/json');

// Database connection
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
} catch (Exception $e) {
    error_log("Payment status check connection failed: " . $e->getMessage());
    die(json_encode(['success' => false, 'message' => "An internal error occurred."]));
}

if (isset($_GET['checkout_request_id'])) {
    $checkout_request_id = $_GET['checkout_request_id'];
    
    $sql = "SELECT resultCode as status, receiptNumber as mpesa_receipt, amount FROM mpesa_transactions WHERE checkoutRequestID = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$checkout_request_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        if ($row['status'] == '0' && !empty($row['mpesa_receipt']) && strpos($row['mpesa_receipt'], 'PENDING') === false) {
            echo json_encode([
                'success' => true,
                'status' => 'COMPLETED',
                'message' => 'Payment completed successfully',
                'mpesa_receipt' => $row['mpesa_receipt'],
                'amount' => $row['amount']
            ]);
        } elseif ($row['status'] == 'FAILED') {
            echo json_encode([
                'success' => false,
                'status' => 'FAILED',
                'message' => 'Payment failed'
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
            'message' => 'Transaction not found'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Missing checkout_request_id parameter'
    ]);
}
?>