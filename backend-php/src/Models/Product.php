<?php
namespace App\Models;

require_once __DIR__ . '/../../config/database.php';

use Database;
use PDO;

class Product {
    /**
     * Find all products
     */
    public function findAll($category = null, $includeImages = false) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            // Check if table exists first
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'products'");
            if ($tableCheck->rowCount() === 0) {
                error_log("⚠️ Products table does not exist - returning empty array");
                return [];
            }
            
            $sql = "SELECT * FROM products";
            $params = [];
            
            if ($category && $category !== 'all') {
                $sql .= " WHERE category = :category";
                $params[':category'] = $category;
            }
            
            $sql .= " ORDER BY createdAt DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert to array format and handle images
            $result = [];
            foreach ($products as $product) {
                // Defensive: handle missing columns gracefully
                $item = [
                    '_id' => $product['id'] ?? '',
                    'id' => $product['id'] ?? '',
                    'name' => $product['name'] ?? '',
                    'price' => isset($product['price']) ? (float)$product['price'] : 0.0,
                    'description' => $product['description'] ?? '',
                    'category' => $product['category'] ?? 'others',
                    'size' => $product['size'] ?? '',
                    'quantity' => isset($product['quantity']) ? (int)$product['quantity'] : 0,
                    'createdAt' => $product['createdAt'] ?? date('Y-m-d H:i:s'),
                    'updatedAt' => $product['updatedAt'] ?? date('Y-m-d H:i:s')
                ];
                
                // Always include image (even if empty)
                $item['image'] = $product['image'] ?? null;
                
                // Add discount field if it exists
                if (isset($product['discount'])) {
                    $item['discount'] = (int)$product['discount'];
                }
                
                $result[] = $item;
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("Error finding products: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Find product by ID
     */
    public function findById($id) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                return null;
            }
            
            return [
                '_id' => $product['id'],
                'id' => $product['id'],
                'name' => $product['name'],
                'price' => (float)$product['price'],
                'description' => $product['description'],
                'category' => $product['category'],
                'size' => $product['size'],
                'quantity' => (int)$product['quantity'],
                'image' => $product['image'],
                'createdAt' => $product['createdAt'],
                'updatedAt' => $product['updatedAt']
            ];
        } catch (\Exception $e) {
            error_log("Error finding product: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function saveBase64Image($base64String, $id) {
        if (empty($base64String)) return null;
        if (strpos($base64String, 'data:image/') !== 0) return $base64String;

        try {
            $parts = explode(';', $base64String);
            if (count($parts) < 2) return $base64String;
            
            $dataParts = explode(',', $parts[1]);
            if (count($dataParts) < 2) return $base64String;
            
            $imageData = base64_decode($dataParts[1]);
            if (!$imageData) return $base64String;
            
            $image = @imagecreatefromstring($imageData);
            if (!$image) return $base64String;
            
            // Resize image to max 800px width
            $origWidth = imagesx($image);
            $origHeight = imagesy($image);
            $maxWidth = 800; // Responsive size
            
            if ($origWidth > $maxWidth) {
                $newHeight = ($maxWidth / $origWidth) * $origHeight;
                $resized = imagecreatetruecolor($maxWidth, $newHeight);
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
                imagefilledrectangle($resized, 0, 0, $maxWidth, $newHeight, $transparent);
                imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $newHeight, $origWidth, $origHeight);
                imagedestroy($image);
                $image = $resized;
            }
            
            $dir = __DIR__ . '/../../uploads';
            if (!is_dir($dir)) mkdir($dir, 0755, true);
            
            $filename = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $id) . '_' . uniqid() . '.webp';
            $filepath = $dir . '/' . $filename;
            
            // Save as WebP with 80% quality
            imagewebp($image, $filepath, 80);
            imagedestroy($image);
            
            return '/backend-php/uploads/' . $filename;
        } catch (\Exception $e) {
            error_log("Error saving WebP: " . $e->getMessage());
            return $base64String; // Fallback to original
        }
    }

    /**
     * Create new product
     */
    public function create($data) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            // Generate ID if not provided
            $id = $data['id'] ?? $data['_id'] ?? uniqid('prod_', true);
            
            $imageUrl = $this->saveBase64Image($data['image'] ?? null, $id);
            
            $sql = "INSERT INTO products (id, name, price, description, category, size, quantity, discount, image) 
                    VALUES (:id, :name, :price, :description, :category, :size, :quantity, :discount, :image)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':name' => $data['name'] ?? '',
                ':price' => $data['price'] ?? 0,
                ':description' => $data['description'] ?? '',
                ':category' => $data['category'] ?? 'others',
                ':size' => $data['size'] ?? '',
                ':quantity' => $data['quantity'] ?? 0,
                ':discount' => $data['discount'] ?? 0,
                ':image' => $imageUrl
            ]);
            
            return $this->findById($id);
        } catch (\Exception $e) {
            error_log("Error creating product: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update product
     */
    public function update($id, $data) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            $fields = [];
            $params = [':id' => $id];
            
            if (isset($data['name'])) {
                $fields[] = "name = :name";
                $params[':name'] = $data['name'];
            }
            if (isset($data['price'])) {
                $fields[] = "price = :price";
                $params[':price'] = $data['price'];
            }
            if (isset($data['description'])) {
                $fields[] = "description = :description";
                $params[':description'] = $data['description'];
            }
            if (isset($data['category'])) {
                $fields[] = "category = :category";
                $params[':category'] = $data['category'];
            }
            if (isset($data['size'])) {
                $fields[] = "size = :size";
                $params[':size'] = $data['size'];
            }
            if (isset($data['quantity'])) {
                $fields[] = "quantity = :quantity";
                $params[':quantity'] = $data['quantity'];
            }
            if (isset($data['discount'])) {
                $fields[] = "discount = :discount";
                $params[':discount'] = $data['discount'];
            }
            if (isset($data['image'])) {
                // Determine if we need to convert
                $imageUrl = $this->saveBase64Image($data['image'], $id);
                $fields[] = "image = :image";
                $params[':image'] = $imageUrl;
            }
            
            if (empty($fields)) {
                return $this->findById($id);
            }
            
            $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            return $this->findById($id);
        } catch (\Exception $e) {
            error_log("Error updating product: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Delete product
     */
    public function delete($id) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
            $stmt->execute([':id' => $id]);
            
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error deleting product: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update product quantity
     */
    public function updateQuantity($id, $quantity) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = \Database::getConnection();

            // Ensure quantity is an integer
            $quantity = (int)$quantity;
            if ($quantity < 0) {
                $quantity = 0; // Prevent negative quantities
            }

            $sql = "UPDATE products SET quantity = :quantity, updatedAt = NOW() WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':quantity' => $quantity,
                ':id' => $id
            ]);

            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error updating product quantity: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Decrement product quantity
     */
    public function decrementQuantity($id, $amount = 1) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = \Database::getConnection();

            $sql = "UPDATE products SET quantity = GREATEST(0, quantity - :amount), updatedAt = NOW() WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':amount' => (int)$amount,
                ':id' => $id
            ]);

            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error decrementing product quantity: " . $e->getMessage());
            throw $e;
    }
}

    /**
     * Increment product quantity
     */
    public function incrementQuantity($id, $amount = 1) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = \Database::getConnection();

            $sql = "UPDATE products SET quantity = quantity + :amount, updatedAt = NOW() WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':amount' => (int)$amount,
                ':id' => $id
            ]);

            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error incrementing product quantity: " . $e->getMessage());
            throw $e;
        }
    }
}

