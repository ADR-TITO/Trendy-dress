<?php
/**
 * restore_env.php
 * Use this script to restore the .env file in the backend-php directory.
 * This is necessary because .env files are typically ignored by deployment tools.
 */

$envContent = <<<EOT
# Database Configuration
DB_HOST=localhost
DB_NAME=trendydr_Shpo
DB_USER=trendydr_Adrian
DB_PASS=i"d)Z8NGP}8"?aa

# M-Pesa Configuration
MPESA_CONSUMER_KEY=DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI
MPESA_CONSUMER_SECRET=AlCA04HIrvRhK9VogcJqXITzFmvQ0JUlMYOwGPG814m2bbUXF4EZEJzprW7B1BIf
MPESA_SHORTCODE=3576761
MPESA_PASSKEY=a48a4833b7b881cd22535945a0c61ce835af45be1169a6852c23a4f6136538e0
MPESA_ENVIRONMENT=production
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
MPESA_TILL_NUMBER=177104

# CallBack URL (Protocol + Host will be auto-detected if not set)
# MPESA_CALLBACK_URL=https://trendydresses.co.ke/backend-php/api
EOT;

$targetPath = __DIR__ . '/backend-php/.env';

echo "<h3>Environment Restorer</h3>";
echo "Target: $targetPath <br>";

if (file_put_contents($targetPath, $envContent)) {
    echo "<p style='color: green; font-weight: bold;'>✅ SUCCESS: .env file has been created/restored!</p>";
    echo "<p>You can now delete this script and go back to <a href='diag.php'>diag.php</a> to verify auth.</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>❌ FAILED: Could not write to $targetPath. Please check folder permissions.</p>";
}
