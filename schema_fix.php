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

    // 2. Identify and Drop ANY existing Primary Key
    $pkColumn = null;
    foreach ($columns as $col) {
        if ($col['Key'] === 'PRI') {
            $pkColumn = $col['Field'];
            break;
        }
    }

    if ($pkColumn) {
        echo "- Found existing Primary Key on '$pkColumn'. Dropping constraint...\n";
        try {
            // First, if it's auto_increment, we MUST remove that property before dropping the key
            $idColInfo = null;
            foreach($columns as $c) if($c['Field'] === $pkColumn) $idColInfo = $c;
            
            if (strpos($idColInfo['Extra'], 'auto_increment') !== false) {
                 // We modify it back to a plain type to drop auto_increment
                 $plainType = $idColInfo['Type'];
                 $pdo->exec("ALTER TABLE mpesa_transactions MODIFY $pkColumn $plainType");
            }
            
            $pdo->exec("ALTER TABLE mpesa_transactions DROP PRIMARY KEY");
            echo "  Successfully dropped Primary Key constraint.\n";
        } catch (Exception $e) {
            echo "  ⚠️ Note: Could not drop PK directly: " . $e->getMessage() . " (It might already be gone or handled differently)\n";
        }
    }

    // 3. Ensure we have a proper 'id' column with INT AUTO_INCREMENT PRIMARY KEY
    $idExists = in_array('id', $columnNames);
    
    if ($idExists) {
        echo "- 'id' exists. Converting to Primary Key INT AUTO_INCREMENT...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions MODIFY id INT AUTO_INCREMENT PRIMARY KEY");
        echo "  Done.\n";
    } else {
        echo "- Missing 'id' column. Creating fresh 'id' as Primary Key...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST");
        echo "  Done.\n";
    }
    
    // Clean up 'old_id' if it exists to avoid confusion later
    if (in_array('old_id', $columnNames)) {
        echo "- Cleaning up 'old_id' column...\n";
        $pdo->exec("ALTER TABLE mpesa_transactions DROP COLUMN old_id");
        echo "  Done.\n";
    }

    // Final Validation
    echo "\nFinal Result:\n";
    $finalCols = $pdo->query("SHOW COLUMNS FROM mpesa_transactions")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($finalCols as $col) {
        echo "{$col['Field']} ({$col['Type']}) - PK: " . ($col['Key'] === 'PRI' ? 'YES' : 'NO') . " | Extra: {$col['Extra']}\n";
    }

    echo "\n✨ SUCCESS! Your database is now perfectly configured. Please try the checkout again.";

} catch (Exception $e) {
    echo "\n❌ FATAL ERROR: " . $e->getMessage() . "\n";
}
?>
