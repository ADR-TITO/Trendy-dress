<?php
/**
 * Fix Orders Table
 * Adds missing columns for M-Pesa status tracking
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'added_columns' => [],
    'errors' => []
];

try {
    if (!Database::isConnected()) {
        throw new Exception('Database not connected');
    }
    
    $pdo = Database::getConnection();
    
    // Check existing columns
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $toAdd = [
        'paymentStatus' => "VARCHAR(50) DEFAULT 'pending' AFTER paymentMethod",
        'totalPaid' => "DECIMAL(10, 2) DEFAULT 0.00 AFTER mpesaCode",
        'verified' => "TINYINT(1) DEFAULT 0 AFTER totalPaid"
    ];
    
    foreach ($toAdd as $column => $definition) {
        if (!in_array($column, $columns)) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN $column $definition");
            $result['added_columns'][] = $column;
        }
    }

    // Check for index
    $stmt = $pdo->query("SHOW INDEX FROM orders WHERE Key_name = 'idx_paymentStatus'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("CREATE INDEX idx_paymentStatus ON orders(paymentStatus)");
        $result['added_columns'][] = 'index:idx_paymentStatus';
    }
    
    // Also check mpesa_transactions for orderId just in case
    $stmt = $pdo->query("DESCRIBE mpesa_transactions");
    $mpesaColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('orderId', $mpesaColumns)) {
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN orderId VARCHAR(255) AFTER checkoutRequestID");
        $result['added_columns'][] = 'mpesa_transactions.orderId';
    }
    
    $result['success'] = true;
    $result['message'] = empty($result['added_columns']) ? 'Database schema is already up to date.' : 'Database schema updated successfully.';
    
} catch (Exception $e) {
    $result['success'] = false;
    $result['errors'][] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
