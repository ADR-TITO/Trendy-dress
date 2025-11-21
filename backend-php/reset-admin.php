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
    
    // Check if any admin exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM admins");
    $adminCount = $stmt->fetchColumn();
    
    if ($adminCount == 0) {
        // No admins exist - create new one
        $stmt = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (:username, :password)");
        $stmt->execute([':username' => $defaultUsername, ':password' => $passwordHash]);
        $result['message'] .= 'Default admin created successfully.';
    } else {
        // Admins exist - reset the first one (or the one with username 'admin')
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $defaultUsername]);
        $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAdmin) {
            // Update existing admin with username 'admin'
            $stmt = $pdo->prepare("UPDATE admins SET password_hash = :password WHERE id = :id");
            $stmt->execute([':password' => $passwordHash, ':id' => $existingAdmin['id']]);
            $result['message'] .= 'Admin password reset successfully.';
        } else {
            // No admin with username 'admin' - update the first admin to have username 'admin'
            $stmt = $pdo->query("SELECT id FROM admins ORDER BY id ASC LIMIT 1");
            $firstAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($firstAdmin) {
                $stmt = $pdo->prepare("UPDATE admins SET username = :username, password_hash = :password WHERE id = :id");
                $stmt->execute([
                    ':username' => $defaultUsername,
                    ':password' => $passwordHash,
                    ':id' => $firstAdmin['id']
                ]);
                $result['message'] .= 'Admin credentials reset successfully.';
            }
        }
    }
    
    $result['success'] = true;
    $result['credentials'] = [
        'username' => $defaultUsername,
        'password' => $defaultPassword,
        'note' => 'You can change these credentials from the Admin Panel > Settings tab after logging in'
    ];
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
    $result['message'] = 'Error resetting admin credentials';
}

echo json_encode($result, JSON_PRETTY_PRINT);
