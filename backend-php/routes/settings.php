<?php
/**
 * Settings Routes
 */

$method = $_SERVER['REQUEST_METHOD'];

// Simplified settings (can be stored in MongoDB)
$defaultSettings = [
    'heroTitle' => 'Fashion That Speaks Your Style',
    'heroDescription' => 'Discover the latest trends in dresses and tracksuits',
    'contactPhone' => '254724904692',
    'contactEmail' => 'Trendy dresses790@gmail.com',
    'contactAddress' => 'Nairobi, Moi avenue, Imenti HSE Glory Exhibition Basement, Shop B4'
];

switch ($method) {
    case 'GET':
        echo json_encode($defaultSettings);
        break;
        
    case 'PUT':
        // Update settings (simplified - store in MongoDB in production)
        http_response_code(501);
        echo json_encode(['error' => 'Not implemented - use MongoDB for settings storage']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

