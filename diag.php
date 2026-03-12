<?php
// diag.php
require_once __DIR__ . '/backend-php/config/database.php';

header('Content-Type: text/plain');

echo "--- Environment Diagnostics ---\n";
echo "MPESA_CONSUMER_KEY length: " . strlen(getenv('MPESA_CONSUMER_KEY') ?: '') . "\n";
echo "MPESA_CONSUMER_KEY (masked): " . substr(getenv('MPESA_CONSUMER_KEY') ?: '', 0, 4) . "...\n";
echo "MPESA_ENVIRONMENT: " . (getenv('MPESA_ENVIRONMENT') ?: 'not set') . "\n";
echo "\n--- Connectivity Test (Safaricom Sandbox OAuth) ---\n";

$url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
$consumer_key = getenv('MPESA_CONSUMER_KEY') ?: 'DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI';
$consumer_secret = getenv('MPESA_CONSUMER_SECRET') ?: 'tlplomAQhV46CojmgO4nN8wykLA6HCtrRAG6hzWmdX7woPUXpnhN3yPN0LwTgJLJ';

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
