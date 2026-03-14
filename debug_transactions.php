<?php
// debug_transactions.php
header('Content-Type: text/plain');
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
    echo "--- Database Connection: OK ---\n\n";
    
    echo "--- Tables ---\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    echo "\n--- Recent M-Pesa Transactions ---\n";
    $sql = "SELECT * FROM mpesa_transactions ORDER BY createdAt DESC LIMIT 10";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($rows)) {
        echo "No transactions found in mpesa_transactions table.\n";
    } else {
        foreach ($rows as $row) {
            print_r($row);
        }
    }

    echo "\n--- Recent Orders ---\n";
    $sql = "SELECT id, orderId, paymentStatus, totalAmount, createdAt FROM orders ORDER BY createdAt DESC LIMIT 5";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        print_r($row);
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
