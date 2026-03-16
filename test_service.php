<?php
// test_service.php
require_once __DIR__ . '/backend-php/config/database.php';

// Autoload models and services
spl_autoload_register(function ($class) {
    if (strpos($class, 'App\\') === 0) {
        $class = substr($class, 4); // Remove 'App\' prefix
    }
    $file = __DIR__ . '/backend-php/src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

header('Content-Type: text/plain');

try {
    $mpesaService = new App\Services\MpesaService();
    
    // Reflection to check private properties
    $reflector = new ReflectionClass($mpesaService);
    $consumerKey = $reflector->getProperty('consumerKey');
    $consumerKey->setAccessible(true);
    $consumerSecret = $reflector->getProperty('consumerSecret');
    $consumerSecret->setAccessible(true);
    $baseURL = $reflector->getProperty('baseURL');
    $baseURL->setAccessible(true);
    
    echo "Consumer Key (trimmed): [" . trim($consumerKey->getValue($mpesaService)) . "]\n";
    echo "Consumer Secret (trimmed): [" . trim($consumerSecret->getValue($mpesaService)) . "]\n";
    echo "Base URL: " . $baseURL->getValue($mpesaService) . "\n";
    
    // Test Token
    $method = new ReflectionMethod($mpesaService, 'getAccessToken');
    $method->setAccessible(true);
    $token = $method->invoke($mpesaService);
    echo "Generated Token: " . $token . "\n";
    
    // Test STK Push with small amount
    echo "\nAttempting STK Push (KSh 1)...\n";
    $result = $mpesaService->initiateSTKPush(
        '254745464652', 
        'TEST_' . time(), 
        'TrendyDresses', 
        'Test Payment', 
        1.0
    );
    
    echo "STK Push Result:\n";
    print_r($result);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "TRACE:\n" . $e->getTraceAsString() . "\n";
}
