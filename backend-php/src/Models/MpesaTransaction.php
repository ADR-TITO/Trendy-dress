<?php
namespace App\Models;

require_once __DIR__ . '/../../config/database.php';

use Database;
use PDO;

class MpesaTransaction {
    /**
     * Find by receipt number
     */
    public function findByReceiptNumber($receiptNumber) {
        try {
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM mpesa_transactions WHERE receiptNumber = :receiptNumber");
            $stmt->execute([':receiptNumber' => strtoupper($receiptNumber)]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$transaction) {
                return null;
            }
            
            return $this->convertToArray($transaction);
        } catch (\Exception $e) {
            error_log("Error finding transaction by receipt number: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find by CheckoutRequestID
     */
    public function findByCheckoutRequestID($checkoutRequestID) {
        try {
            $pdo = Database::getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM mpesa_transactions WHERE checkoutRequestID = :checkoutRequestID");
            $stmt->execute([':checkoutRequestID' => $checkoutRequestID]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$transaction) {
                return null;
            }
            
            return $this->convertToArray($transaction);
        } catch (\Exception $e) {
            error_log("Error finding transaction by CheckoutRequestID: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find recent transactions by phone number
     */
    public function findAll($phoneNumber = null, $limit = 10) {
        try {
            $pdo = Database::getConnection();
            
            $sql = "SELECT * FROM mpesa_transactions";
            $params = [];
            
            if ($phoneNumber) {
                // Handle phone number formats (07..., 2547...)
                $cleanPhone = preg_replace('/^(?:254|\+254|0)?/', '', $phoneNumber);
                $sql .= " WHERE phoneNumber LIKE :phone";
                $params[':phone'] = '%' . $cleanPhone;
            }
            
            $sql .= " ORDER BY transactionDate DESC LIMIT :limit";
            
            $stmt = $pdo->prepare($sql);
            if ($phoneNumber) {
                $stmt->bindValue(':phone', '%' . $cleanPhone);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            
            $stmt->execute();
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map([$this, 'convertToArray'], $transactions);
        } catch (\Exception $e) {
            error_log("Error finding transactions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create new transaction
     */
    public function create($data) {
        try {
            $pdo = Database::getConnection();
            
            // Handle pending transactions (no receipt number yet)
            $receiptNumber = $data['receiptNumber'] ?? '';
            if (empty($receiptNumber)) {
                // Use placeholder for pending transactions
                $receiptNumber = 'PENDING_' . ($data['checkoutRequestID'] ?? uniqid());
            }
            
            $sql = "INSERT INTO mpesa_transactions (receiptNumber, transactionDate, phoneNumber, amount, merchantRequestID, checkoutRequestID, orderId, resultCode, resultDesc) 
                    VALUES (:receiptNumber, :transactionDate, :phoneNumber, :amount, :merchantRequestID, :checkoutRequestID, :orderId, :resultCode, :resultDesc)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':receiptNumber' => strtoupper($receiptNumber),
                ':transactionDate' => $data['transactionDate'] ?? date('Y-m-d H:i:s'),
                ':phoneNumber' => $data['phoneNumber'] ?? '',
                ':amount' => $data['amount'] ?? 0,
                ':merchantRequestID' => $data['merchantRequestID'] ?? '',
                ':checkoutRequestID' => $data['checkoutRequestID'] ?? '',
                ':orderId' => $data['orderId'] ?? null, // Add orderId
                ':resultCode' => $data['resultCode'] ?? null,
                ':resultDesc' => $data['resultDesc'] ?? 'Pending'
            ]);
            
            return $this->findByReceiptNumber($receiptNumber);
        } catch (\Exception $e) {
            error_log("Error creating transaction: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update transaction
     */
    public function update($id, $data) {
        try {
            $pdo = Database::getConnection();
            
            $fields = [];
            $params = [':id' => $id];
            
            if (isset($data['receiptNumber'])) {
                $fields[] = "receiptNumber = :receiptNumber";
                $params[':receiptNumber'] = strtoupper($data['receiptNumber']);
            }
            if (isset($data['resultCode'])) {
                $fields[] = "resultCode = :resultCode";
                $params[':resultCode'] = $data['resultCode'];
            }
            if (isset($data['resultDesc'])) {
                $fields[] = "resultDesc = :resultDesc";
                $params[':resultDesc'] = $data['resultDesc'];
            }
            if (isset($data['amount'])) {
                $fields[] = "amount = :amount";
                $params[':amount'] = $data['amount'];
            }
            if (isset($data['phoneNumber'])) {
                $fields[] = "phoneNumber = :phoneNumber";
                $params[':phoneNumber'] = $data['phoneNumber'];
            }
            if (isset($data['orderId'])) {
                $fields[] = "orderId = :orderId";
                $params[':orderId'] = $data['orderId'];
            }
            
            if (empty($fields)) {
                return false;
            }
            
            $sql = "UPDATE mpesa_transactions SET " . implode(', ', $fields) . " WHERE id = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            return true;
        } catch (\Exception $e) {
            error_log("Error updating transaction: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert to array
     */
    private function convertToArray($transaction) {
        // Defensive: handle missing columns gracefully
        $receiptNumber = $transaction['receiptNumber'] ?? '';
        $isPending = strpos($receiptNumber, 'PENDING_') === 0;
        
        return [
            '_id' => $transaction['id'] ?? '',
            'receiptNumber' => $isPending ? null : $receiptNumber,
            'amount' => isset($transaction['amount']) ? (float)$transaction['amount'] : 0.0,
            'phoneNumber' => $transaction['phoneNumber'] ?? '',
            'orderId' => $transaction['orderId'] ?? null,
            'transactionDate' => $transaction['transactionDate'] ?? date('Y-m-d H:i:s'),
            'status' => $isPending ? 'pending' : ($transaction['resultCode'] === 0 ? 'completed' : 'failed'),
            'resultCode' => $transaction['resultCode'],
            'resultDesc' => $transaction['resultDesc'],
            'verified' => !$isPending && $transaction['resultCode'] === 0
        ];
    }
}
