<?php
/**
 * MariaDB/MySQL Database Connection
 */

// Load composer autoloader if available (for dotenv)
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

class Database {
    private static $connection = null;
    private static $connected = false;
    
    /**
     * Initialize MariaDB/MySQL connection
     */
    public static function init() {
        try {
            // Load .env file manually if dotenv not available
            self::loadEnvFile();
            
            // Get database credentials from environment or defaults
            $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
            $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'trendydr_Shpo';
            $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'trendydr_Adrian';
            $password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: 'i"d)Z8NGP}8"?aa';
            
            // Hide password in logs
            $logHost = $host;
            error_log("🔄 Attempting to connect to MariaDB: $logHost/$dbname");
            
            // Create PDO connection
            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            self::$connection = new PDO($dsn, $username, $password, $options);
            
            // Test connection with a simple query
            self::$connection->query("SELECT 1");
            
            self::$connected = true;
            
            error_log("✅ Connected to MariaDB successfully");
            error_log("📊 Database: $dbname");
            
            // Create tables if they don't exist
            try {
                self::createTables();
            } catch (Exception $e) {
                error_log("⚠️ Warning: Could not create tables: " . $e->getMessage());
                // Don't fail connection if tables already exist
            }
            
            return true;
        } catch (PDOException $e) {
            self::$connected = false;
            error_log("❌ MariaDB connection error: " . $e->getMessage());
            
            error_log("⚠️ Could not connect to MariaDB. Possible issues:");
            error_log("   1. Check database credentials in .env file");
            error_log("   2. Verify database exists");
            error_log("   3. Check host and port");
            error_log("   4. Verify user has proper permissions");
            
            return false;
        }
    }
    
    /**
     * Get database connection
     */
    public static function getConnection() {
        if (!self::$connected && !self::init()) {
            throw new Exception('MariaDB not connected');
        }
        return self::$connection;
    }
    
    /**
     * Check if connected
     */
    public static function isConnected() {
        if (!self::$connected) {
            self::init();
        }
        return self::$connected;
    }
    
    /**
     * Get connection status
     */
    public static function getStatus() {
        return [
            'connected' => self::$connected,
            'readyState' => self::$connected ? 1 : 0,
            'readyStateText' => self::$connected ? 'connected' : 'disconnected',
            'host' => self::$connected ? ($_ENV['DB_HOST'] ?? 'localhost') : 'not connected',
            'name' => self::$connected ? ($_ENV['DB_NAME'] ?? 'unknown') : 'not connected'
        ];
    }
    
    /**
     * Create database tables if they don't exist
     */
    private static function createTables() {
        try {
            if (!self::$connected) {
                return; // Don't try to create tables if not connected
            }
            $pdo = self::getConnection();
            
            // Products table
            $pdo->exec("CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                size VARCHAR(50),
                quantity INT DEFAULT 0,
                image TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_createdAt (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            
            // Orders table
            $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(255) PRIMARY KEY,
                orderId VARCHAR(100) UNIQUE NOT NULL,
                customerName VARCHAR(255) NOT NULL,
                customerPhone VARCHAR(50) NOT NULL,
                customerEmail VARCHAR(255),
                items TEXT NOT NULL,
                totalAmount DECIMAL(10, 2) NOT NULL,
                paymentMethod VARCHAR(50),
                mpesaCode VARCHAR(100),
                deliveryStatus VARCHAR(50) DEFAULT 'pending',
                deliveredBy VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_orderId (orderId),
                INDEX idx_deliveryStatus (deliveryStatus),
                INDEX idx_createdAt (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            
            // M-Pesa transactions table
            $pdo->exec("CREATE TABLE IF NOT EXISTS mpesa_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receiptNumber VARCHAR(100) UNIQUE,
                transactionDate DATETIME NOT NULL,
                phoneNumber VARCHAR(50),
                amount DECIMAL(10, 2) NOT NULL,
                merchantRequestID VARCHAR(255),
                checkoutRequestID VARCHAR(255),
                orderId VARCHAR(255),
                resultCode INT,
                resultDesc VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_receiptNumber (receiptNumber),
                INDEX idx_transactionDate (transactionDate),
                INDEX idx_checkoutRequestID (checkoutRequestID),
                INDEX idx_orderId (orderId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            
            error_log("✅ Database tables created/verified");
        } catch (PDOException $e) {
            $errorMsg = $e->getMessage();
            error_log("⚠️ Error creating tables: " . $errorMsg);
            
            // If table already exists, that's okay
            if (strpos($errorMsg, 'already exists') !== false || 
                strpos($errorMsg, 'Duplicate') !== false) {
                error_log("ℹ️ Tables may already exist - this is okay");
            } else {
                // Log the full error for debugging
                error_log("Full error: " . $e->getTraceAsString());
            }
        } catch (Exception $e) {
            error_log("⚠️ Unexpected error creating tables: " . $e->getMessage());
        }
    }
    
    /**
     * Simple .env file loader (if dotenv not available)
     */
    private static function loadEnvFile() {
        $envFile = __DIR__ . '/../.env';
        if (!file_exists($envFile)) {
            return;
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            // Skip comments
            if (strpos($line, '#') === 0) {
                continue;
            }
            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // Remove quotes if present
                $value = trim($value, '"\'');
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Initialize on load
Database::init();
