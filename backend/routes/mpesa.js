const express = require('express');
const router = express.Router();
const MpesaTransaction = require('../models/MpesaTransaction');
const { mongoose } = require('../database/db');
const mpesaService = require('../services/mpesaService');

// M-Pesa webhook endpoint to receive transaction notifications
router.post('/webhook', async (req, res) => {
    try {
        const callbackData = req.body;
        
        console.log('📥 M-Pesa webhook received:', {
            type: callbackData.Body?.stkCallback?.ResultCode !== undefined ? 'STK' : 'Other',
            resultCode: callbackData.Body?.stkCallback?.ResultCode,
            merchantRequestID: callbackData.Body?.stkCallback?.MerchantRequestID
        });

        // Handle STK Push callback
        if (callbackData.Body && callbackData.Body.stkCallback) {
            const stkCallback = callbackData.Body.stkCallback;
            
            if (stkCallback.ResultCode === 0) {
                // Transaction successful
                const callbackMetadata = stkCallback.CallbackMetadata;
                const items = callbackMetadata?.Item || [];
                
                // Extract transaction details
                let receiptNumber = '';
                let amount = 0;
                let phoneNumber = '';
                let transactionDate = new Date();
                
                items.forEach(item => {
                    if (item.Name === 'MpesaReceiptNumber') {
                        receiptNumber = item.Value || '';
                    } else if (item.Name === 'Amount') {
                        amount = parseFloat(item.Value) || 0;
                    } else if (item.Name === 'PhoneNumber') {
                        phoneNumber = item.Value || '';
                    } else if (item.Name === 'TransactionDate') {
                        // M-Pesa date format: YYYYMMDDHHmmss
                        const dateStr = item.Value?.toString() || '';
                        if (dateStr.length === 14) {
                            const year = parseInt(dateStr.substring(0, 4));
                            const month = parseInt(dateStr.substring(4, 6)) - 1;
                            const day = parseInt(dateStr.substring(6, 8));
                            const hour = parseInt(dateStr.substring(8, 10));
                            const minute = parseInt(dateStr.substring(10, 12));
                            const second = parseInt(dateStr.substring(12, 14));
                            transactionDate = new Date(year, month, day, hour, minute, second);
                        }
                    }
                });

                if (receiptNumber && mongoose.connection.readyState === 1) {
                    // Check if transaction already exists
                    const existing = await MpesaTransaction.findByReceiptNumber(receiptNumber);
                    
                    if (!existing) {
                        // Save new transaction
                        const transaction = new MpesaTransaction({
                            receiptNumber: receiptNumber.toUpperCase(),
                            transactionDate: transactionDate,
                            amount: amount,
                            phoneNumber: phoneNumber,
                            accountReference: stkCallback.MerchantRequestID || '',
                            transactionType: 'CustomerPayBillOnline',
                            merchantRequestID: stkCallback.MerchantRequestID || '',
                            checkoutRequestID: stkCallback.CheckoutRequestID || '',
                            resultCode: stkCallback.ResultCode,
                            resultDesc: stkCallback.ResultDesc || 'Success',
                            mpesaReceiptNumber: receiptNumber,
                            rawData: callbackData,
                            verified: true
                        });
                        
                        await transaction.save();
                        console.log('✅ M-Pesa transaction saved:', receiptNumber);
                    } else {
                        console.log('ℹ️ M-Pesa transaction already exists:', receiptNumber);
                    }
                }
            } else {
                // Transaction failed
                console.log('❌ M-Pesa transaction failed:', {
                    resultCode: stkCallback.ResultCode,
                    resultDesc: stkCallback.ResultDesc
                });
            }
        }

        // Always respond with success to M-Pesa
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
    } catch (error) {
        console.error('❌ Error processing M-Pesa webhook:', error);
        // Still respond with success to prevent M-Pesa from retrying
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
    }
});

// Manual transaction sync endpoint (for testing or manual verification)
router.post('/sync-transaction', async (req, res) => {
    try {
        const { receiptNumber, amount, phoneNumber, transactionDate } = req.body;
        
        if (!receiptNumber) {
            return res.status(400).json({ error: 'Receipt number is required' });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const code = receiptNumber.toUpperCase().trim();
        const existing = await MpesaTransaction.findByReceiptNumber(code);
        
        if (existing) {
            return res.json({
                success: true,
                message: 'Transaction already exists',
                transaction: existing
            });
        }

        const transaction = new MpesaTransaction({
            receiptNumber: code,
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
            amount: amount || 0,
            phoneNumber: phoneNumber || '',
            verified: true,
            rawData: { manual: true }
        });

        await transaction.save();
        
        res.json({
            success: true,
            message: 'Transaction synced successfully',
            transaction: transaction
        });
    } catch (error) {
        console.error('❌ Error syncing transaction:', error);
        res.status(500).json({ error: 'Failed to sync transaction', message: error.message });
    }
});

// Get all M-Pesa transactions (Admin only)
router.get('/transactions', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { phoneNumber, startDate, endDate, limit = 100 } = req.query;
        
        let query = {};
        if (phoneNumber) {
            query.phoneNumber = phoneNumber;
        }
        if (startDate || endDate) {
            query.transactionDate = {};
            if (startDate) query.transactionDate.$gte = new Date(startDate);
            if (endDate) query.transactionDate.$lte = new Date(endDate);
        }

        const transactions = await MpesaTransaction.find(query)
            .sort({ transactionDate: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            count: transactions.length,
            transactions: transactions
        });
    } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
    }
});

module.exports = router;







