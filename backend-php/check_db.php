<?php
require_once __DIR__ . '/config/database.php';

try {
    if (!Database::isConnected()) {
        echo "Database not connected\n";
        exit;
    }
    
    $pdo = Database::getConnection();
    
    echo "--- mpesa_transactions table structure ---\n";
    $stmt = $pdo->query("DESCRIBE mpesa_transactions");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Field: {$row['Field']}, Type: {$row['Type']}, Null: {$row['Null']}, Key: {$row['Key']}\n";
    }
    
    echo "\n--- orders table structure ---\n";
    $stmt = $pdo->query("DESCRIBE orders");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Field: {$row['Field']}, Type: {$row['Type']}, Null: {$row['Null']}, Key: {$row['Key']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
