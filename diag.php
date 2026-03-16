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

echo    "<div class=\"box\" style=\"border: 2px solid #e74c3c;\">
        <h2 style=\"color: #e74c3c;\">🛠️ Repair Environment</h2>
        <p>If your <code>.env</code> file is missing on the server, use this button to recreate it with the correct production credentials.</p>
        <form method=\"POST\">
            <button type=\"submit\" name=\"restore_env\" style=\"background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;\">Restore .env File</button>
        </form>
    </div>

    <div class='box' style='background: #fdf; border: 1px solid #d9d;'>";
echo "<h3>Server File Discovery</h3>";
echo "<strong>Current Dir content (" . __DIR__ . "):</strong><br>";
$files = scandir(__DIR__);
foreach ($files as $f) {
    if ($f === '.' || $f === '..') continue;
    echo (is_dir(__DIR__ . '/' . $f) ? "[DIR] " : "") . "$f, ";
}
echo "<br><br><strong>backend-php content:</strong><br>";
if (is_dir(__DIR__ . '/backend-php')) {
    $files = scandir(__DIR__ . '/backend-php');
    foreach ($files as $f) {
        if ($f === '.' || $f === '..') continue;
        echo (is_dir(__DIR__ . '/backend-php/' . $f) ? "[DIR] " : "") . "$f, ";
    }
} else {
    echo "<em>backend-php directory not found!</em>";
}
echo "</div>";

$envFile = null;
foreach ($possibleEnvPaths as $path) {
    if (file_exists($path)) {
        $envFile = $path;
        break;
    }
}

$envVars = [];
if (isset($_POST['restore_env'])) {
    $envContent = "# Database Configuration\nDB_HOST=localhost\nDB_NAME=trendydr_Shpo\nDB_USER=trendydr_Adrian\nDB_PASS=i\"d)Z8NGP}8\"?aa\n\n# M-Pesa Configuration\nMPESA_CONSUMER_KEY=DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI\nMPESA_CONSUMER_SECRET=AlCA04HIrvRhK9VogcJqXITzFmvQ0JUlMYOwGPG814m2bbUXF4EZEJzprW7B1BIf\nMPESA_SHORTCODE=3576761\nMPESA_PASSKEY=a48a4833b7b881cd22535945a0c61ce835af45be1169a6852c23a4f6136538e0\nMPESA_ENVIRONMENT=production\nMPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline\nMPESA_TILL_NUMBER=177104\n";
    $target = __DIR__ . '/backend-php/.env';
    if (!is_dir(__DIR__ . '/backend-php')) mkdir(__DIR__ . '/backend-php', 0755, true);
    if (file_put_contents($target, $envContent)) {
        echo "<div style='background: #dfd; border: 1px solid #9d9; padding: 10px; margin-bottom: 20px;'>✅ <strong>Success:</strong> .env file restored! Please refresh the page.</div>";
        $envFile = $target; // Use it immediately
    } else {
        echo "<div style='background: #fdd; border: 1px solid #d99; padding: 10px; margin-bottom: 20px;'>❌ <strong>Error:</strong> Failed to write .env to $target. Check permissions.</div>";
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
            $key = trim($name);
            $val = trim(trim($value), '"\' ');
            $envVars[$key] = $val;
            $_ENV[$key] = $val; // Try to set it here too
        }
    }
} else {
    echo "<div style='background: #fee; border: 1px solid #f99; padding: 10px; margin-bottom: 20px;'>";
    echo "⚠️ <strong>Diagnostic Error:</strong> .env file not found.<br>";
    echo "Checked locations:<br><ul>";
    foreach ($possibleEnvPaths as $path) echo "<li>$path</li>";
    echo "</ul><strong>Action Required:</strong> Please ensure your .env file is uploaded to the <code>backend-php/</code> directory on your server.</div>";
}

$mpesa_env = $envVars['MPESA_ENVIRONMENT'] ?? $_ENV['MPESA_ENVIRONMENT'] ?? 'production';
$consumer_key = $envVars['MPESA_CONSUMER_KEY'] ?? $_ENV['MPESA_CONSUMER_KEY'] ?? '';
$consumer_secret = $envVars['MPESA_CONSUMER_SECRET'] ?? $_ENV['MPESA_CONSUMER_SECRET'] ?? '';
$short_code = $envVars['MPESA_SHORTCODE'] ?? $_ENV['MPESA_SHORTCODE'] ?? '';
$passkey = $envVars['MPESA_PASSKEY'] ?? $_ENV['MPESA_PASSKEY'] ?? '';
$transaction_type = $envVars['MPESA_TRANSACTION_TYPE'] ?? $_ENV['MPESA_TRANSACTION_TYPE'] ?? 'CustomerBuyGoodsOnline';

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
        <p><strong>Consumer Key:</strong> <?php echo !empty($consumer_key) ? substr($consumer_key, 0, 5) . '...' : '<span class="error">MISSING</span>'; ?></p>
        <p><strong>Shortcode:</strong> <?php echo !empty($short_code) ? $short_code : '<span class="error">MISSING</span>'; ?></p>
        <p><strong>Transaction Type:</strong> <?php echo $transaction_type; ?></p>
        <hr>
        <p><strong>Loaded Keys from .env:</strong> <?php echo implode(', ', array_keys($envVars)); ?></p>
        <p><strong>.env Path Used:</strong> <?php echo $envFile; ?></p>
    </div>

    <div class="box">
        <h2>2. Auth Connectivity Test</h2>
        <?php
        $base_url = ($mpesa_env === 'production') ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
        $access_token = null;

        function testAuthAdvanced($url, $key, $secret, $options = []) {
            $curl = curl_init();
            $credentials = base64_encode(trim($key) . ':' . trim($secret));
            
            $headers = [
                'Authorization: Basic ' . $credentials,
                'Accept: application/json'
            ];
            
            if (isset($options['headers'])) $headers = array_merge($headers, $options['headers']);

            curl_setopt($curl, CURLOPT_URL, $url);
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_HEADER, true);
            curl_setopt($curl, CURLOPT_TIMEOUT, 20);
            curl_setopt($curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            
            if (isset($options['post'])) {
                curl_setopt($curl, CURLOPT_POST, true);
                if (is_array($options['post'])) curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($options['post']));
            }

            if (isset($options['useragent'])) curl_setopt($curl, CURLOPT_USERAGENT, $options['useragent']);

            $response = curl_exec($curl);
            $error = curl_error($curl);
            $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
            $res_headers = substr($response, 0, $header_size);
            $body = substr($response, $header_size);
            curl_close($curl);
            
            return [
                'status' => $status,
                'headers' => $res_headers,
                'body' => $body,
                'error' => $error,
                'creds_debug' => substr($credentials, 0, 10) . '...' . substr($credentials, -5)
            ];
        }

        $prod_url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        $sand_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        $scenarios = [
            'Production Standard GET' => ['url' => $prod_url],
            'Production No-User-Agent GET' => ['url' => $prod_url, 'useragent' => ''],
            'Production Browser UA GET' => ['url' => $prod_url, 'useragent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
            'Sandbox Standard GET' => ['url' => $sand_url]
        ];

        echo "<h4>Raw Connectivity Sniffer (Full Response)</h4>";
        $ch = curl_init($prod_url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode(trim($consumer_key) . ':' . trim($consumer_secret))]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $raw = curl_exec($ch);
        echo "<pre>" . (htmlspecialchars($raw) ?: 'CURL EXEC RETURNED FALSE') . "</pre>";
        curl_close($ch);

        echo "<h4>file_get_contents (Stream) Test</h4>";
        $creds = base64_encode(trim($consumer_key) . ':' . trim($consumer_secret));
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "Authorization: Basic $creds\r\nAccept: application/json\r\nUser-Agent: Mozilla/5.0\r\n",
                'ignore_errors' => true
            ]
        ];
        $context = stream_context_create($opts);
        $stream_res = file_get_contents($prod_url, false, $context);
        echo "<pre>" . (htmlspecialchars($stream_res) ?: 'STREAM RETURNED FALSE') . "</pre>";

        foreach ($scenarios as $desc => $opt) {
            echo "<h4>Scenario: $desc</h4>";
            $res = testAuthAdvanced($opt['url'], $consumer_key, $consumer_secret, $opt);
            if ($res['status'] === 200) {
                echo "<p class='success'>✅ Success ($desc)</p>";
                echo "<strong>Raw Body:</strong><pre>" . (htmlspecialchars($res['body']) ?: '[EMPTY BODY]') . "</pre>";
                if (!$access_token) {
                    $token_data = json_decode($res['body'], true);
                    $access_token = $token_data['access_token'] ?? null;
                }
            } else {
                echo "<p class='error'>❌ Failed ($desc) - Status: " . $res['status'] . "</p>";
                if ($res['error']) echo "<strong>Curl Error:</strong> <code style='color:red;'>" . htmlspecialchars($res['error']) . "</code><br>";
                echo "<strong>Response Headers:</strong><pre>" . htmlspecialchars($res['headers']) . "</pre>";
                echo "<strong>Raw Body:</strong><pre>" . (htmlspecialchars($res['body']) ?: '[EMPTY BODY]') . "</pre>";
            }
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
            
            $display_till = $_ENV['MPESA_TILL_NUMBER'] ?? '177104';
            $party_b = ($transaction_type === 'CustomerBuyGoodsOnline') ? $display_till : $short_code;
            
            $data = [
                'BusinessShortCode' => $short_code,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => $transaction_type,
                'Amount' => 1,
                'PartyA' => $phone,
                'PartyB' => $party_b,
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
