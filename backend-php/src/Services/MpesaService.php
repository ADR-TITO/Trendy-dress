<?php
/**
 * M-Pesa Service
 */

namespace App\Services;

class MpesaService
{
    private $consumerKey;
    private $consumerSecret;
    private $shortCode;
    private $passkey;
    private $environment;
    private $baseURL;
    private $accessToken;
    private $tokenExpiry;

    public function __construct()
    {
        // M-Pesa Daraja API Credentials from environment variables
        $this->consumerKey = $_ENV['MPESA_CONSUMER_KEY'] ?? null;
        $this->consumerSecret = $_ENV['MPESA_CONSUMER_SECRET'] ?? null;
        $this->shortCode = $_ENV['MPESA_SHORTCODE'] ?? null;
        $this->passkey = $_ENV['MPESA_PASSKEY'] ?? null;
        $this->environment = $_ENV['MPESA_ENVIRONMENT'] ?? 'production';
        
        $this->baseURL = $this->environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        // Log configuration status (hidden sensitive parts)
        if (!$this->consumerKey || !$this->consumerSecret || !$this->shortCode || !$this->passkey) {
            error_log("⚠️ M-Pesa Warning: Some credentials are missing in the environment configuration.");
        }
    }

    /**
     * Get OAuth access token
     */
    private function getAccessToken()
    {
        if ($this->accessToken && $this->tokenExpiry && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }

        if (!$this->consumerKey || !$this->consumerSecret) {
            throw new \Exception('M-Pesa credentials not configured');
        }

        $auth = base64_encode(trim($this->consumerKey ?? '') . ':' . trim($this->consumerSecret ?? ''));

        $ch = curl_init($this->baseURL . '/oauth/v1/generate?grant_type=client_credentials');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . $auth,
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new \Exception("M-Pesa Auth Connection Error: " . $curlError);
        }

        if ($httpCode !== 200) {
            $data = json_decode($response, true);
            $error = $data['errorMessage'] ?? $data['faultString'] ?? $response ?? 'Unknown Error';
            throw new \Exception("M-Pesa Auth Failed (HTTP $httpCode): " . $error);
        }

        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? '';
        
        if (!$this->accessToken) {
             throw new \Exception('Failed to extract access token from M-Pesa response');
        }

        $this->tokenExpiry = time() + (55 * 60); // 55 minutes

        return $this->accessToken;
    }

    /**
     * Initiate STK Push
     */
    public function initiateSTKPush($phoneNumber, $orderId, $accountReference, $transactionDesc, $amount = null)
    {
        try {
            $token = $this->getAccessToken();

            // Get database connection
            $pdo = \Database::getConnection();

            // Fetch the total amount for the given orderId
            $stmt = $pdo->prepare("SELECT totalAmount FROM orders WHERE orderId = :orderId");
            $stmt->execute([':orderId' => $orderId]);
            $order = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$order && $amount === null) {
                throw new \Exception("Order with ID $orderId not found and no amount provided for STK Push.");
            }

            $amount = $amount ?? (float) $order['totalAmount'];

            // Format phone number (254XXXXXXXXX)
            $phone = preg_replace('/^0/', '254', $phoneNumber);
            $phone = preg_replace('/^\+/', '', $phone);

            $timestamp = date('YmdHis');
            $password = base64_encode($this->shortCode . $this->passkey . $timestamp);

            // Robust callback URL detection
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'trendydresses.co.ke';
            $defaultCallback = "$protocol://$host/backend-php/api";

            $callbackURL = $_ENV['MPESA_CALLBACK_URL'] ?? $defaultCallback;

            // Safaricom Production Requirements:
            // 1. TransactionType: CustomerBuyGoodsOnline for Till Numbers (Buy Goods)
            // 2. AccountReference: Max 12 characters (Recommended to use the Till Number or Order Number)
            // 3. Amount: Must be an integer for some Daraja versions
            
            $transactionType = $_ENV['MPESA_TRANSACTION_TYPE'] ?? 'CustomerBuyGoodsOnline';
            $displayTill = $_ENV['MPESA_TILL_NUMBER'] ?? '177104';
            
            // For CustomerBuyGoodsOnline (Buy Goods), PartyB must be the Till Number, 
            // while BusinessShortCode must be the Store Number (Shortcode).
            $partyB = ($transactionType === 'CustomerBuyGoodsOnline') ? $displayTill : $this->shortCode;
            
            // Truncate AccountReference to 12 characters to avoid rejection
            $accRef = substr($displayTill, 0, 12); 

            $data = [
                'BusinessShortCode' => $this->shortCode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => $transactionType,
                'Amount' => (int)ceil($amount), 
                'PartyA' => $phone,
                'PartyB' => $partyB,
                'PhoneNumber' => $phone,
                'CallBackURL' => rtrim($callbackURL, '/') . '/mpesa/webhook',
                'AccountReference' => $accRef,
                'TransactionDesc' => substr($transactionDesc, 0, 12) // Also truncate description
            ];

            $ch = curl_init($this->baseURL . '/mpesa/stkpush/v1/processrequest');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                $errorData = json_decode($response, true);
                $errorMsg = $errorData['errorMessage'] ?? $errorData['CustomerMessage'] ?? "HTTP $httpCode: " . ($response ?: 'Empty response');
                throw new \Exception('Failed to initiate STK Push: ' . $errorMsg);
            }

            $responseData = json_decode($response, true);
            
            // If successfully initiated, store a PENDING record so check_status.php can poll it
            if (isset($responseData['ResponseCode']) && $responseData['ResponseCode'] == "0") {
                try {
                    $insertSql = "INSERT INTO mpesa_transactions (
                        receiptNumber,
                        checkoutRequestID, 
                        merchantRequestID, 
                        orderId, 
                        amount, 
                        phoneNumber, 
                        transactionDate, 
                        resultDesc,
                        resultCode
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NULL)";
                    
                    $pendingReceipt = 'PENDING_' . $responseData['CheckoutRequestID'];
                    $stmt = $pdo->prepare($insertSql);
                    $stmt->execute([
                        $pendingReceipt,
                        $responseData['CheckoutRequestID'],
                        $responseData['MerchantRequestID'],
                        $orderId,
                        $amount,
                        $phone,
                        'Initiated - Waiting for customer'
                    ]);
                    error_log("✅ Registered pending transaction: $pendingReceipt");
                } catch (\Exception $dbEx) {
                    error_log("⚠️ Warning: Failed to register pending transaction: " . $dbEx->getMessage());
                    // Don't fail the whole request even if DB log fails
                }
            }

            return $responseData;
        } catch (\Exception $e) {
            error_log("❌ Error initiating STK Push: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Query STK Push status
     */
    public function querySTKPushStatus($checkoutRequestID)
    {
        try {
            $token = $this->getAccessToken();
            $timestamp = date('YmdHis');
            $password = base64_encode($this->shortCode . $this->passkey . $timestamp);

            $data = [
                'BusinessShortCode' => $this->shortCode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'CheckoutRequestID' => $checkoutRequestID
            ];

            $ch = curl_init($this->baseURL . '/mpesa/stkpushquery/v1/query');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                throw new \Exception('Failed to query STK Push status');
            }

            return json_decode($response, true);
        } catch (\Exception $e) {
            error_log("❌ Error querying STK Push status: " . $e->getMessage());
            throw $e;
        }
    }
    /**
     * Register C2B URLs
     */
    public function registerC2BURLs($confirmationURL, $validationURL, $responseType = 'Completed')
    {
        try {
            $token = $this->getAccessToken();
            $url = $this->baseURL . '/mpesa/c2b/v2/registerurl';

            $data = [
                'ShortCode' => $this->shortCode,
                'ResponseType' => $responseType,
                'ConfirmationURL' => $confirmationURL,
                'ValidationURL' => $validationURL
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                $errorData = json_decode($response, true);
                $errorMsg = $errorData['errorMessage'] ?? $errorData['CustomerMessage'] ?? "HTTP $httpCode: " . ($response ?: 'Empty response');
                throw new \Exception('Failed to register C2B URLs: ' . $errorMsg);
            }

            return json_decode($response, true);
        } catch (\Exception $e) {
            error_log("❌ Error registering C2B URLs: " . $e->getMessage());
            throw $e;
        }
    }
}

