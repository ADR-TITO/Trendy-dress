<?php
// diag.php
require_once __DIR__ . '/backend-php/config/database.php';

header('Content-Type: text/html');

// Search for .env in multiple possible locations
$possibleEnvPaths = [
    __DIR__ . '/backend-php/.env',
    __DIR__ . '/.env',
    dirname(__DIR__) . '/.env'
];

$envFile = null;
foreach ($possibleEnvPaths as $path) {
    if (file_exists($path)) {
        $envFile = $path;
        break;
    }
}

if ($envFile) {
    echo "<!-- Found .env at $envFile -->\n";
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim(trim($value), '"\'');
        }
    }
} else {
    echo "<div style='background: #fee; border: 1px solid #f99; padding: 10px; margin-bottom: 20px;'>";
    echo "⚠️ <strong>Diagnostic Error:</strong> .env file not found.<br>";
    echo "Checked locations:<br><ul>";
    foreach ($possibleEnvPaths as $path) echo "<li>$path</li>";
    echo "</ul><strong>Action Required:</strong> Please ensure your .env file is uploaded to the <code>backend-php/</code> directory on your server.</div>";
}

$mpesa_env = $_ENV['MPESA_ENVIRONMENT'] ?? 'production';
$consumer_key = $_ENV['MPESA_CONSUMER_KEY'] ?? '';
$consumer_secret = $_ENV['MPESA_CONSUMER_SECRET'] ?? '';
$short_code = $_ENV['MPESA_SHORTCODE'] ?? '';
$passkey = $_ENV['MPESA_PASSKEY'] ?? '';
$transaction_type = $_ENV['MPESA_TRANSACTION_TYPE'] ?? 'CustomerBuyGoodsOnline';

?>
<!DOCTYPE html>
<html>
<head>
    <title>M-Pesa Production Diagnostic</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f4f4f4; }
        .box { background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ddd; }
        h2 { color: #2c3e50; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #eee; padding: 10px; overflow: auto; max-height: 400px; }
    </style>
</head>
<body>
    <h1>M-Pesa Production Diagnostic</h1>
    
    <div class="box">
        <h2>1. Environment Status</h2>
        <p><strong>Environment:</strong> <?php echo $mpesa_env; ?></p>
        <p><strong>Consumer Key:</strong> <?php echo substr($consumer_key, 0, 5); ?>...</p>
        <p><strong>Shortcode:</strong> <?php echo $short_code; ?></p>
        <p><strong>Transaction Type:</strong> <?php echo $transaction_type; ?></p>
    </div>

    <div class="box">
        <h2>2. Auth Connectivity Test</h2>
        <?php
        $base_url = ($mpesa_env === 'production') ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
        $auth_url = $base_url . '/oauth/v1/generate?grant_type=client_credentials';
        
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $auth_url);
        $credentials = base64_encode(trim($consumer_key) . ':' . trim($consumer_secret));
        curl_setopt($curl, CURLOPT_HTTPHEADER, array('Authorization: Basic ' . $credentials));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        
        $auth_result = curl_exec($curl);
        $auth_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($auth_status === 200) {
            echo "<p class='success'>✅ Auth Success (200 OK)</p>";
            $token_data = json_decode($auth_result, true);
            $access_token = $token_data['access_token'];
        } else {
            echo "<p class='error'>❌ Auth Failed ($auth_status)</p>";
            echo "<pre>$auth_result</pre>";
            $access_token = null;
        }
        ?>
    </div>

    <div class="box">
        <h2>3. Manual STK Push Test</h2>
        <form method="POST">
            <label>Phone Number (e.g. 0712345678):</label><br>
            <input type="text" name="phone" placeholder="07XXXXXXXX" required style="padding: 5px; width: 200px;">
            <button type="submit" name="test_push" style="padding: 5px 15px; cursor: pointer;">Test STK Push</button>
        </form>

        <?php
        if (isset($_POST['test_push']) && $access_token) {
            $phone = $_POST['phone'];
            $phone = preg_replace('/^0/', '254', $phone);
            
            $timestamp = date('YmdHis');
            $password = base64_encode($short_code . $passkey . $timestamp);
            
            $stk_url = $base_url . '/mpesa/stkpush/v1/processrequest';
            
            $data = [
                'BusinessShortCode' => $short_code,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => $transaction_type,
                'Amount' => 1,
                'PartyA' => $phone,
                'PartyB' => $short_code,
                'PhoneNumber' => $phone,
                'CallBackURL' => 'https://trendydresses.co.ke/backend-php/api/mpesa/webhook',
                'AccountReference' => 'DIAG_TEST',
                'TransactionDesc' => 'DIAG_TEST'
            ];

            $ch = curl_init($stk_url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $access_token,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            echo "<h3>STK Result:</h3>";
            if ($code === 200) {
                echo "<p class='success'>✅ Safaricom Accepted Request (200)</p>";
            } else {
                echo "<p class='error'>❌ Safaricom Rejected Request ($code)</p>";
            }
            echo "<pre>" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "</pre>";
            echo "<h4>Request Body Sent:</h4>";
            echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
        }
        ?>
    </div>
</body>
</html>
