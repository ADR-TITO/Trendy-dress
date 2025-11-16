<?php
/**
 * Server Info Endpoint
 */

$port = $_ENV['PORT'] ?? (isset($_SERVER['SERVER_PORT']) ? $_SERVER['SERVER_PORT'] : 80);
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$hostname = $_SERVER['HTTP_HOST'] ?? 'localhost';

http_response_code(200);
echo json_encode([
    'port' => $port,
    'defaultPort' => 80,
    'hostname' => $hostname,
    'protocol' => $protocol,
    'baseURL' => "$protocol://$hostname/api",
    'backend' => 'PHP' // Indicate this is PHP backend
]);

