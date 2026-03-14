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
        
        try {
            // Step 1: Drop primary key if exists (to avoid "Multiple primary key" error)
            if (!empty($idInfo['Key'])) {
                echo "  - Dropping existing Primary Key...\n";
                // In MySQL/MariaDB, we drop the PK constraint
                $pdo->exec("ALTER TABLE mpesa_transactions DROP PRIMARY KEY");
            }
            
            // Step 2: Convert id to INT AUTO_INCREMENT and set as PRIMARY KEY
            // Note: We use CHANGE if we want to change name/type, but MODIFY is fine for changing type of existing column
            $pdo->exec("ALTER TABLE mpesa_transactions MODIFY id INT AUTO_INCREMENT PRIMARY KEY");
            echo "  Done.\n";
        } catch (Exception $pkEx) {
            echo "  ⚠️ Automatic fix failed: " . $pkEx->getMessage() . "\n";
            echo "  Trying manual multi-step fix...\n";
            // If modify fails, try renaming and adding fresh
            $pdo->exec("ALTER TABLE mpesa_transactions CHANGE id old_id VARCHAR(255)");
            $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
            echo "  Done (New column created, old column kept as 'old_id').\n";
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
