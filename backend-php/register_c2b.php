<?php
// register_c2b.php
// Script to register C2B Validation and Confirmation URLs

require_once __DIR__ . '/config/database.php';

// Simple .env loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim(trim($value), '"\'');
    }
}

loadEnv(__DIR__ . '/.env');

// Autoload classes
spl_autoload_register(function ($class) {
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4);
    }
    $file = __DIR__ . '/src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Services\MpesaService;

echo "M-Pesa C2B URL Registration\n";
echo "============================\n";

try {
    $mpesa = new MpesaService();
    
    // Determine the base URL for callbacks
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'trendydresses.co.ke';
    $baseUrlFromEnv = $_ENV['MPESA_CALLBACK_URL'] ?? "$protocol://$host/backend-php/api";
    $baseUrlFromEnv = rtrim($baseUrlFromEnv, '/');

    $confirmationURL = $baseUrlFromEnv . '/mpesa/webhook';
    $validationURL = $baseUrlFromEnv . '/mpesa/webhook';

    echo "ShortCode: " . ($_ENV['MPESA_SHORTCODE'] ?? 'Not set') . "\n";
    echo "Environment: " . ($_ENV['MPESA_ENVIRONMENT'] ?? 'production') . "\n";
    echo "Confirmation URL: $confirmationURL\n";
    echo "Validation URL: $validationURL\n\n";

    echo "Registering URLs...\n";
    $result = $mpesa->registerC2BURLs($confirmationURL, $validationURL);

    echo "Success!\n";
    echo "Response: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
