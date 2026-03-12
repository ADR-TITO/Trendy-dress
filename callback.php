<?php
// callback.php

// Database connection
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage());
}


function logMessage($message) {
    $logFile = 'transaction_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Get the response from M-Pesa
$mpesa_response = file_get_contents('php://input');
$callbackContent = json_decode($mpesa_response);

logMessage("Received callback: " . $mpesa_response);

// Check if the callback content is valid
if (isset($callbackContent->Body->stkCallback->ResultCode)) {
    $result_code = $callbackContent->Body->stkCallback->ResultCode;
    $checkout_request_id = $callbackContent->Body->stkCallback->CheckoutRequestID;

    if ($result_code == 0) {
        // Payment successful
        $status = 0;
        // Attempt to find the Receipt Number in the metadata
        $mpesa_receipt_number = null;
        if (isset($callbackContent->Body->stkCallback->CallbackMetadata->Item)) {
            foreach ($callbackContent->Body->stkCallback->CallbackMetadata->Item as $item) {
                if ($item->Name === 'MpesaReceiptNumber') {
                    $mpesa_receipt_number = $item->Value;
                    break;
                }
            }
        }
        logMessage("Payment successful: CheckoutRequestID: $checkout_request_id, M-Pesa Receipt: $mpesa_receipt_number");
    } else {
        // Payment failed
        $status = $result_code;
        $mpesa_receipt_number = null;
        logMessage("Payment failed: CheckoutRequestID: $checkout_request_id, Result Code: $result_code");
    }

    // Update the payment status in the database
    $sql = "UPDATE mpesa_transactions SET resultCode = ?, receiptNumber = ? WHERE checkoutRequestID = ?";
    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute([$status, $mpesa_receipt_number, $checkout_request_id])) {
        logMessage("Payment status updated in database: $checkout_request_id - $status");
    } else {
        $errorInfo = $stmt->errorInfo();
        logMessage("Error updating payment status: " . ($errorInfo[2] ?? 'Unknown error'));
    }
} else {
    logMessage("Invalid callback content received");
}

$conn->close();

// Respond to M-Pesa
$response = array(
    'ResultCode' => 0,
    'ResultDesc' => 'Confirmation received successfully'
);
header('Content-Type: application/json');
echo json_encode($response);
?>