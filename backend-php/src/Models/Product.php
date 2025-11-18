<?php
namespace App\Models;

require_once __DIR__ . '/../../config/database.php';

use Database;

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
                
                // Include image only if requested (to reduce response size)
                if ($includeImages && !empty($product['image'])) {
                    $item['image'] = $product['image'];
                } else {
                    $item['image'] = null;
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
            
            $sql = "INSERT INTO products (id, name, price, description, category, size, quantity, image) 
                    VALUES (:id, :name, :price, :description, :category, :size, :quantity, :image)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':name' => $data['name'] ?? '',
                ':price' => $data['price'] ?? 0,
                ':description' => $data['description'] ?? '',
                ':category' => $data['category'] ?? 'others',
                ':size' => $data['size'] ?? '',
                ':quantity' => $data['quantity'] ?? 0,
                ':image' => $data['image'] ?? null
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
            if (isset($data['image'])) {
                $fields[] = "image = :image";
                $params[':image'] = $data['image'];
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
}
