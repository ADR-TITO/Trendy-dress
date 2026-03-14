<?php
// schema_fix.php
header('Content-Type: text/plain');
require_once __DIR__ . '/backend-php/config/database.php';

try {
    $pdo = Database::getConnection();
    echo "--- Database Connection: OK ---\n\n";

    echo "Checking 'mpesa_transactions' table structure...\n";
    $columns = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    echo "Current columns: " . implode(', ', $columnNames) . "\n\n";

    // 1. Ensure orderId exists
    if (!in_array('orderId', $columnNames)) {
        echo "- Adding 'orderId' column...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN orderId VARCHAR(255) NULL");
        echo "  Done.\n";
    }

    // 2. Fix the 'id' column logic
    $idExists = in_array('id', $columnNames);
    $oldIdExists = in_array('old_id', $columnNames);

    if ($idExists) {
        $idCol = null;
        foreach($columns as $c) if($c['Field'] === 'id') $idCol = $c;
        
        if (strpos($idCol['Type'], 'int') === false || strpos($idCol['Extra'], 'auto_increment') === false) {
            echo "- 'id' exists but is wrong type ({$idCol['Type']}). Fixing...\n";
            try {
                if (!empty($idCol['Key'])) {
                    echo "  - Dropping existing Primary Key first...\n";
                    $pdo->exec("ALTER TABLE mpesa_transactions DROP PRIMARY KEY");
                }
                $pdo->exec("ALTER TABLE mpesa_transactions MODIFY id INT AUTO_INCREMENT PRIMARY KEY");
                echo "  Done.\n";
            } catch (Exception $e) {
                echo "  ⚠️ Direct fix failed: " . $e->getMessage() . "\n";
                echo "  Attempting Rename-and-Recreate strategy...\n";
                $pdo->exec("ALTER TABLE mpesa_transactions CHANGE id old_id VARCHAR(255)");
                $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
                echo "  Done.\n";
            }
        } else {
            echo "- 'id' column is already correct (INT AUTO_INCREMENT).\n";
        }
    } else if ($oldIdExists) {
        echo "- 'id' is missing but 'old_id' was found. Creating new 'id' column...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
        echo "  Done.\n";
    } else {
        echo "- 'id' is missing. Creating fresh 'id' column...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
        echo "  Done.\n";
    }

    // 3. Final Check
    echo "\nFinal Schema Update:\n";
    $finalCols = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($finalCols as $col) {
        echo "{$col['Field']} ({$col['Type']}) - PK: " . ($col['Key'] === 'PRI' ? 'YES' : 'NO') . "\n";
    }

    echo "\n✨ Database fixed! Please try the checkout again.";

} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
}
?>
