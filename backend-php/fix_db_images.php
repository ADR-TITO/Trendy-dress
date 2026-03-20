<?php
/**
 * Fix Database Image Truncation
 * Run this to upgrade TEXT columns to LONGTEXT
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'actions' => [],
    'errors' => []
];

try {
    if (!Database::isConnected()) {
        $result['errors'][] = 'Database not connected';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    
    $pdo = Database::getConnection();
    
    // 1. Fix Products table
    try {
        $pdo->exec("ALTER TABLE products MODIFY COLUMN image LONGTEXT");
        $result['actions'][] = 'Upgraded products.image to LONGTEXT';
    } catch (Exception $e) {
        $result['errors'][] = 'Products table fix: ' . $e->getMessage();
    }
    
    // 2. Fix Orders table
    try {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN items LONGTEXT");
        $result['actions'][] = 'Upgraded orders.items to LONGTEXT';
    } catch (Exception $e) {
        $result['errors'][] = 'Orders table fix: ' . $e->getMessage();
    }
    
    $result['success'] = count($result['errors']) === 0;
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
