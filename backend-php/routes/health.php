<?php
/**
 * Health Check Endpoint
 */

http_response_code(200);
echo json_encode([
    'status' => 'ok',
    'message' => 'Trendy Dresses API is running',
    'backend' => 'PHP'
]);

