<?php
/**
 * Create / Verify Database Tables Endpoint
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';

try {
    if (!Database::isConnected()) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'error' => 'Database not connected',
            'message' => 'Please check your database configuration in .env'
        ]);
        exit;
    }

    $status = Database::getStatus();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Database tables created and verified successfully',
        'status' => $status
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create tables',
        'message' => $e->getMessage()
    ]);
}
