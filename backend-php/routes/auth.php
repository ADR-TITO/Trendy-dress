<?php
/**
 * Authentication Routes
 */

require_once __DIR__ . '/../config/database.php';

// Start session securely
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
    session_start();
}

header('Content-Type: application/json');

// Handle CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($route) {
        case 'auth/login':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($username) || empty($password)) {
                throw new Exception('Username and password are required', 400);
            }

            // Database authentication
            if (!Database::isConnected()) {
                throw new Exception('Database not connected', 500);
            }
            
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = :username LIMIT 1");
            $stmt->execute([':username' => $username]);
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($admin && password_verify($password, $admin['password_hash'])) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['admin_id'] = $admin['id'];
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => [
                        'username' => $admin['username']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid credentials'
                ]);
            }
            break;

        case 'auth/logout':
            // Clear session
            $_SESSION = array();
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            session_destroy();

            echo json_encode([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
            break;

        case 'auth/check':
            $isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
            echo json_encode([
                'authenticated' => $isLoggedIn,
                'username' => $isLoggedIn ? ($_SESSION['admin_username'] ?? 'Admin') : null
            ]);
            break;

        case 'auth/change-credentials':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
                throw new Exception('Unauthorized', 401);
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $currentPassword = $data['currentPassword'] ?? '';
            $newUsername = $data['newUsername'] ?? '';
            $newPassword = $data['newPassword'] ?? '';

            if (empty($currentPassword)) {
                throw new Exception('Current password is required', 400);
            }

            $pdo = Database::getConnection();
            $adminId = $_SESSION['admin_id'];

            // Verify current password
            $stmt = $pdo->prepare("SELECT * FROM admins WHERE id = :id");
            $stmt->execute([':id' => $adminId]);
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$admin || !password_verify($currentPassword, $admin['password_hash'])) {
                throw new Exception('Current password is incorrect', 401);
            }

            // Update credentials
            $updates = [];
            $params = [':id' => $adminId];

            if (!empty($newUsername)) {
                // Check if username already exists
                $checkStmt = $pdo->prepare("SELECT id FROM admins WHERE username = :username AND id != :id");
                $checkStmt->execute([':username' => $newUsername, ':id' => $adminId]);
                if ($checkStmt->fetch()) {
                    throw new Exception('Username already taken', 400);
                }
                $updates[] = "username = :username";
                $params[':username'] = $newUsername;
                $_SESSION['admin_username'] = $newUsername; // Update session
            }

            if (!empty($newPassword)) {
                $updates[] = "password_hash = :password";
                $params[':password'] = password_hash($newPassword, PASSWORD_DEFAULT);
            }

            if (empty($updates)) {
                echo json_encode(['success' => true, 'message' => 'No changes made']);
                exit;
            }

            $sql = "UPDATE admins SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode([
                'success' => true,
                'message' => 'Credentials updated successfully',
                'username' => $_SESSION['admin_username']
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Route not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
