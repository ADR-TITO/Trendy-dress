<?php
// schema_fix.php
header('Content-Type: text/plain');
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
    echo "--- Database Connection: OK ---\n\n";

    echo "Fixing 'mpesa_transactions' table...\n";

    // 1. Check for orderId column
    $columns = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('orderId', $columns)) {
        echo "- Adding 'orderId' column...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN orderId VARCHAR(255) AFTER checkoutRequestID");
        echo "  Done.\n";
    } else {
        echo "- 'orderId' column already exists.\n";
    }

    // 2. Fix 'id' column if it's not auto_increment INT
    $idInfo = $pdo->query("SHOW COLUMNS FROM mpesa_transactions WHERE Field = 'id'")->fetch(PDO::FETCH_ASSOC);
    if (strpos($idInfo['Type'], 'int') === false || strpos($idInfo['Extra'], 'auto_increment') === false) {
        echo "- Fixing 'id' column to INT AUTO_INCREMENT...\n";
        // We might need to drop primary key and re-add if it's already a primary key but varchar
        try {
            // Step 1: Remove existing Primary Key if necessary
            // (Assuming 'id' is currently the PK based on normal patterns)
            
            // Step 2: Change type
            $pdo->exec("ALTER TABLE mpesa_transactions MODIFY id INT AUTO_INCREMENT PRIMARY KEY");
            echo "  Done.\n";
        } catch (Exception $pkEx) {
            echo "  ⚠️ Could not modify 'id' automatically: " . $pkEx->getMessage() . "\n";
            echo "  Trying alternative fix (rename old id and create new one)...\n";
            $pdo->exec("ALTER TABLE mpesa_transactions CHANGE id old_id VARCHAR(255)");
            $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
            echo "  Done (Old IDs preserved in 'old_id' column).\n";
        }
    } else {
        echo "- 'id' column is already INT AUTO_INCREMENT.\n";
    }

    echo "\nFinal Schema Update:\n";
    $finalCols = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($finalCols as $col) {
        echo "{$col['Field']} ({$col['Type']}) - Null: {$col['Null']} | Key: {$col['Key']} | Extra: {$col['Extra']}\n";
    }

    echo "\n✨ Schema repair complete. Please try the checkout again.";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
