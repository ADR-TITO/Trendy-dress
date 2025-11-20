<?php
/**
 * Update Database Schema
 * Run this to fix the image column size issue
 * Visit: https://trendydresses.co.ke/backend-php/update-schema.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'success' => false,
    'updates' => [],
    'errors' => []
];

try {
    if (!Database::isConnected()) {
        throw new Exception('Database not connected');
    }
    
    $pdo = Database::getConnection();
    
    // 1. Update products table image column to LONGTEXT
    try {
        $pdo->exec("ALTER TABLE products MODIFY COLUMN image LONGTEXT");
        $result['updates'][] = 'Updated products.image to LONGTEXT';
    } catch (Exception $e) {
        $result['errors'][] = 'Failed to update products table: ' . $e->getMessage();
    }
    
    // 2. Update orders table items column to LONGTEXT (just in case)
    try {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN items LONGTEXT");
        $result['updates'][] = 'Updated orders.items to LONGTEXT';
    } catch (Exception $e) {
        $result['errors'][] = 'Failed to update orders table: ' . $e->getMessage();
    }

    $result['success'] = count($result['errors']) === 0;
    $result['message'] = $result['success'] ? 'Schema updated successfully' : 'Schema update completed with errors';
    
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
    $result['message'] = 'Fatal error during update';
}

echo json_encode($result, JSON_PRETTY_PRINT);
