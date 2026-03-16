<?php
require_once __DIR__ . '/backend-php/config/database.php';
header('Content-Type: text/plain');
try {
    $pdo = Database::getConnection();
    echo "--- Recent M-Pesa Transactions ---\n";
    $stmt = $pdo->query("SELECT * FROM mpesa_transactions ORDER BY transactionDate DESC LIMIT 10");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
    echo "\n--- Recent Orders ---\n";
    $stmt = $pdo->query("SELECT orderId, paymentStatus, mpesaCode, verified, createdAt FROM orders ORDER BY createdAt DESC LIMIT 10");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
