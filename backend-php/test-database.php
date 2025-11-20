<?php
/**
 * Test Database Connection
 * Visit: https://trendydresses.co.ke/backend-php/test-database.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$result = [
    'database_connection' => false,
    'database_status' => null,
    'tables_exist' => [],
    'test_queries' => [],
    'errors' => []
];

try {
    // Check connection
    if (Database::isConnected()) {
        $result['database_connection'] = true;
        $result['database_status'] = Database::getStatus();
        
        $pdo = Database::getConnection();
        
        // Check if tables exist
        $tables = ['products', 'orders', 'mpesa_transactions'];
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
                $exists = $stmt->rowCount() > 0;
                $result['tables_exist'][$table] = $exists;
                
                if ($exists) {
                    // Get row count
                    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                    $count = $countStmt->fetch()['count'];
                    $result['tables_exist'][$table . '_count'] = $count;
                }
            } catch (Exception $e) {
                $result['tables_exist'][$table] = false;
                $result['errors'][] = "Error checking table $table: " . $e->getMessage();
            }
        }
        
        // Test queries
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
            $result['test_queries']['products_count'] = $stmt->fetch()['count'];
        } catch (Exception $e) {
            $result['test_queries']['products_count'] = 'error: ' . $e->getMessage();
        }
        
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM orders");
            $result['test_queries']['orders_count'] = $stmt->fetch()['count'];
        } catch (Exception $e) {
            $result['test_queries']['orders_count'] = 'error: ' . $e->getMessage();
        }
        
    } else {
        $result['errors'][] = 'Database not connected';
        $result['database_status'] = Database::getStatus();
    }
} catch (Exception $e) {
    $result['errors'][] = $e->getMessage();
    $result['error_trace'] = $e->getTraceAsString();
}

echo json_encode($result, JSON_PRETTY_PRINT);

