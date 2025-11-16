<?php
/**
 * MongoDB Database Connection
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;
use MongoDB\Exception\Exception as MongoException;

class Database {
    private static $client = null;
    private static $database = null;
    private static $connected = false;
    
    /**
     * Initialize MongoDB connection
     */
    public static function init() {
        try {
            $mongodbUri = $_ENV['MONGODB_URI'] ?? 'mongodb://localhost:27017/trendy-dresses';
            
            // Hide password in logs
            $logUri = preg_replace('/\/\/[^:]+:[^@]+@/', '//***:***@', $mongodbUri);
            error_log("🔄 Attempting to connect to MongoDB: $logUri");
            
            $client = new Client($mongodbUri, [
                'serverSelectionTimeoutMS' => 30000,
                'socketTimeoutMS' => 45000,
                'connectTimeoutMS' => 30000,
            ]);
            
            // Test connection
            $client->selectDatabase('admin')->command(['ping' => 1]);
            
            // Extract database name from URI
            preg_match('/\/([^?]+)/', $mongodbUri, $matches);
            $dbName = $matches[1] ?? 'trendy-dresses';
            
            self::$client = $client;
            self::$database = $client->selectDatabase($dbName);
            self::$connected = true;
            
            error_log("✅ Connected to MongoDB successfully");
            error_log("📊 Database: $dbName");
            
            return true;
        } catch (MongoException $e) {
            self::$connected = false;
            error_log("❌ MongoDB connection error: " . $e->getMessage());
            
            if (strpos($e->getMessage(), 'No suitable servers') !== false) {
                error_log("⚠️ Could not connect to MongoDB server. Possible issues:");
                error_log("   1. Check your internet connection");
                error_log("   2. Verify MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for all)");
                error_log("   3. Check if your MongoDB Atlas cluster is running");
                error_log("   4. Verify the connection string in .env file is correct");
            }
            
            return false;
        }
    }
    
    /**
     * Get MongoDB client
     */
    public static function getClient() {
        if (!self::$connected && !self::init()) {
            throw new Exception('MongoDB not connected');
        }
        return self::$client;
    }
    
    /**
     * Get database instance
     */
    public static function getDatabase() {
        if (!self::$connected && !self::init()) {
            throw new Exception('MongoDB not connected');
        }
        return self::$database;
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
            'host' => self::$connected ? (self::$client ? 'connected' : 'not connected') : 'not connected',
            'name' => self::$connected ? (self::$database ? self::$database->getDatabaseName() : 'not connected') : 'not connected'
        ];
    }
}

// Initialize on load
Database::init();

