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
        case 'auth/register':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($username) || empty($password)) {
                throw new Exception('Username and password are required', 400);
            }

            if (!Database::isConnected()) {
                throw new Exception('Database not connected', 500);
            }
            
            $pdo = Database::getConnection();
            
            // Check if username already exists in either table
            $stmt = $pdo->prepare("SELECT id FROM admins WHERE username = :username UNION SELECT id FROM users WHERE username = :username LIMIT 1");
            $stmt->execute([':username' => $username]);
            if ($stmt->fetch()) {
                throw new Exception('Username already taken', 400);
            }

            // Create new CUSTOMER user (never an admin via public registration)
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (:username, :password, 'customer')");
            $stmt->execute([':username' => $username, ':password' => $passwordHash]);
            $userId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $userId,
                    'username' => $username,
                    'role' => 'customer'
                ]
            ]);
            break;

        case 'auth/login':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($username) || empty($password)) {
                throw new Exception('Username and password are required', 400);
            }

            if (!Database::isConnected()) {
                throw new Exception('Database not connected', 500);
            }
            
            $pdo = Database::getConnection();
            $admin = null;
            $user = null;

            // First check admins table
            $stmt = $pdo->prepare("SELECT *, 'admin' as role FROM admins WHERE username = :username LIMIT 1");
            $stmt->execute([':username' => $username]);
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($admin && password_verify($password, $admin['password_hash'])) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['user_role'] = 'admin';
                
                $token = bin2hex(random_bytes(32));
                $_SESSION['auth_token'] = $token;
                
                $tokenFile = sys_get_temp_dir() . '/trendy_admin_' . hash('sha256', $token) . '.tok';
                file_put_contents($tokenFile, json_encode([
                    'admin_id'   => $admin['id'],
                    'username'   => $admin['username'],
                    'role'       => 'admin',
                    'expires'    => time() + (8 * 3600),
                    'created_at' => time()
                ]));
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token' => $token,
                    'user' => [
                        'username' => $admin['username'],
                        'role' => 'admin'
                    ]
                ]);
                exit;
            }

            // If not admin, check users table
            $stmt = $pdo->prepare("SELECT *, 'customer' as role FROM users WHERE username = :username LIMIT 1");
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['user_logged_in'] = true;
                $_SESSION['user_username'] = $user['username'];
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_role'] = 'customer';
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => [
                        'username' => $user['username'],
                        'role' => 'customer'
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
            // Clean up the persistent token file if a Bearer token was sent
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
                $tokenFile = sys_get_temp_dir() . '/trendy_admin_' . hash('sha256', $token) . '.tok';
                if (file_exists($tokenFile)) {
                    @unlink($tokenFile);
                }
            }
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
            $isAdmin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
            $isUser = isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'] === true;
            echo json_encode([
                'authenticated' => $isAdmin || $isUser,
                'isAdmin' => $isAdmin,
                'role' => $_SESSION['user_role'] ?? 'guest',
                'username' => $_SESSION['admin_username'] ?? $_SESSION['user_username'] ?? null
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
