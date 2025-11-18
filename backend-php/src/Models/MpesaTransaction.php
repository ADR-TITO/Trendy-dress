<?php
namespace App\Models;

require_once __DIR__ . '/../../config/database.php';

use Database;

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
            error_log("Error finding transaction: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Create new transaction
     */
    public function create($data) {
        try {
            $pdo = Database::getConnection();
            
            $sql = "INSERT INTO mpesa_transactions (receiptNumber, transactionDate, phoneNumber, amount, merchantRequestID, checkoutRequestID, resultCode, resultDesc) 
                    VALUES (:receiptNumber, :transactionDate, :phoneNumber, :amount, :merchantRequestID, :checkoutRequestID, :resultCode, :resultDesc)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':receiptNumber' => strtoupper($data['receiptNumber'] ?? ''),
                ':transactionDate' => $data['transactionDate'] ?? date('Y-m-d H:i:s'),
                ':phoneNumber' => $data['phoneNumber'] ?? '',
                ':amount' => $data['amount'] ?? 0,
                ':merchantRequestID' => $data['merchantRequestID'] ?? '',
                ':checkoutRequestID' => $data['checkoutRequestID'] ?? '',
                ':resultCode' => $data['resultCode'] ?? 0,
                ':resultDesc' => $data['resultDesc'] ?? ''
            ]);
            
            return $this->findByReceiptNumber($data['receiptNumber']);
        } catch (\Exception $e) {
            error_log("Error creating transaction: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Convert to array
     */
    private function convertToArray($transaction) {
        // Defensive: handle missing columns gracefully
        $receiptNumber = $transaction['receiptNumber'] ?? '';
        return [
            '_id' => $transaction['id'] ?? '',
            'receiptNumber' => $receiptNumber,
            'amount' => isset($transaction['amount']) ? (float)$transaction['amount'] : 0.0,
            'phoneNumber' => $transaction['phoneNumber'] ?? '',
            'transactionDate' => $transaction['transactionDate'] ?? date('Y-m-d H:i:s'),
            'verified' => !empty($receiptNumber)
        ];
    }
}
