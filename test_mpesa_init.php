<?php
require_once __DIR__ . '/backend-php/config/database.php';
// Database::init() already called in database.php, which loads .env

$consumer_key = getenv('MPESA_CONSUMER_KEY');
$consumer_secret = getenv('MPESA_CONSUMER_SECRET');
$shortcode = getenv('MPESA_SHORTCODE');
$passkey = getenv('MPESA_PASSKEY');

echo "Debug Info:\n";
echo "Shortcode: $shortcode\n";
echo "Consumer Key: " . substr($consumer_key, 0, 5) . "...\n";

function getAccessToken($consumer_key, $consumer_secret) {
    $url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    $credentials = base64_encode($consumer_key . ':' . $consumer_secret);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Authorization: Basic ' . $credentials));
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($curl);
    $info = curl_getinfo($curl);
    curl_close($curl);
    return json_decode($response);
}

$token_res = getAccessToken($consumer_key, $consumer_secret);
if (isset($token_res->access_token)) {
    echo "Access Token: SUCCESS\n";
    
    // Test STK Push with dummy data
    $access_token = $token_res->access_token;
    $timestamp = date('YmdHis');
    $password = base64_encode($shortcode . $passkey . $timestamp);
    $url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    $curl_post_data = array(
        'BusinessShortCode' => $shortcode,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'TransactionType' => 'CustomerPayBillOnline',
        'Amount' => 1,
        'PartyA' => 254724904692,
        'PartyB' => $shortcode,
        'PhoneNumber' => 254724904692,
        'CallBackURL' => 'https://example.com/callback',
        'AccountReference' => 'Test',
        'TransactionDesc' => 'Test'
    );
    
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type:application/json', 'Authorization:Bearer ' . $access_token));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($curl_post_data));
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    
    $stk_response = curl_exec($curl);
    echo "STK Response: $stk_response\n";
    curl_close($curl);
} else {
    echo "Access Token: FAILED\n";
    print_r($token_res);
}
