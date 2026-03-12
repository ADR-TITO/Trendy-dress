<?php
// process_payment.php

try {
    // Database connection
    require_once __DIR__ . '/backend-php/config/database.php';
    $pdo = Database::getConnection();

    // $conn check removed as we are using $pdo

// Daraja API configuration
$consumer_key = $_ENV['MPESA_CONSUMER_KEY'] ?? 'DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI';
$consumer_secret = $_ENV['MPESA_CONSUMER_SECRET'] ?? 'tlplomAQhV46CojmgO4nN8wykLA6HCtrRAG6hzWmdX7woPUXpnhN3yPN0LwTgJLJ';
$business_short_code = $_ENV['MPESA_SHORTCODE'] ?? '177104';
$passkey = $_ENV['MPESA_PASSKEY'] ?? 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
$callback_url = $_ENV['MPESA_CALLBACK_URL'] ?? 'https://trendydresses.co.ke/callback.php';

// Function to generate access token
function getAccessToken($consumer_key, $consumer_secret)
{
    if (empty($consumer_key) || empty($consumer_secret)) {
        throw new Exception("M-Pesa credentials (key/secret) are missing or empty.");
    }

    $url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERPWD => trim($consumer_key) . ":" . trim($consumer_secret),
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_ENCODING => "",
        CURLOPT_HTTPHEADER => ['Accept: application/json']
    ]);
    
    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($curl);
    curl_close($curl);
    
    if ($result === false) {
        throw new Exception("cURL Error: " . $curl_error);
    }
    
    $result_decoded = json_decode($result, true);
    
    if ($status !== 200 || !isset($result_decoded['access_token'])) {
        $detail = "";
        if (is_array($result_decoded)) {
            $detail = $result_decoded['errorMessage'] ?? $result_decoded['faultString'] ?? json_encode($result_decoded);
        } else {
            $detail = !empty($result) ? $result : "Empty Response Body";
        }
        throw new Exception("Auth Failed (HTTP $status). Detail: $detail");
    }
    
    return $result_decoded['access_token'];
}

// Function to initiate STK Push
function initiateSTKPush($access_token, $business_short_code, $passkey, $amount, $phone_number, $callback_url)
{
    $url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    $timestamp = date('YmdHis');
    $password = base64_encode($business_short_code . $passkey . $timestamp);

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type:application/json', 'Authorization:Bearer ' . $access_token));

    $curl_post_data = array(
        'BusinessShortCode' => $business_short_code,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'TransactionType' => 'CustomerPayBillOnline',
        'Amount' => (int)ceil($amount),
        'PartyA' => $phone_number,
        'PartyB' => $business_short_code,
        'PhoneNumber' => $phone_number,
        'CallBackURL' => $callback_url,
        'AccountReference' => 'CompanyXLTD',
        'TransactionDesc' => 'Payment of X'
    );

    $data_string = json_encode($curl_post_data);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $data_string);
    curl_setopt($curl, CURLOPT_HEADER, false);
    $curl_response = curl_exec($curl);
    return json_decode($curl_response);
}

// Process the payment
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $phone_number = $_POST['phoneNumber'];
    $amount = $_POST['amount'];

    // Get access token
    $access_token = getAccessToken($consumer_key, $consumer_secret);

    // Initiate STK Push
    $stk_push_response = initiateSTKPush($access_token, $business_short_code, $passkey, $amount, $phone_number, $callback_url);

    if (isset($stk_push_response->ResponseCode) && $stk_push_response->ResponseCode == "0") {
        // Payment request successful, save to database
        $checkout_request_id = $stk_push_response->CheckoutRequestID;

        try {
            $sql = "INSERT INTO mpesa_transactions (phoneNumber, amount, checkoutRequestID, transactionDate, resultCode, resultDesc) VALUES (?, ?, ?, NOW(), 999, 'PENDING')";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$phone_number, $amount, $checkout_request_id]);

            echo json_encode([
                'success' => true,
                'message' => 'Payment request sent. Please check your phone to complete the transaction.',
                'checkout_request_id' => $checkout_request_id
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error saving payment details: ' . $e->getMessage()]);
        }
    } else {
        $errorMessage = 'Failed to initiate payment. Please try again.';
        if (isset($stk_push_response->errorMessage)) {
            $errorMessage = $stk_push_response->errorMessage;
        } elseif (isset($stk_push_response->faultString)) {
            $errorMessage = $stk_push_response->faultString;
        }
        echo json_encode(['success' => false, 'message' => $errorMessage, 'debug' => $stk_push_response]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>