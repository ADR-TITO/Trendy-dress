<?php
/**
 * Database Status Endpoint
 */

require_once __DIR__ . '/../config/database.php';

$status = Database::getStatus();

http_response_code(200);
echo json_encode($status);

