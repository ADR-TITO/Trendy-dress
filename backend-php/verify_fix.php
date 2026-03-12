<?php
/**
 * Verification Script for M-Pesa Integration
 */

require_once __DIR__ . '/config/database.php';
spl_autoload_register(function ($class) {
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4);
    }
    $file = __DIR__ . '/src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Models\Order;
use App\Models\MpesaTransaction;

try {
    echo "--- Phase 1: Database Check ---\n";
    if (!Database::isConnected()) {
        echo "❌ Database not connected!\n";
        exit(1);
    }
    echo "✅ Database connected.\n";

    $pdo = Database::getConnection();
    
    // Check columns in orders
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $requiredColumns = ['paymentStatus', 'totalPaid', 'verified'];
    foreach ($requiredColumns as $col) {
        if (in_array($col, $columns)) {
            echo "✅ Column '{$col}' exists in 'orders' table.\n";
        } else {
            echo "❌ Column '{$col}' is MISSING in 'orders' table!\n";
        }
    }

    echo "\n--- Phase 2: Create Test Order ---\n";
    $orderModel = new Order();
    $testOrderId = 'TEST_ORD_' . time();
    $testId = 'test_id_' . time();
    
    $orderData = [
        'id' => $testId,
        'orderId' => $testOrderId,
        'customer' => [
            'name' => 'Test User',
            'phone' => '254700000000',
            'email' => 'test@example.com'
        ],
        'items' => [
            ['name' => 'Test Item', 'quantity' => 1, 'price' => 10.0]
        ],
        'total' => 10.0,
        'paymentMethod' => 'M-Pesa STK Push',
        'mpesaCode' => 'PENDING_STK_' . $testOrderId,
        'delivery' => ['status' => 'pending']
    ];
    
    $createdOrder = $orderModel->create($orderData);
    if ($createdOrder && $createdOrder['orderId'] === $testOrderId) {
        echo "✅ Test order created: {$testOrderId}\n";
    } else {
        echo "❌ Failed to create test order.\n";
        exit(1);
    }

    echo "\n--- Phase 3: Simulate Webhook ---\n";
    // We'll directly use the Logic that the webhook route uses to verify the Model update
    $mpesaModel = new MpesaTransaction();
    
    $mockCallbackData = [
        'receiptNumber' => 'QWERTYUIOP', // Real-looking code
        'transactionDate' => date('Y-m-d H:i:s'),
        'phoneNumber' => '254700000000',
        'amount' => 10.0,
        'checkoutRequestID' => 'ws_CO_TEST',
        'orderId' => $testOrderId,
        'resultCode' => 0,
        'resultDesc' => 'Success'
    ];
    
    // 1. Create mpesa transaction
    $mpesaModel->create($mockCallbackData);
    echo "✅ Mpesa transaction record created.\n";
    
    // 2. Update order (this mimics routes/mpesa.php logic)
    $orderModel->update($testId, [
        'paymentStatus' => 'paid',
        'totalPaid' => 10.0,
        'mpesaCode' => 'QWERTYUIOP',
        'verified' => 1
    ]);
    echo "✅ Order update method called.\n";

    echo "\n--- Phase 4: Verification ---\n";
    $finalOrder = $orderModel->findByOrderId($testOrderId);
    
    if ($finalOrder['paymentStatus'] === 'paid' && $finalOrder['mpesaCode'] === 'QWERTYUIOP') {
        echo "🎉 SUCCESS: Order status and M-Pesa code updated correctly!\n";
    } else {
        echo "❌ FAILURE: Order was not updated correctly.\n";
        print_r($finalOrder);
    }

    // Cleanup
    $pdo->exec("DELETE FROM orders WHERE id = '{$testId}'");
    $pdo->exec("DELETE FROM mpesa_transactions WHERE checkoutRequestID = 'ws_CO_TEST'");
    echo "\n🧹 Test data cleaned up.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
