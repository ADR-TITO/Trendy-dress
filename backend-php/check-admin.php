<?php
/**
 * Check Admin Status
 * This script checks the current admin accounts in the database
 * 
 * Visit: https://trendydresses.co.ke/backend-php/check-admin.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'database_connected' => false,
    'admins_table_exists' => false,
    'admin_count' => 0,
    'admins' => [],
    'errors' => []
];

try {
    // Check database connection
    if (!Database::isConnected()) {
        $result['errors'][] = 'Database not connected';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    
    $result['database_connected'] = true;
    $pdo = Database::getConnection();
    
    // Check if admins table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($tableCheck->rowCount() > 0) {
        $result['admins_table_exists'] = true;
        
        // Get all admins (without password hashes for security)
        $stmt = $pdo->query("SELECT id, username, createdAt, updatedAt FROM admins");
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $result['admin_count'] = count($admins);
        $result['admins'] = $admins;
        
        // Test password verification for 'admin' user
        $stmt = $pdo->prepare("SELECT password_hash FROM admins WHERE username = :username");
        $stmt->execute([':username' => 'admin']);
        $adminData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($adminData) {
            // Test if 'admin123' works
            $testPassword = 'admin123';
            $passwordMatches = password_verify($testPassword, $adminData['password_hash']);
            $result['password_test'] = [
                'username' => 'admin',
                'test_password' => $testPassword,
                'matches' => $passwordMatches,
                'hash_info' => password_get_info($adminData['password_hash'])
            ];
        }
    } else {
        $result['errors'][] = 'Admins table does not exist. Run create-tables.php first.';
    }
    
    $result['success'] = true;
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
