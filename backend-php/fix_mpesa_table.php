<?php
/**
 * Fix M-Pesa Transactions Table
 * Adds the missing orderId column
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'message' => ''
];

try {
    if (!Database::isConnected()) {
        throw new Exception('Database not connected');
    }
    
    $pdo = Database::getConnection();
    
    // Check if column exists
    $stmt = $pdo->query("DESCRIBE mpesa_transactions");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('orderId', $columns)) {
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN orderId VARCHAR(255) AFTER checkoutRequestID");
        $pdo->exec("CREATE INDEX idx_orderId ON mpesa_transactions(orderId)");
        $result['success'] = true;
        $result['message'] = 'Column orderId added successfully to mpesa_transactions table.';
    } else {
        $result['success'] = true;
        $result['message'] = 'Column orderId already exists in mpesa_transactions table.';
    }
    
} catch (Exception $e) {
    $result['success'] = false;
    $result['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
