<?php
// A simple test to verify product creation
require_once __DIR__ . '/src/Models/Product.php';
require_once __DIR__ . '/config/database.php';

use App\Models\Product;
use Database;

echo "Running Product Creation Test...\n";

try {
    // 1. Establish a database connection
    $pdo = Database::getConnection();
    echo "Database connection successful.\n";

    // 2. Instantiate the Product model
    $productModel = new Product();

    // 3. Define test product data
    $testProductId = 'test_' . uniqid();
    $testProductData = [
        'id' => $testProductId,
        'name' => 'Test Product',
        'price' => 99.99,
        'description' => 'This is a test product.',
        'category' => 'testing',
        'size' => 'M',
        'quantity' => 10,
        'discount' => 5,
        'image' => 'test.jpg'
    ];

    // 4. Call the create method
    echo "Creating a new product...\n";
    $createdProduct = $productModel->create($testProductData);

    // 5. Verify the created product
    if ($createdProduct && $createdProduct['id'] === $testProductId) {
        echo "Product created successfully via model.\n";
    } else {
        echo "Error: Product creation via model failed.\n";
        exit(1);
    }

    // 6. Directly query the database to confirm insertion
    echo "Verifying product in the database...\n";
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
    $stmt->execute([':id' => $testProductId]);
    $productFromDb = $stmt->fetch();

    if ($productFromDb && $productFromDb['name'] === 'Test Product') {
        echo "Product confirmed in the database.\n";
    } else {
        echo "Error: Product not found in the database.\n";
        exit(1);
    }

    // 7. Clean up the test data
    echo "Cleaning up test product...\n";
    $productModel->delete($testProductId);
    echo "Test product deleted.\n";

    echo "Product Creation Test Passed!\n";

} catch (Exception $e) {
    echo "An error occurred during the test: " . $e->getMessage() . "\n";
    exit(1);
}
