<?php
/**
 * Product Model
 */

namespace App\Models;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class Product {
    private $db;
    private $collection;
    
    public function __construct() {
        $this->db = \Database::getDatabase();
        $this->collection = $this->db->products;
    }
    
    /**
     * Get all products
     */
    public function findAll($category = null, $includeImages = false) {
        try {
            $filter = [];
            
            if ($category && $category !== 'all') {
                $filter['category'] = $category;
            }
            
            $options = [
                'sort' => ['createdAt' => -1]
            ];
            
            $products = $this->collection->find($filter, $options)->toArray();
            
            // Convert MongoDB objects to arrays
            $result = [];
            foreach ($products as $product) {
                $productArray = [
                    '_id' => (string)$product['_id'],
                    'name' => $product['name'] ?? '',
                    'category' => $product['category'] ?? 'others',
                    'price' => $product['price'] ?? 0,
                    'discount' => $product['discount'] ?? 0,
                    'quantity' => $product['quantity'] ?? 0,
                    'size' => $product['size'] ?? '',
                    'createdAt' => $product['createdAt'] ?? new UTCDateTime(),
                    'updatedAt' => $product['updatedAt'] ?? new UTCDateTime(),
                ];
                
                if ($includeImages) {
                    $productArray['image'] = $product['image'] ?? '';
                } else {
                    $productArray['image'] = '';
                    $productArray['hasImage'] = !empty($product['image'] ?? '');
                }
                
                // Convert dates to ISO strings
                if ($productArray['createdAt'] instanceof UTCDateTime) {
                    $productArray['createdAt'] = $productArray['createdAt']->toDateTime()->format('c');
                }
                if ($productArray['updatedAt'] instanceof UTCDateTime) {
                    $productArray['updatedAt'] = $productArray['updatedAt']->toDateTime()->format('c');
                }
                
                $result[] = $productArray;
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("❌ Error fetching products: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get product by ID
     */
    public function findById($id) {
        try {
            $product = $this->collection->findOne(['_id' => new ObjectId($id)]);
            
            if (!$product) {
                return null;
            }
            
            return $this->convertToArray($product);
        } catch (\Exception $e) {
            error_log("❌ Error fetching product: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create new product
     */
    public function create($data) {
        try {
            $now = new UTCDateTime();
            
            $product = [
                'name' => $data['name'] ?? '',
                'category' => $data['category'] ?? 'others',
                'price' => (float)($data['price'] ?? 0),
                'discount' => (float)($data['discount'] ?? 0),
                'quantity' => (int)($data['quantity'] ?? 0),
                'size' => $data['size'] ?? '',
                'image' => $data['image'] ?? '',
                'createdAt' => $now,
                'updatedAt' => $now,
            ];
            
            $result = $this->collection->insertOne($product);
            
            return $this->findById((string)$result->getInsertedId());
        } catch (\Exception $e) {
            error_log("❌ Error creating product: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update product
     */
    public function update($id, $data) {
        try {
            $update = [
                '$set' => [
                    'updatedAt' => new UTCDateTime(),
                ]
            ];
            
            $allowedFields = ['name', 'category', 'price', 'discount', 'quantity', 'size', 'image'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $update['$set'][$field] = $data[$field];
                }
            }
            
            $result = $this->collection->updateOne(
                ['_id' => new ObjectId($id)],
                $update
            );
            
            if ($result->getMatchedCount() === 0) {
                return null;
            }
            
            return $this->findById($id);
        } catch (\Exception $e) {
            error_log("❌ Error updating product: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Delete product
     */
    public function delete($id) {
        try {
            $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
            return $result->getDeletedCount() > 0;
        } catch (\Exception $e) {
            error_log("❌ Error deleting product: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert MongoDB document to array
     */
    private function convertToArray($product) {
        $array = [
            '_id' => (string)$product['_id'],
            'name' => $product['name'] ?? '',
            'category' => $product['category'] ?? 'others',
            'price' => $product['price'] ?? 0,
            'discount' => $product['discount'] ?? 0,
            'quantity' => $product['quantity'] ?? 0,
            'size' => $product['size'] ?? '',
            'image' => $product['image'] ?? '',
        ];
        
        // Convert dates
        if (isset($product['createdAt']) && $product['createdAt'] instanceof UTCDateTime) {
            $array['createdAt'] = $product['createdAt']->toDateTime()->format('c');
        }
        if (isset($product['updatedAt']) && $product['updatedAt'] instanceof UTCDateTime) {
            $array['updatedAt'] = $product['updatedAt']->toDateTime()->format('c');
        }
        
        return $array;
    }
}

