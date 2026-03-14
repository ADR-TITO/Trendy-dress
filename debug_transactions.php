<?php
// debug_transactions.php
header('Content-Type: text/plain');
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
    echo "--- Database Connection: OK ---\n";
    echo "DB Status: " . json_encode(Database::getStatus()) . "\n\n";
    
    echo "--- Table Schema: mpesa_transactions ---\n";
    $columns = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "{$col['Field']} ({$col['Type']}) - Null: {$col['Null']}\n";
    }
    
    echo "\n--- Recent M-Pesa Transactions (Last 5) ---\n";
    $sql = "SELECT * FROM mpesa_transactions ORDER BY createdAt DESC LIMIT 5";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($rows)) {
        echo "No transactions found.\n";
    } else {
        foreach ($rows as $row) {
            echo "ID: {$row['id']} | Result: {$row['resultCode']} | Receipt: {$row['receiptNumber']} | CheckoutID: {$row['checkoutRequestID']} | Order: {$row['orderId']}\n";
            echo "ResultDesc: {$row['resultDesc']}\n";
            echo "-----------------------------------\n";
        }
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
