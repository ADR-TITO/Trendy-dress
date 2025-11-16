<?php
/**
 * Admin Routes
 */

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$routeParts = explode('/', trim($route, '/'));
$action = $routeParts[1] ?? null;

// Simple admin authentication (stored in MongoDB or config)
// For production, use proper session management

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            
            // Simple hardcoded check (replace with MongoDB in production)
            $adminUsername = $_ENV['ADMIN_USERNAME'] ?? 'admin';
            $adminPassword = $_ENV['ADMIN_PASSWORD'] ?? 'admin123';
            
            if ($username === $adminUsername && $password === $adminPassword) {
                echo json_encode([
                    'success' => true,
                    'admin' => ['username' => $username]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
        }
        break;
        
    case 'PUT':
        if ($action === 'credentials') {
            // Update credentials (simplified)
            http_response_code(501);
            echo json_encode(['error' => 'Not implemented - use MongoDB for admin storage']);
        }
        break;
        
    case 'GET':
        if ($action === 'info') {
            echo json_encode([
                'username' => $_ENV['ADMIN_USERNAME'] ?? 'admin'
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

