<?php
namespace App\Models;

require_once __DIR__ . '/../../config/database.php';

use Database;
use PDO;

class Order {
    /**
     * Find order by orderId
     */
    public function findByOrderId($orderId) {
        try {
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE orderId = :orderId");
            $stmt->execute([':orderId' => $orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$order) {
                return null;
            }
            
            return $this->convertToArray($order);
        } catch (\Exception $e) {
            error_log("Error finding order: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Find order by M-Pesa code
     */
    public function findByMpesaCode($mpesaCode) {
        try {
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE mpesaCode = :mpesaCode");
            $stmt->execute([':mpesaCode' => strtoupper($mpesaCode)]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$order) {
                return null;
            }
            
            return $this->convertToArray($order);
        } catch (\Exception $e) {
            error_log("Error finding order by M-Pesa code: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get all orders
     */
    public function findAll($completedOnly = false) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            // Check if table exists first
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'orders'");
            if ($tableCheck->rowCount() === 0) {
                error_log("⚠️ Orders table does not exist - returning empty array");
                return [];
            }
            
            if ($completedOnly) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE deliveryStatus = 'delivered' ORDER BY createdAt DESC");
            } else {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE (deliveryStatus != 'delivered' OR deliveryStatus IS NULL) ORDER BY createdAt DESC");
            }
            
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [];
            foreach ($orders as $order) {
                $result[] = $this->convertToArray($order);
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("Error fetching orders: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create new order
     */
    public function create($data) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            // Generate ID if not provided
            $id = $data['id'] ?? $data['_id'] ?? uniqid('order_', true);
            $orderId = $data['orderId'] ?? uniqid('ORD', true);
            
            $sql = "INSERT INTO orders (id, orderId, customerName, customerPhone, customerEmail, items, totalAmount, paymentMethod, mpesaCode, deliveryStatus) 
                    VALUES (:id, :orderId, :customerName, :customerPhone, :customerEmail, :items, :totalAmount, :paymentMethod, :mpesaCode, :deliveryStatus)";
            
            $customer = $data['customer'] ?? [];
            $items = is_array($data['items']) ? json_encode($data['items']) : $data['items'];
            $delivery = $data['delivery'] ?? [];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':orderId' => $orderId,
                ':customerName' => $customer['name'] ?? '',
                ':customerPhone' => $customer['phone'] ?? '',
                ':customerEmail' => $customer['email'] ?? '',
                ':items' => $items,
                ':totalAmount' => $data['total'] ?? $data['totalAmount'] ?? 0,
                ':paymentMethod' => $data['paymentMethod'] ?? '',
                ':mpesaCode' => strtoupper($data['mpesaCode'] ?? ''),
                ':deliveryStatus' => $delivery['status'] ?? 'pending'
            ]);
            
            return $this->findByOrderId($orderId);
        } catch (\Exception $e) {
            error_log("Error creating order: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update delivery status
     */
    public function updateDeliveryStatus($orderId, $status, $deliveredBy = null) {
        try {
            $pdo = Database::getConnection();
            
            $sql = "UPDATE orders SET deliveryStatus = :status, deliveredBy = :deliveredBy WHERE orderId = :orderId";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':status' => $status,
                ':deliveredBy' => $deliveredBy ?? 'admin',
                ':orderId' => $orderId
            ]);
            
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Error updating delivery status: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert database row to array
     */
    private function convertToArray($order) {
        // Defensive: handle missing columns gracefully
        $items = json_decode($order['items'] ?? '[]', true) ?? [];
        
        return [
            '_id' => $order['id'] ?? '',
            'id' => $order['id'] ?? '',
            'orderId' => $order['orderId'] ?? '',
            'date' => $order['createdAt'] ?? date('Y-m-d H:i:s'),
            'customer' => [
                'name' => $order['customerName'] ?? '',
                'phone' => $order['customerPhone'] ?? '',
                'email' => $order['customerEmail'] ?? ''
            ],
            'items' => $items,
            'total' => isset($order['totalAmount']) ? (float)$order['totalAmount'] : 0.0,
            'totalAmount' => isset($order['totalAmount']) ? (float)$order['totalAmount'] : 0.0,
            'paymentMethod' => $order['paymentMethod'] ?? '',
            'mpesaCode' => $order['mpesaCode'] ?? '',
            'delivery' => [
                'status' => $order['deliveryStatus'] ?? 'pending',
                'deliveredBy' => $order['deliveredBy'] ?? null
            ],
            'createdAt' => $order['createdAt'] ?? date('Y-m-d H:i:s'),
            'updatedAt' => $order['updatedAt'] ?? date('Y-m-d H:i:s')
        ];
    }
}
