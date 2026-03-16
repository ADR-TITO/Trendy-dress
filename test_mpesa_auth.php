<?php
// test_mpesa_auth.php
require_once __DIR__ . '/backend-php/config/database.php';

// Simple .env loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim(trim($value), '"\'');
    }
}

loadEnv(__DIR__ . '/backend-php/.env');

$consumerKey = $_ENV['MPESA_CONSUMER_KEY'] ?? '';
$consumerSecret = $_ENV['MPESA_CONSUMER_SECRET'] ?? '';
$env = $_ENV['MPESA_ENVIRONMENT'] ?? 'production';
$baseURL = ($env === 'production') ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

echo "Testing M-Pesa Auth...\n";
echo "Environment: $env\n";
echo "Base URL: $baseURL\n";
echo "Consumer Key: " . substr($consumerKey, 0, 5) . "...\n";

$auth = base64_encode(trim($consumerKey) . ':' . trim($consumerSecret));

$ch = curl_init($baseURL . '/oauth/v1/generate?grant_type=client_credentials');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . $auth,
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['access_token'])) {
        echo "✅ Auth Success! Token received.\n";
    } else {
        echo "❌ Auth Failed: Token missing in response.\n";
    }
} else {
    echo "❌ Auth Failed with code $httpCode\n";
}
