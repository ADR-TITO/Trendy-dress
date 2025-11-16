<?php
/**
 * M-Pesa Transaction Model
 */

namespace App\Models;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class MpesaTransaction {
    private $db;
    private $collection;
    
    public function __construct() {
        $this->db = \Database::getDatabase();
        $this->collection = $this->db->mpesa_transactions;
    }
    
    /**
     * Find by receipt number
     */
    public function findByReceiptNumber($receiptNumber) {
        try {
            $transaction = $this->collection->findOne([
                'receiptNumber' => strtoupper($receiptNumber)
            ]);
            return $transaction ? $this->convertToArray($transaction) : null;
        } catch (\Exception $e) {
            error_log("❌ Error finding transaction: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create new transaction
     */
    public function create($data) {
        try {
            $now = new UTCDateTime();
            
            $transaction = [
                'receiptNumber' => strtoupper($data['receiptNumber'] ?? ''),
                'transactionDate' => isset($data['transactionDate']) 
                    ? new UTCDateTime(strtotime($data['transactionDate']) * 1000)
                    : $now,
                'amount' => (float)($data['amount'] ?? 0),
                'phoneNumber' => $data['phoneNumber'] ?? '',
                'accountReference' => $data['accountReference'] ?? '',
                'transactionType' => $data['transactionType'] ?? 'CustomerPayBillOnline',
                'merchantRequestID' => $data['merchantRequestID'] ?? '',
                'checkoutRequestID' => $data['checkoutRequestID'] ?? '',
                'resultCode' => (int)($data['resultCode'] ?? 0),
                'resultDesc' => $data['resultDesc'] ?? '',
                'mpesaReceiptNumber' => $data['mpesaReceiptNumber'] ?? '',
                'rawData' => $data['rawData'] ?? [],
                'verified' => $data['verified'] ?? false,
                'verifiedAt' => $data['verified'] ? $now : null,
                'usedInOrder' => null,
                'createdAt' => $now,
                'updatedAt' => $now,
            ];
            
            $result = $this->collection->insertOne($transaction);
            return $this->findByReceiptNumber($data['receiptNumber']);
        } catch (\Exception $e) {
            error_log("❌ Error creating transaction: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert to array
     */
    private function convertToArray($transaction) {
        $array = [
            '_id' => (string)$transaction['_id'],
            'receiptNumber' => $transaction['receiptNumber'] ?? '',
            'amount' => $transaction['amount'] ?? 0,
            'phoneNumber' => $transaction['phoneNumber'] ?? '',
            'verified' => $transaction['verified'] ?? false,
        ];
        
        if (isset($transaction['transactionDate']) && $transaction['transactionDate'] instanceof UTCDateTime) {
            $array['transactionDate'] = $transaction['transactionDate']->toDateTime()->format('c');
        }
        
        return $array;
    }
}

