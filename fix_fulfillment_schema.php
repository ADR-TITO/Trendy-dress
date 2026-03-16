<?php
/**
 * Unified Schema Fix for M-Pesa Fulfillment
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
    echo "Connected to database: " . $_ENV['DB_NAME'] . "\n\n";

    echo "Checking 'orders' table...\n";
    $cols = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
    
    $to_add = [
        'totalPaid' => "DECIMAL(10, 2) DEFAULT 0.00 AFTER totalAmount",
        'paymentStatus' => "VARCHAR(50) DEFAULT 'pending' AFTER paymentMethod",
        'mpesaCode' => "VARCHAR(100) AFTER paymentStatus",
        'verified' => "BOOLEAN DEFAULT FALSE AFTER deliveredBy"
    ];

    foreach ($to_add as $col => $definition) {
        if (!in_array($col, $cols)) {
            echo "Adding column '$col'...\n";
            $pdo->exec("ALTER TABLE orders ADD COLUMN $col $definition");
        } else {
            echo "Column '$col' already exists.\n";
        }
    }

    echo "\nChecking 'mpesa_transactions' table...\n";
    $cols_tx = $pdo->query("DESCRIBE mpesa_transactions")->fetchAll(PDO::FETCH_COLUMN);
    
    // Ensure receiptNumber can be NULL for pending transactions (often researchers use a temp value, but Safaricom might not provide it yet)
    // Actually our code uses PENDING_... so it's not NULL, but maybe the UNIQUE constraint is causing issues?
    // No, PENDING_CheckoutRequestID should be unique.
    
    echo "Schema check complete!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
