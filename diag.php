<?php
// diag.php
require_once __DIR__ . '/backend-php/config/database.php';

header('Content-Type: text/plain');

echo "--- Environment Diagnostics ---\n";
echo "MPESA_CONSUMER_KEY length: " . strlen(getenv('MPESA_CONSUMER_KEY') ?: '') . "\n";
echo "MPESA_CONSUMER_KEY (masked): " . substr(getenv('MPESA_CONSUMER_KEY') ?: '', 0, 4) . "...\n";
echo "MPESA_ENVIRONMENT: " . (getenv('MPESA_ENVIRONMENT') ?: 'not set') . "\n";
$mpesa_env = (getenv('MPESA_ENVIRONMENT') ?: 'production');
$base_url = ($mpesa_env === 'production') ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
$url = $base_url . '/oauth/v1/generate?grant_type=client_credentials';

echo "\n--- Connectivity Test (Safaricom $mpesa_env OAuth) ---\n";

$consumer_key = getenv('MPESA_CONSUMER_KEY') ?: 'j9G6DA6JQwqv7poyeCMTXTyDscFLZoV4vEaswwMLmOCGmK2y';
$consumer_secret = getenv('MPESA_CONSUMER_SECRET') ?: 'AlCA04HIrvRhK9VogcJqXITzFmvQ0JUlMYOwGPG814m2bbUXF4EZEJzprW7B1BIf';

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
$credentials = base64_encode($consumer_key . ':' . $consumer_secret);
curl_setopt($curl, CURLOPT_HTTPHEADER, array('Authorization: Basic ' . $credentials));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($curl, CURLOPT_VERBOSE, true);

// Create a temp file for curl verbose output
$verbose = fopen('php://temp', 'w+');
curl_setopt($curl, CURLOPT_STDERR, $verbose);

$result = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$error = curl_error($curl);

echo "Status: $status\n";
echo "Error: $error\n";
echo "Raw Response: $result\n";

echo "\n--- Verbose Curl Output ---\n";
rewind($verbose);
echo stream_get_contents($verbose);
fclose($verbose);
?>
