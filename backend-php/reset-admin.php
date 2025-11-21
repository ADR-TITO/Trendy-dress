<?php
/**
 * Reset Admin Credentials
 * This script resets the admin credentials to default values
 * Default: username = admin, password = admin123
 * 
 * Visit: https://trendydresses.co.ke/backend-php/reset-admin.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'message' => '',
    'errors' => []
];

try {
    if (!Database::isConnected()) {
        $result['errors'][] = 'Database not connected';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    
    $pdo = Database::getConnection();
    
    // Default credentials
    $defaultUsername = 'admin';
    $defaultPassword = 'admin123';
    $passwordHash = password_hash($defaultPassword, PASSWORD_DEFAULT);
    
    // Check if admins table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($tableCheck->rowCount() == 0) {
        // Create admins table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $result['message'] .= 'Admins table created. ';
    }
    
    // DELETE ALL existing admins to start fresh
    $pdo->exec("DELETE FROM admins");
    $result['message'] .= 'All existing admins deleted. ';
    
    // Create fresh admin account
    $stmt = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (:username, :password)");
    $stmt->execute([':username' => $defaultUsername, ':password' => $passwordHash]);
    $result['message'] .= 'Fresh admin account created successfully.';
    
    // Verify the account was created correctly
    $stmt = $pdo->prepare("SELECT id, username FROM admins WHERE username = :username");
    $stmt->execute([':username' => $defaultUsername]);
    $verifyAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($verifyAdmin) {
        $result['message'] .= ' Admin account verified.';
        $result['admin_id'] = $verifyAdmin['id'];
    }
    
    $result['success'] = true;
    $result['credentials'] = [
        'username' => $defaultUsername,
        'password' => $defaultPassword,
        'note' => 'You can change these credentials from the Admin Panel > Settings tab after logging in'
    ];
    $result['instructions'] = [
        '1. Go to your website',
        '2. Click the "Login" button',
        '3. Enter username: admin',
        '4. Enter password: admin123',
        '5. Click Login'
    ];
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
    $result['message'] = 'Error resetting admin credentials';
}

echo json_encode($result, JSON_PRETTY_PRINT);
