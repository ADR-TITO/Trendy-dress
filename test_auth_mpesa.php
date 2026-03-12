<?php
// test_auth_mpesa.php
header('Content-Type: text/plain');

require_once __DIR__ . '/backend-php/config/database.php';
// Load environment variables
Database::init();

$consumer_key = $_ENV['MPESA_CONSUMER_KEY'] ?? 'DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI';
$consumer_secret = $_ENV['MPESA_CONSUMER_SECRET'] ?? 'tlplomAQhV46CojmgO4nN8wykLA6HCtrRAG6hzWmdX7woPUXpnhN3yPN0LwTgJLJ';

echo "Testing M-Pesa Auth Connection...\n";
echo "URL: https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials\n";
echo "Consumer Key (first 5): " . substr($consumer_key, 0, 5) . "\n";

$url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
$ch = curl_init($url);

$auth = base64_encode(trim($consumer_key) . ':' . trim($consumer_secret));
$headers = [
    'Authorization: Basic ' . $auth,
    'Accept: application/json'
];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_VERBOSE, true);
curl_setopt($ch, CURLOPT_HEADER, true); // Include headers in response

// Capture verbose output
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "\n--- Result ---\n";
echo "HTTP Status: $status\n";
echo "Curl Error: $error\n";
echo "\n--- Raw Response (including headers) ---\n";
echo $response;

echo "\n--- Verbose Log ---\n";
rewind($verbose);
echo stream_get_contents($verbose);
fclose($verbose);
?>
