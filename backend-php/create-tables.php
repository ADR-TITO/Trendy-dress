<?php
/**
 * Create Database Tables Manually
 * Run this if tables don't auto-create
 * Visit: https://trendydresses.co.ke/backend-php/create-tables.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'tables_created' => [],
    'errors' => []
];

try {
    if (!Database::isConnected()) {
        $result['errors'][] = 'Database not connected';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    
    $pdo = Database::getConnection();
    
    // Products table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            size VARCHAR(50),
            quantity INT DEFAULT 0,
            image LONGTEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $result['tables_created'][] = 'products';
    } catch (Exception $e) {
        $result['errors'][] = 'Products table: ' . $e->getMessage();
    }
    
    // Orders table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            orderId VARCHAR(100) UNIQUE NOT NULL,
            customerName VARCHAR(255) NOT NULL,
            customerPhone VARCHAR(50) NOT NULL,
            customerEmail VARCHAR(255),
            items LONGTEXT NOT NULL,
            totalAmount DECIMAL(10, 2) NOT NULL,
            paymentMethod VARCHAR(50),
            mpesaCode VARCHAR(100),
            deliveryStatus VARCHAR(50) DEFAULT 'pending',
            deliveredBy VARCHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_orderId (orderId),
            INDEX idx_deliveryStatus (deliveryStatus),
            INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $result['tables_created'][] = 'orders';
    } catch (Exception $e) {
        $result['errors'][] = 'Orders table: ' . $e->getMessage();
    }
    
    // M-Pesa transactions table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS mpesa_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            receiptNumber VARCHAR(100) UNIQUE NOT NULL,
            transactionDate DATETIME NOT NULL,
            phoneNumber VARCHAR(50),
            amount DECIMAL(10, 2) NOT NULL,
            merchantRequestID VARCHAR(255),
            checkoutRequestID VARCHAR(255),
            resultCode INT,
            resultDesc VARCHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_receiptNumber (receiptNumber),
            INDEX idx_transactionDate (transactionDate),
            INDEX idx_checkoutRequestID (checkoutRequestID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $result['tables_created'][] = 'mpesa_transactions';
    } catch (Exception $e) {
        $result['errors'][] = 'Mpesa transactions table: ' . $e->getMessage();
    }
    
    $result['success'] = count($result['errors']) === 0;
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);

