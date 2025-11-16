<?php
/**
 * Order Model
 */

namespace App\Models;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class Order {
    private $db;
    private $collection;
    
    public function __construct() {
        $this->db = \Database::getDatabase();
        $this->collection = $this->db->orders;
    }
    
    /**
     * Find order by orderId
     */
    public function findByOrderId($orderId) {
        try {
            $order = $this->collection->findOne(['orderId' => $orderId]);
            return $order ? $this->convertToArray($order) : null;
        } catch (\Exception $e) {
            error_log("❌ Error finding order: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Find order by M-Pesa code
     */
    public function findByMpesaCode($mpesaCode) {
        try {
            $order = $this->collection->findOne(['mpesaCode' => strtoupper($mpesaCode)]);
            return $order ? $this->convertToArray($order) : null;
        } catch (\Exception $e) {
            error_log("❌ Error finding order by M-Pesa code: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get all orders
     */
    public function findAll($completedOnly = false) {
        try {
            $filter = [];
            
            if ($completedOnly) {
                $filter['delivery.status'] = 'delivered';
            } else {
                $filter['delivery.status'] = ['$ne' => 'delivered'];
            }
            
            $options = ['sort' => ['createdAt' => -1]];
            $orders = $this->collection->find($filter, $options)->toArray();
            
            $result = [];
            foreach ($orders as $order) {
                $result[] = $this->convertToArray($order);
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("❌ Error fetching orders: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create new order
     */
    public function create($data) {
        try {
            $now = new UTCDateTime();
            
            $order = [
                'orderId' => $data['orderId'] ?? '',
                'date' => $data['date'] ?? date('Y-m-d H:i:s'),
                'customer' => $data['customer'] ?? [],
                'items' => $data['items'] ?? [],
                'total' => (float)($data['total'] ?? 0),
                'paymentMethod' => $data['paymentMethod'] ?? '',
                'mpesaCode' => strtoupper($data['mpesaCode'] ?? ''),
                'verified' => $data['verified'] ?? false,
                'verificationStatus' => $data['verificationStatus'] ?? 'pending',
                'delivery' => array_merge([
                    'option' => 'pickup',
                    'optionText' => 'Shop Pickup',
                    'cost' => 0,
                    'address' => '',
                    'status' => 'pending'
                ], $data['delivery'] ?? []),
                'subtotal' => (float)($data['subtotal'] ?? 0),
                'totalPaid' => (float)($data['totalPaid'] ?? 0),
                'mpesaCodes' => $data['mpesaCodes'] ?? [],
                'mpesaCodesString' => $data['mpesaCodesString'] ?? '',
                'verificationDetails' => $data['verificationDetails'] ?? [],
                'createdAt' => $now,
                'updatedAt' => $now,
            ];
            
            $result = $this->collection->insertOne($order);
            return $this->findByOrderId($data['orderId']);
        } catch (\Exception $e) {
            error_log("❌ Error creating order: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update delivery status
     */
    public function updateDeliveryStatus($orderId, $status, $deliveredBy = null) {
        try {
            $update = [
                '$set' => [
                    'delivery.status' => $status,
                    'updatedAt' => new UTCDateTime(),
                ]
            ];
            
            if ($status === 'delivered') {
                $update['$set']['delivery.deliveredAt'] = new UTCDateTime();
                if ($deliveredBy) {
                    $update['$set']['delivery.deliveredBy'] = $deliveredBy;
                }
            }
            
            $result = $this->collection->updateOne(
                ['orderId' => $orderId],
                $update
            );
            
            return $result->getMatchedCount() > 0;
        } catch (\Exception $e) {
            error_log("❌ Error updating delivery status: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert MongoDB document to array
     */
    private function convertToArray($order) {
        $array = [
            '_id' => (string)$order['_id'],
            'orderId' => $order['orderId'] ?? '',
            'date' => $order['date'] ?? '',
            'customer' => $order['customer'] ?? [],
            'items' => $order['items'] ?? [],
            'total' => $order['total'] ?? 0,
            'paymentMethod' => $order['paymentMethod'] ?? '',
            'mpesaCode' => $order['mpesaCode'] ?? '',
            'verified' => $order['verified'] ?? false,
            'verificationStatus' => $order['verificationStatus'] ?? 'pending',
            'delivery' => $order['delivery'] ?? [],
            'subtotal' => $order['subtotal'] ?? 0,
            'totalPaid' => $order['totalPaid'] ?? 0,
        ];
        
        // Convert dates
        if (isset($order['createdAt']) && $order['createdAt'] instanceof UTCDateTime) {
            $array['createdAt'] = $order['createdAt']->toDateTime()->format('c');
        }
        if (isset($order['updatedAt']) && $order['updatedAt'] instanceof UTCDateTime) {
            $array['updatedAt'] = $order['updatedAt']->toDateTime()->format('c');
        }
        if (isset($order['delivery']['deliveredAt']) && $order['delivery']['deliveredAt'] instanceof UTCDateTime) {
            $array['delivery']['deliveredAt'] = $order['delivery']['deliveredAt']->toDateTime()->format('c');
        }
        
        return $array;
    }
}

