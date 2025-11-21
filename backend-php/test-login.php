<?php
/**
 * Test Login Directly
 * This script tests the login functionality and shows detailed debug info
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/config/database.php';

echo "<h1>Admin Login Test</h1>";
echo "<hr>";

// Test credentials
$testUsername = 'admin';
$testPassword = 'admin123';

try {
    // Check database connection
    if (!Database::isConnected()) {
        echo "<p style='color: red;'><strong>❌ Database NOT connected</strong></p>";
        echo "<p>Please check your .env file and database credentials.</p>";
        exit;
    }
    
    echo "<p style='color: green;'><strong>✅ Database connected</strong></p>";
    
    $pdo = Database::getConnection();
    
    // Check if admins table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($tableCheck->rowCount() == 0) {
        echo "<p style='color: red;'><strong>❌ Admins table does NOT exist</strong></p>";
        echo "<p>Run <a href='create-tables.php'>create-tables.php</a> first.</p>";
        exit;
    }
    
    echo "<p style='color: green;'><strong>✅ Admins table exists</strong></p>";
    
    // Get all admins
    $stmt = $pdo->query("SELECT id, username, createdAt FROM admins");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Current Admin Accounts:</h2>";
    echo "<p>Total admins: <strong>" . count($admins) . "</strong></p>";
    
    if (count($admins) == 0) {
        echo "<p style='color: red;'><strong>❌ No admin accounts exist!</strong></p>";
        echo "<p>Run <a href='reset-admin.php'>reset-admin.php</a> to create one.</p>";
        exit;
    }
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Username</th><th>Created At</th></tr>";
    foreach ($admins as $admin) {
        echo "<tr>";
        echo "<td>{$admin['id']}</td>";
        echo "<td><strong>{$admin['username']}</strong></td>";
        echo "<td>{$admin['createdAt']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<hr>";
    echo "<h2>Testing Login with: username='$testUsername', password='$testPassword'</h2>";
    
    // Try to login
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $testUsername]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo "<p style='color: red;'><strong>❌ No admin found with username '$testUsername'</strong></p>";
        echo "<p>Available usernames: ";
        $stmt = $pdo->query("SELECT username FROM admins");
        $usernames = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo implode(', ', array_map(function($u) { return "<strong>$u</strong>"; }, $usernames));
        echo "</p>";
        exit;
    }
    
    echo "<p style='color: green;'><strong>✅ Found admin with username '$testUsername'</strong></p>";
    
    // Test password
    $passwordMatches = password_verify($testPassword, $admin['password_hash']);
    
    if ($passwordMatches) {
        echo "<p style='color: green; font-size: 1.2em;'><strong>✅✅✅ PASSWORD MATCHES! Login should work!</strong></p>";
        echo "<h3>Login Details:</h3>";
        echo "<ul>";
        echo "<li><strong>Username:</strong> $testUsername</li>";
        echo "<li><strong>Password:</strong> $testPassword</li>";
        echo "<li><strong>Status:</strong> <span style='color: green;'>VERIFIED ✓</span></li>";
        echo "</ul>";
        echo "<p><strong>Next steps:</strong></p>";
        echo "<ol>";
        echo "<li>Go to your website homepage</li>";
        echo "<li>Click the 'Login' button</li>";
        echo "<li>Enter username: <strong>$testUsername</strong></li>";
        echo "<li>Enter password: <strong>$testPassword</strong></li>";
        echo "<li>Click 'Login'</li>";
        echo "</ol>";
    } else {
        echo "<p style='color: red; font-size: 1.2em;'><strong>❌ PASSWORD DOES NOT MATCH!</strong></p>";
        echo "<p>The password hash in the database doesn't match '$testPassword'</p>";
        echo "<p><strong>Solution:</strong> Run <a href='reset-admin.php' style='color: blue; font-weight: bold;'>reset-admin.php</a> to reset the password.</p>";
        
        // Show hash info for debugging
        echo "<details>";
        echo "<summary>Technical Details (click to expand)</summary>";
        echo "<p><strong>Password Hash Algorithm:</strong> " . password_get_info($admin['password_hash'])['algoName'] . "</p>";
        echo "<p><strong>Hash (first 50 chars):</strong> " . substr($admin['password_hash'], 0, 50) . "...</p>";
        echo "</details>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>❌ Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<h3>Quick Actions:</h3>";
echo "<ul>";
echo "<li><a href='reset-admin.php'>Reset Admin Credentials</a> - Creates fresh admin account</li>";
echo "<li><a href='check-admin.php'>Check Admin Status (JSON)</a> - View raw data</li>";
echo "<li><a href='create-tables.php'>Create Database Tables</a> - If tables don't exist</li>";
echo "<li><a href='../index.html'>Go to Website</a> - Try logging in</li>";
echo "</ul>";
?>
