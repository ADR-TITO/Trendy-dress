<?php
// test_mpesa_api.php

require_once __DIR__ . '/backend-php/config/database.php';

// Load .env
$envPath = __DIR__ . '/backend-php/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim(trim($value), '"\'');
        }
    }
}

// Autoload
spl_autoload_register(function ($class) {
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4);
    }
    $file = __DIR__ . '/backend-php/src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Services\MpesaService;

$mpesa = new MpesaService();

echo "M-Pesa API Test\n";
echo "---------------\n";
echo "Environment: " . ($_ENV['MPESA_ENVIRONMENT'] ?? 'production') . "\n";
echo "Shortcode: " . ($_ENV['MPESA_SHORTCODE'] ?? 'not set') . "\n";
echo "Till Number: " . ($_ENV['MPESA_TILL_NUMBER'] ?? 'not set') . "\n";
echo "Type: " . ($_ENV['MPESA_TRANSACTION_TYPE'] ?? 'CustomerBuyGoodsOnline') . "\n";

$phone = '254724904692'; // Using the phone number from script.js
$orderId = 'TEST_' . time();

try {
    echo "\nTesting STK Push Initiation...\n";
    // We expect this to fail or prompt based on the current (potentially broken) PartyB logic in MpesaService.php
    // Actually, I can't easily modify MpesaService.php here without affecting others, 
    // but I can see what initiateSTKPush returns.
    
    // Since I want to test both, I'll temporarily wrap the logic here.
    
    $result = $mpesa->initiateSTKPush($phone, $orderId, 'TEST', 'Test Payment', 1);
    echo "Result:\n";
    print_r($result);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
