<?php
/**
 * Reset Admin Account - Root Directory Version
 * Access at: https://trendydresses.co.ke/reset-admin-now.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/backend-php/config/database.php';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Reset Admin Account</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .button:hover { background: #45a049; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
        .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🔄 Reset Admin Account</h1>
    <hr>

<?php
$defaultUsername = 'admin';
$defaultPassword = 'admin123';

try {
    if (!Database::isConnected()) {
        echo "<p class='error'>❌ Database NOT connected</p>";
        echo "<div class='warning'>";
        echo "<p>Cannot reset admin account - database connection failed.</p>";
        echo "<p>Please check your database configuration.</p>";
        echo "</div>";
        exit;
    }
    
    echo "<p class='success'>✅ Database connected</p>";
    
    $pdo = Database::getConnection();
    $passwordHash = password_hash($defaultPassword, PASSWORD_DEFAULT);
    
    // Check if admins table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($tableCheck->rowCount() == 0) {
        // Create admins table
        $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        echo "<p class='success'>✅ Admins table created</p>";
    } else {
        echo "<p class='success'>✅ Admins table exists</p>";
    }
    
    // DELETE ALL existing admins
    $pdo->exec("DELETE FROM admins");
    echo "<p class='success'>✅ Cleared all existing admin accounts</p>";
    
    // Create fresh admin account
    $stmt = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (:username, :password)");
    $stmt->execute([':username' => $defaultUsername, ':password' => $passwordHash]);
    echo "<p class='success'>✅ Created fresh admin account</p>";
    
    // Verify the account
    $stmt = $pdo->prepare("SELECT id, username FROM admins WHERE username = :username");
    $stmt->execute([':username' => $defaultUsername]);
    $verifyAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($verifyAdmin) {
        // Test password
        $stmt = $pdo->prepare("SELECT password_hash FROM admins WHERE username = :username");
        $stmt->execute([':username' => $defaultUsername]);
        $adminData = $stmt->fetch(PDO::FETCH_ASSOC);
        $passwordWorks = password_verify($defaultPassword, $adminData['password_hash']);
        
        if ($passwordWorks) {
            echo "<div class='success-box'>";
            echo "<h2 style='color: #28a745; margin-top: 0;'>✅ Admin Account Reset Successfully!</h2>";
            echo "<p style='font-size: 1.1em;'><strong>Your admin account has been created and verified!</strong></p>";
            
            echo "<div class='info'>";
            echo "<h3>🔐 Your Login Credentials:</h3>";
            echo "<table style='width: 100%; border-collapse: collapse;'>";
            echo "<tr style='background: #fff;'>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><strong>Username:</strong></td>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><code style='font-size: 1.2em; background: #f8f9fa; padding: 5px 10px; border-radius: 3px;'>$defaultUsername</code></td>";
            echo "</tr>";
            echo "<tr style='background: #fff;'>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><strong>Password:</strong></td>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><code style='font-size: 1.2em; background: #f8f9fa; padding: 5px 10px; border-radius: 3px;'>$defaultPassword</code></td>";
            echo "</tr>";
            echo "<tr style='background: #fff;'>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><strong>Status:</strong></td>";
            echo "<td style='padding: 15px; border: 1px solid #ddd;'><span style='color: green; font-size: 1.1em;'>✓ VERIFIED & WORKING</span></td>";
            echo "</tr>";
            echo "</table>";
            echo "</div>";
            
            echo "<h3>📝 How to Login:</h3>";
            echo "<ol style='font-size: 1.05em; line-height: 1.8;'>";
            echo "<li>Go to your <a href='/' style='color: #007bff;'>website homepage</a></li>";
            echo "<li>Click the <strong>'Login'</strong> button in the navigation bar</li>";
            echo "<li>Enter username: <code style='background: #fff; padding: 3px 8px; border-radius: 3px;'>admin</code></li>";
            echo "<li>Enter password: <code style='background: #fff; padding: 3px 8px; border-radius: 3px;'>admin123</code></li>";
            echo "<li>Click <strong>'Login'</strong></li>";
            echo "</ol>";
            
            echo "<div class='warning'>";
            echo "<p><strong>⚠️ Security Reminder:</strong></p>";
            echo "<p>After logging in, go to <strong>Admin Panel → Settings</strong> to change your password to something more secure!</p>";
            echo "</div>";
            
            echo "<p style='margin-top: 30px;'>";
            echo "<a href='/' class='button' style='font-size: 1.2em; padding: 15px 40px;'>Go to Website & Login Now</a>";
            echo "<a href='test-admin-login.php' class='button' style='background: #6c757d; font-size: 1.2em; padding: 15px 40px;'>Test Login Again</a>";
            echo "</p>";
            echo "</div>";
        } else {
            echo "<p class='error'>❌ Password verification failed</p>";
            echo "<p>Account was created but password doesn't work. Please try again.</p>";
        }
    } else {
        echo "<p class='error'>❌ Failed to verify admin account creation</p>";
    }
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<div class='warning'>";
    echo "<p><strong>Failed to reset admin account.</strong></p>";
    echo "<p>Error details: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}
?>

    <hr>
    <p><a href="test-admin-login.php" class="button">Test Login</a> <a href="/" class="button">Go to Website</a></p>

</body>
</html>
