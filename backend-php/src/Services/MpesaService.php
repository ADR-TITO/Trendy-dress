<?php
/**
 * M-Pesa Service
 */

namespace App\Services;

class MpesaService {
    private $consumerKey;
    private $consumerSecret;
    private $shortCode;
    private $passkey;
    private $environment;
    private $baseURL;
    private $accessToken;
    private $tokenExpiry;
    
    public function __construct() {
        // M-Pesa Daraja API Credentials
        // Can be overridden by .env file if present
        $this->consumerKey = $_ENV['MPESA_CONSUMER_KEY'] ?? 'DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI';
        $this->consumerSecret = $_ENV['MPESA_CONSUMER_SECRET'] ?? 'tlplomAQhV46CojmgO4nN8wykLA6HCtrRAG6hzWmdX7woPUXpnhN3yPN0LwTgJLJ';
        $this->shortCode = $_ENV['MPESA_SHORTCODE'] ?? '177104'; // Till Number
        $this->passkey = $_ENV['MPESA_PASSKEY'] ?? 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox passkey
        $this->environment = $_ENV['MPESA_ENVIRONMENT'] ?? 'sandbox';
        $this->baseURL = $this->environment === 'production' 
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }
    
    /**
     * Get OAuth access token
     */
    private function getAccessToken() {
        if ($this->accessToken && $this->tokenExpiry && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }
        
        if (!$this->consumerKey || !$this->consumerSecret) {
            throw new \Exception('M-Pesa credentials not configured');
        }
        
        $auth = base64_encode($this->consumerKey . ':' . $this->consumerSecret);
        
        $ch = curl_init($this->baseURL . '/oauth/v1/generate?grant_type=client_credentials');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . $auth
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('Failed to authenticate with M-Pesa API');
        }
        
        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? '';
        $this->tokenExpiry = time() + (55 * 60); // 55 minutes
        
        return $this->accessToken;
    }
    
    /**
     * Initiate STK Push
     */
    public function initiateSTKPush($phoneNumber, $orderId, $accountReference, $transactionDesc) {
        try {
            $token = $this->getAccessToken();
            
            // Get database connection
            $pdo = \Database::getConnection();
            
            // Fetch the total amount for the given orderId
            $stmt = $pdo->prepare("SELECT totalAmount FROM orders WHERE orderId = :orderId");
            $stmt->execute([':orderId' => $orderId]);
            $order = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$order) {
                throw new \Exception("Order with ID $orderId not found for STK Push.");
            }
            
            $amount = (float)$order['totalAmount'];
            
            // Format phone number (254XXXXXXXXX)
            $phone = preg_replace('/^0/', '254', $phoneNumber);
            $phone = preg_replace('/^\+/', '', $phone);
            
            $timestamp = date('YmdHis');
            $password = base64_encode($this->shortCode . $this->passkey . $timestamp);
            
            $callbackURL = $_ENV['MPESA_CALLBACK_URL'] ?? 'https://trendydresses.co.ke/api/mpesa/callback';
            
            $data = [
                'BusinessShortCode' => $this->shortCode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => (int)$amount,
                'PartyA' => $phone,
                'PartyB' => $this->shortCode,
                'PhoneNumber' => $phone,
                'CallBackURL' => $callbackURL . '/webhook',
                'AccountReference' => $accountReference . '_' . $orderId, // Append orderId for traceability
                'TransactionDesc' => $transactionDesc
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
                throw new \Exception('Failed to initiate STK Push');
            }
            
            return json_decode($response, true);
        } catch (\Exception $e) {
            error_log("❌ Error initiating STK Push: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Query STK Push status
     */
    public function querySTKPushStatus($checkoutRequestID) {
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
}

