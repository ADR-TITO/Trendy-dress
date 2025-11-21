<?php
/**
 * Test Admin Login - Root Directory Version
 * Access at: https://trendydresses.co.ke/test-admin-login.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/backend-php/config/database.php';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .button:hover { background: #45a049; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔐 Admin Login Test</h1>
    <hr>

<?php
$testUsername = 'admin';
$testPassword = 'admin123';

try {
    // Check database connection
    if (!Database::isConnected()) {
        echo "<p class='error'>❌ Database NOT connected</p>";
        echo "<div class='warning'>";
        echo "<p><strong>Database connection failed!</strong></p>";
        echo "<p>Please check:</p>";
        echo "<ul>";
        echo "<li>Your .env file exists in backend-php/ folder</li>";
        echo "<li>Database credentials are correct</li>";
        echo "<li>Database server is running</li>";
        echo "</ul>";
        echo "</div>";
        exit;
    }
    
    echo "<p class='success'>✅ Database connected</p>";
    
    $pdo = Database::getConnection();
    
    // Check if admins table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($tableCheck->rowCount() == 0) {
        echo "<p class='error'>❌ Admins table does NOT exist</p>";
        echo "<div class='warning'>";
        echo "<p><strong>The admins table hasn't been created yet.</strong></p>";
        echo "<p><a href='/api/create-tables' class='button'>Create Tables Now</a></p>";
        echo "<p>Or manually visit: <code>https://trendydresses.co.ke/api/create-tables</code></p>";
        echo "</div>";
        exit;
    }
    
    echo "<p class='success'>✅ Admins table exists</p>";
    
    // Get all admins
    $stmt = $pdo->query("SELECT id, username, createdAt FROM admins");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>📊 Current Admin Accounts</h2>";
    echo "<p>Total admins: <strong>" . count($admins) . "</strong></p>";
    
    if (count($admins) == 0) {
        echo "<p class='error'>❌ No admin accounts exist!</p>";
        echo "<div class='warning'>";
        echo "<p><strong>No admin accounts found in the database.</strong></p>";
        echo "<p>You need to create an admin account first.</p>";
        echo "<p><a href='reset-admin-now.php' class='button'>Create Admin Account</a></p>";
        echo "</div>";
        exit;
    }
    
    echo "<table>";
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
    echo "<h2>🧪 Testing Login Credentials</h2>";
    echo "<div class='info'>";
    echo "<p><strong>Testing with:</strong></p>";
    echo "<ul>";
    echo "<li>Username: <code>$testUsername</code></li>";
    echo "<li>Password: <code>$testPassword</code></li>";
    echo "</ul>";
    echo "</div>";
    
    // Try to login
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $testUsername]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo "<p class='error'>❌ No admin found with username '$testUsername'</p>";
        echo "<div class='warning'>";
        echo "<p><strong>Available usernames:</strong> ";
        $stmt = $pdo->query("SELECT username FROM admins");
        $usernames = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo implode(', ', array_map(function($u) { return "<code>$u</code>"; }, $usernames));
        echo "</p>";
        echo "<p>The username 'admin' doesn't exist. You need to reset the admin account.</p>";
        echo "<p><a href='reset-admin-now.php' class='button'>Reset Admin Account</a></p>";
        echo "</div>";
        exit;
    }
    
    echo "<p class='success'>✅ Found admin with username '$testUsername'</p>";
    
    // Test password
    $passwordMatches = password_verify($testPassword, $admin['password_hash']);
    
    if ($passwordMatches) {
        echo "<div style='background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 10px; margin: 20px 0;'>";
        echo "<h2 style='color: #28a745; margin-top: 0;'>✅✅✅ SUCCESS! Login Credentials Work!</h2>";
        echo "<p style='font-size: 1.1em;'><strong>Your login credentials are verified and working!</strong></p>";
        echo "<div class='info'>";
        echo "<h3>Login Details:</h3>";
        echo "<ul style='font-size: 1.1em;'>";
        echo "<li><strong>Username:</strong> <code style='background: #fff; padding: 5px; border-radius: 3px;'>$testUsername</code></li>";
        echo "<li><strong>Password:</strong> <code style='background: #fff; padding: 5px; border-radius: 3px;'>$testPassword</code></li>";
        echo "<li><strong>Status:</strong> <span style='color: green;'>VERIFIED ✓</span></li>";
        echo "</ul>";
        echo "</div>";
        echo "<h3>📝 Next Steps to Login:</h3>";
        echo "<ol style='font-size: 1.05em; line-height: 1.8;'>";
        echo "<li>Go to your <a href='/' style='color: #007bff;'>website homepage</a></li>";
        echo "<li>Click the <strong>'Login'</strong> button in the navigation</li>";
        echo "<li>Enter username: <code style='background: #fff; padding: 3px 8px; border-radius: 3px;'>admin</code></li>";
        echo "<li>Enter password: <code style='background: #fff; padding: 3px 8px; border-radius: 3px;'>admin123</code></li>";
        echo "<li>Click the <strong>'Login'</strong> button</li>";
        echo "</ol>";
        echo "<p><a href='/' class='button' style='font-size: 1.1em; padding: 15px 30px;'>Go to Website & Login</a></p>";
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 10px; margin: 20px 0;'>";
        echo "<h2 style='color: #dc3545; margin-top: 0;'>❌ Password Does NOT Match!</h2>";
        echo "<p>The password hash in the database doesn't match '<code>$testPassword</code>'</p>";
        echo "<p><strong>This means the admin account exists but has a different password.</strong></p>";
        echo "<h3>Solution:</h3>";
        echo "<p>Reset the admin account to set the password to 'admin123':</p>";
        echo "<p><a href='reset-admin-now.php' class='button' style='background: #dc3545; font-size: 1.1em; padding: 15px 30px;'>Reset Admin Password Now</a></p>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<div class='warning'>";
    echo "<p><strong>An error occurred while testing the login.</strong></p>";
    echo "<p>Error details: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}
?>

    <hr>
    <h3>🔧 Quick Actions</h3>
    <p>
        <a href="reset-admin-now.php" class="button">Reset Admin Credentials</a>
        <a href="/" class="button">Go to Website</a>
    </p>

</body>
</html>
