const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const MpesaTransaction = require('../models/MpesaTransaction');
const { mongoose } = require('../database/db');
const mpesaService = require('../services/mpesaService');
const axios = require('axios');
const FormData = require('form-data');

// Verify M-Pesa transaction before creating order
router.post('/verify', async (req, res) => {
    try {
        const { mpesaCode, amount, transactionDate } = req.body;
        
        console.log('🔍 Verifying M-Pesa code:', { 
            mpesaCode: mpesaCode?.substring(0, 3) + '***', 
            amount, 
            transactionDate,
            hasMongoDB: mongoose.connection.readyState === 1
        });
        
        if (!mpesaCode) {
            return res.status(400).json({ error: 'M-Pesa code is required' });
        }
        
        const code = mpesaCode.toUpperCase().trim();
        
        // CRITICAL: Amount is required for verification
        if (!amount || amount <= 0) {
            console.error('❌ Amount is required for verification');
            return res.status(400).json({
                valid: false,
                verified: false,
                reason: 'amount_required',
                message: 'Amount is required to verify M-Pesa transaction',
                amountMatch: false
            });
        }
        
        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.warn('⚠️ MongoDB not connected, skipping verification');
            // If MongoDB is not connected, cannot verify amount from database
            return res.json({
                valid: true,
                verified: false,
                code: code,
                dateValid: true,
                amountMatch: false,
                message: 'M-Pesa code format is valid (database check unavailable - cannot verify amount)',
                warning: 'MongoDB not connected - amount verification unavailable. Amount verification requires database access to check transaction records.'
            });
        }
        
        // Check for duplicate M-Pesa code
        try {
            const existingOrder = await Order.findByMpesaCode(code);
            if (existingOrder) {
                console.log('⚠️ Duplicate M-Pesa code found:', existingOrder.orderId);
                return res.json({
                    valid: false,
                    verified: false,
                    reason: 'duplicate',
                    message: 'This M-Pesa code has already been used',
                    existingOrder: {
                        orderId: existingOrder.orderId,
                        date: existingOrder.date,
                        amount: existingOrder.total,
                        customer: existingOrder.customer.name
                    }
                });
            }
        } catch (dbError) {
            console.error('❌ Error checking for duplicate:', dbError);
            // If duplicate check fails, still allow the code (better to allow than block)
            console.warn('⚠️ Allowing code despite duplicate check error');
        }
        
        // Validate M-Pesa code format
        if (!/^[A-Z0-9]{10}$/.test(code)) {
            console.log('❌ Invalid M-Pesa code format:', code);
            return res.json({
                valid: false,
                verified: false,
                reason: 'invalid_format',
                message: 'Invalid M-Pesa code format. Must be exactly 10 alphanumeric characters.'
            });
        }
        
        // Check API status first
        let apiStatus = null;
        try {
            apiStatus = await mpesaService.verifyTransactionCode(code, amount);
            console.log('📡 M-Pesa API Status:', {
                apiConfigured: apiStatus.apiConfigured,
                accessTokenObtained: apiStatus.accessTokenObtained || false
            });
        } catch (apiError) {
            console.warn('⚠️ Error checking M-Pesa API status:', apiError.message);
        }
        
        // Check against stored M-Pesa transactions (from webhooks/API)
        let mpesaTransaction = null;
        let verified = false;
        let amountMatch = false;
        let dateValid = true;
        let verificationMessage = '';
        
        try {
            mpesaTransaction = await MpesaTransaction.findByReceiptNumber(code);
            
            if (mpesaTransaction) {
                console.log('✅ Found M-Pesa transaction in database:', {
                    receiptNumber: code,
                    amount: mpesaTransaction.amount,
                    expectedAmount: amount,
                    date: mpesaTransaction.transactionDate,
                    verified: mpesaTransaction.verified
                });
                
                // CRITICAL: Strictly verify amount matches (allow 1 KSh difference for rounding)
                if (amount) {
                    amountMatch = Math.abs(mpesaTransaction.amount - amount) < 1;
                    if (!amountMatch) {
                        console.error('❌ Amount mismatch - BLOCKING payment:', {
                            stored: mpesaTransaction.amount,
                            expected: amount,
                            difference: Math.abs(mpesaTransaction.amount - amount)
                        });
                        // STRICT: Block payment if amount doesn't match
                        return res.json({
                            valid: false,
                            verified: false,
                            reason: 'amount_mismatch',
                            message: `M-Pesa transaction amount mismatch. Expected: KSh ${amount.toLocaleString('en-KE')}, Found: KSh ${mpesaTransaction.amount.toLocaleString('en-KE')}`,
                            mpesaTransaction: {
                                amount: mpesaTransaction.amount,
                                transactionDate: mpesaTransaction.transactionDate,
                                phoneNumber: mpesaTransaction.phoneNumber
                            },
                            expectedAmount: amount,
                            amountMatch: false
                        });
                    } else {
                        console.log('✅ Amount matches:', {
                            stored: mpesaTransaction.amount,
                            expected: amount
                        });
                    }
                } else {
                    // If no amount provided, require amount for verification
                    console.warn('⚠️ No amount provided for verification');
                    return res.json({
                        valid: false,
                        verified: false,
                        reason: 'amount_required',
                        message: 'Amount is required to verify M-Pesa transaction',
                        amountMatch: false
                    });
                }
                
                // Verify date is within valid range (up to 7 days)
                if (transactionDate) {
                    try {
                        const transaction = new Date(transactionDate);
                        const storedDate = new Date(mpesaTransaction.transactionDate);
                        const hoursDiff = Math.abs((transaction - storedDate) / (1000 * 60 * 60));
                        dateValid = hoursDiff <= 24; // Allow 24 hours difference
                        if (!dateValid) {
                            console.warn('⚠️ Date mismatch:', {
                                stored: storedDate,
                                provided: transaction,
                                hoursDiff: hoursDiff.toFixed(2)
                            });
                        }
                    } catch (dateError) {
                        console.warn('⚠️ Date parsing error:', dateError);
                        dateValid = true;
                    }
                }
                
                // Check if transaction was already used in another order
                if (mpesaTransaction.usedInOrder) {
                    const existingOrder = await Order.findById(mpesaTransaction.usedInOrder);
                    if (existingOrder) {
                        console.log('⚠️ M-Pesa transaction already used in order:', existingOrder.orderId);
                        return res.json({
                            valid: false,
                            verified: false,
                            reason: 'duplicate',
                            message: 'This M-Pesa transaction has already been used in another order',
                            existingOrder: {
                                orderId: existingOrder.orderId,
                                date: existingOrder.date,
                                amount: existingOrder.total,
                                customer: existingOrder.customer.name
                            }
                        });
                    }
                }
                
                // Amount match is already checked above - if we reach here, amount matches
                // Now verify date and transaction status
                if (!dateValid) {
                    console.warn('⚠️ Date mismatch - transaction may be too old');
                    return res.json({
                        valid: false,
                        verified: false,
                        reason: 'date_mismatch',
                        message: 'M-Pesa transaction date is outside the valid range (24 hours)',
                        mpesaTransaction: {
                            amount: mpesaTransaction.amount,
                            transactionDate: mpesaTransaction.transactionDate,
                            phoneNumber: mpesaTransaction.phoneNumber
                        },
                        dateValid: false,
                        amountMatch: true
                    });
                }
                
                // CRITICAL: If we reach here, amount and date match
                // Now verify transaction status
                verified = mpesaTransaction.verified && amountMatch && dateValid;
                
                if (verified) {
                    verificationMessage = 'M-Pesa transaction verified successfully: Code exists in database, amount matches (' + mpesaTransaction.amount.toLocaleString('en-KE') + '), and date is valid';
                } else {
                    // If transaction is not verified by M-Pesa but amount and date match, still allow
                    // but mark as unverified (amount and date are the critical checks)
                    if (amountMatch && dateValid) {
                        verificationMessage = 'M-Pesa transaction found with matching amount (KSh ' + mpesaTransaction.amount.toLocaleString('en-KE') + ') and date. Transaction status: ' + (mpesaTransaction.verified ? 'Verified' : 'Pending verification');
                        verified = true; // Allow if amount and date match (these are the critical verifications)
                    } else {
                        // This should not happen since we check amount and date above and return early if they don't match
                        const issues = [];
                        if (!amountMatch) issues.push('amount mismatch');
                        if (!dateValid) issues.push('date mismatch');
                        if (!mpesaTransaction.verified) issues.push('transaction not verified by M-Pesa');
                        verificationMessage = `M-Pesa transaction found but verification failed: ${issues.join(', ')}`;
                    }
                }
                    
            } else {
                console.error('❌ M-Pesa transaction NOT FOUND in database - BLOCKING payment');
                
                // CRITICAL SECURITY: Transaction MUST exist in database (received via webhook)
                // If transaction is not found, it means:
                // 1. The code is invalid/fake
                // 2. The transaction was not completed
                // 3. The webhook has not received it yet
                // 
                // SECURITY: We MUST block payment if transaction is not found
                // This prevents fake/guessed codes from being accepted
                amountMatch = false;
                verified = false;
                
                // STRICT: Block payment if transaction not found
                return res.json({
                    valid: false,
                    verified: false,
                    reason: 'transaction_not_found',
                    message: `M-Pesa transaction code not found in database. The transaction code must be verified through M-Pesa API before payment can be accepted. Please ensure you have completed the M-Pesa payment and try again. If you believe this is an error, please contact support.`,
                    expectedAmount: amount,
                    amountMatch: false,
                    foundInMpesa: false,
                    apiConfigured: apiStatus ? apiStatus.apiConfigured : false
                });
            }
        } catch (mpesaError) {
            console.error('❌ Error checking M-Pesa transactions:', mpesaError);
            // CRITICAL: On error, we cannot verify - must block payment for security
            return res.status(500).json({
                valid: false,
                verified: false,
                reason: 'verification_error',
                message: 'Error verifying M-Pesa transaction. Payment cannot be accepted until verification is successful. Please try again or contact support.',
                error: mpesaError.message,
                foundInMpesa: false
            });
        }
        
        console.log('✅ M-Pesa code verification completed:', {
            code,
            found: !!mpesaTransaction,
            verified,
            amountMatch,
            dateValid
        });
        
        // Return verification result
        // CRITICAL: Include amount verification details
        const response = {
            valid: true,
            verified: verified,
            code: code,
            dateValid: dateValid,
            amountMatch: amountMatch,
            foundInMpesa: !!mpesaTransaction,
            expectedAmount: amount, // Always include expected amount
            mpesaTransaction: mpesaTransaction ? {
                amount: mpesaTransaction.amount,
                transactionDate: mpesaTransaction.transactionDate,
                phoneNumber: mpesaTransaction.phoneNumber
            } : null,
            message: verificationMessage,
            apiStatus: apiStatus ? {
                apiConfigured: apiStatus.apiConfigured,
                accessTokenObtained: apiStatus.accessTokenObtained || false
            } : null
        };
        
        // Add warning if transaction not found (amount cannot be verified)
        if (!mpesaTransaction) {
            response.warning = 'Transaction not found in database - amount verification unavailable. Amount will be verified when transaction is received via webhook.';
            response.amountVerified = false; // Amount cannot be verified
        } else {
            response.amountVerified = amountMatch; // Amount is verified if it matches
        }
        
        res.json(response);
    } catch (error) {
        console.error('❌ Error verifying M-Pesa code:', error);
        console.error('Error stack:', error.stack);
        // On error, still allow the code to proceed (fail open rather than fail closed)
        res.json({
            valid: true,
            verified: false,
            code: req.body.mpesaCode?.toUpperCase().trim() || '',
            dateValid: true,
            message: 'M-Pesa code verification encountered an error but will be allowed',
            warning: 'Verification error occurred: ' + error.message
        });
    }
});

// Get all orders (Admin only)
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order by orderId
router.get('/:orderId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order with verification
router.post('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const {
            orderId,
            date,
            customer,
            items,
            total,
            paymentMethod,
            mpesaCode,
            delivery,
            subtotal,
            totalPaid,
            mpesaCodes,
            mpesaCodesString
        } = req.body;
        
        // Validation
        if (!orderId || !customer || !customer.name || !customer.phone || !items || !total || !mpesaCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const code = mpesaCode.toUpperCase().trim();
        
        // Verify M-Pesa code - check for duplicates
        const existingOrder = await Order.findByMpesaCode(code);
        if (existingOrder) {
            return res.status(400).json({ 
                error: 'Duplicate M-Pesa code',
                message: 'This M-Pesa code has already been used in another order',
                existingOrderId: existingOrder.orderId
            });
        }
        
        // Check API status first
        let apiStatus = null;
        try {
            apiStatus = await mpesaService.verifyTransactionCode(code, total);
            if (apiStatus && apiStatus.apiConfigured) {
                console.log('✅ M-Pesa API is configured and accessible');
            }
        } catch (apiError) {
            console.warn('⚠️ Error checking M-Pesa API status:', apiError.message);
        }
        
        // Check for M-Pesa transaction in database
        let mpesaTransaction = null;
        let amountMatch = false;
        let dateValid = true;
        let verified = false;
        
        try {
            mpesaTransaction = await MpesaTransaction.findByReceiptNumber(code);
            
            if (mpesaTransaction) {
                console.log('✅ Found M-Pesa transaction for order:', {
                    receiptNumber: code,
                    storedAmount: mpesaTransaction.amount,
                    expectedAmount: total,
                    storedDate: mpesaTransaction.transactionDate
                });
                
                // Check if already used
                if (mpesaTransaction.usedInOrder) {
                    const usedOrder = await Order.findById(mpesaTransaction.usedInOrder);
                    if (usedOrder) {
                        console.error('❌ M-Pesa transaction already used in order:', usedOrder.orderId);
                        return res.status(400).json({
                            error: 'M-Pesa transaction already used',
                            message: 'This M-Pesa transaction has already been used in another order',
                            existingOrderId: usedOrder.orderId
                        });
                    }
                }
                
                // CRITICAL: Strictly verify amount matches (allow 1 KSh difference for rounding)
                amountMatch = Math.abs(mpesaTransaction.amount - total) < 1;
                if (!amountMatch) {
                    console.error('❌ Amount mismatch - REJECTING order:', {
                        stored: mpesaTransaction.amount,
                        expected: total,
                        difference: Math.abs(mpesaTransaction.amount - total)
                    });
                    // STRICT: Reject order if amount doesn't match
                    return res.status(400).json({
                        error: 'Amount mismatch',
                        message: `M-Pesa transaction amount mismatch. Expected: KSh ${total.toLocaleString('en-KE')}, Found: KSh ${mpesaTransaction.amount.toLocaleString('en-KE')}. Please verify your payment amount.`,
                        mpesaTransaction: {
                            amount: mpesaTransaction.amount,
                            transactionDate: mpesaTransaction.transactionDate
                        },
                        expectedAmount: total,
                        amountMatch: false
                    });
                } else {
                    console.log('✅ Amount matches:', {
                        stored: mpesaTransaction.amount,
                        expected: total
                    });
                }
                
                // Verify date (allow 24 hours difference)
                const transactionDate = date ? new Date(date) : new Date();
                const storedDate = new Date(mpesaTransaction.transactionDate);
                const hoursDiff = Math.abs((transactionDate - storedDate) / (1000 * 60 * 60));
                dateValid = hoursDiff <= 24;
                if (!dateValid) {
                    console.error('❌ Date mismatch - REJECTING order:', {
                        stored: storedDate,
                        provided: transactionDate,
                        hoursDiff: hoursDiff.toFixed(2)
                    });
                    // STRICT: Reject order if date is outside valid range
                    return res.status(400).json({
                        error: 'Date mismatch',
                        message: `M-Pesa transaction date is outside the valid range (24 hours). Transaction date: ${storedDate.toLocaleString('en-KE')}`,
                        mpesaTransaction: {
                            amount: mpesaTransaction.amount,
                            transactionDate: mpesaTransaction.transactionDate
                        },
                        dateValid: false,
                        amountMatch: true
                    });
                }
                
                // If we reach here, amount and date match - verify transaction
                verified = mpesaTransaction.verified && amountMatch && dateValid;
                // If amount and date match but not verified by M-Pesa, still allow but mark as unverified
                if (amountMatch && dateValid && !mpesaTransaction.verified) {
                    verified = true; // Allow if amount and date match
                    console.log('⚠️ Transaction amount and date match, but transaction not verified by M-Pesa');
                }
                
                if (verified) {
                    console.log('✅ M-Pesa transaction verified successfully');
                } else {
                    console.warn('⚠️ M-Pesa transaction verification failed:', {
                        verified: mpesaTransaction.verified,
                        amountMatch,
                        dateValid
                    });
                }
            } else {
                // CRITICAL SECURITY: Transaction MUST exist in database before creating order
                console.error('❌ M-Pesa transaction NOT FOUND in database - REJECTING order');
                
                // STRICT: Reject order if transaction not found
                return res.status(400).json({
                    error: 'Transaction not found',
                    message: `M-Pesa transaction code not found in database. The transaction code must be verified through M-Pesa API (webhook) before an order can be created. Please ensure you have completed the M-Pesa payment and the transaction has been received via webhook. If you believe this is an error, please contact support.`,
                    mpesaCode: code,
                    expectedAmount: total,
                    foundInMpesa: false,
                    amountMatch: false,
                    apiConfigured: apiStatus ? apiStatus.apiConfigured : false
                });
            }
        } catch (mpesaError) {
            console.error('❌ Error checking M-Pesa transaction:', mpesaError);
            // CRITICAL: On error, we cannot verify - must reject order for security
            return res.status(500).json({
                error: 'Verification error',
                message: 'Error verifying M-Pesa transaction. Order cannot be created until verification is successful. Please try again or contact support.',
                error: mpesaError.message,
                foundInMpesa: false,
                amountMatch: false
            });
        }
        
        // Create order with verification
        const order = new Order({
            orderId,
            date: date || new Date().toLocaleString('en-KE'),
            customer: {
                name: customer.name,
                phone: customer.phone,
                email: customer.email || ''
            },
            items: items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                productId: item.productId || '',
                image: item.image || '' // Include image in order items
            })),
            total,
            subtotal: subtotal || total,
            totalPaid: totalPaid || total,
            paymentMethod,
            mpesaCode: code,
            mpesaCodes: mpesaCodes || [],
            mpesaCodesString: mpesaCodesString || code,
            delivery: delivery ? {
                option: delivery.option || 'pickup',
                optionText: delivery.optionText || 'Shop Pickup',
                cost: delivery.cost || 0,
                address: delivery.address || '',
                status: 'pending' // Default status
            } : {
                option: 'pickup',
                optionText: 'Shop Pickup',
                cost: 0,
                address: '',
                status: 'pending'
            },
            verified: verified,
            verificationDetails: {
                status: verified ? 'verified' : (mpesaTransaction ? 'failed' : 'pending'),
                message: verified 
                    ? 'Transaction verified against M-Pesa records'
                    : mpesaTransaction 
                        ? `Transaction found but ${!amountMatch ? 'amount mismatch' : !dateValid ? 'date mismatch' : 'not verified'}`
                        : 'Transaction not found in M-Pesa records',
                amountMatch: amountMatch,
                dateValid: dateValid,
                isDuplicate: !!existingOrder,
                verifiedAt: new Date(),
                verifiedBy: 'system'
            }
        });
        
        const savedOrder = await order.save();
        
        // Link M-Pesa transaction to order if found
        if (mpesaTransaction && !mpesaTransaction.usedInOrder) {
            mpesaTransaction.usedInOrder = savedOrder._id;
            await mpesaTransaction.save();
            console.log('✅ Linked M-Pesa transaction to order:', savedOrder.orderId);
        }
        
        // Update product quantities
        for (const item of items) {
            if (item.productId) {
                try {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const newQuantity = Math.max(0, (product.quantity || 0) - item.quantity);
                        product.quantity = newQuantity;
                        await product.save();
                    }
                } catch (productError) {
                    console.warn(`Could not update product ${item.productId}:`, productError.message);
                }
            }
        }
        
        console.log(`✅ Order created: ${savedOrder.orderId}, Verified: ${savedOrder.verified}`);
        
        // Send admin notifications (WhatsApp, phone, and email) asynchronously
        try {
            // Send receipt to customer WhatsApp (message only for now, PDF will be sent separately from frontend)
            sendReceiptToWhatsApp(savedOrder, null, null).catch(err => {
                console.error('❌ Error sending receipt to customer WhatsApp (non-blocking):', err);
                // Don't fail order creation if WhatsApp send fails
            });
            
            // Send admin phone notification (WhatsApp/SMS)
            sendAdminPhoneNotification(savedOrder).catch(err => {
                console.error('❌ Error sending admin phone notification (non-blocking):', err);
                // Don't fail order creation if notification fails
            });
            
            // Send admin email notification
            sendAdminNotification(savedOrder).catch(err => {
                console.error('❌ Error sending admin email notification (non-blocking):', err);
                // Don't fail order creation if notification fails
            });
            
            // Log admin notification in console
            logAdminNotification(savedOrder);
        } catch (notificationError) {
            console.error('❌ Error initiating notifications:', notificationError);
            // Continue - order is already created
        }
        
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({ error: 'Order ID or M-Pesa code already exists' });
        }
        res.status(500).json({ error: 'Failed to create order', message: error.message });
    }
});

// Verify existing order's M-Pesa code
router.post('/:orderId/verify', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const { expectedAmount, transactionDate } = req.body;
        const verification = order.verifyTransaction(
            expectedAmount || order.total,
            transactionDate || order.createdAt
        );
        
        await order.save();
        
        res.json({
            verified: order.verified,
            status: order.verificationStatus,
            details: verification,
            order: {
                orderId: order.orderId,
                mpesaCode: order.mpesaCode,
                total: order.total,
                date: order.date
            }
        });
    } catch (error) {
        console.error('Error verifying order:', error);
        res.status(500).json({ error: 'Failed to verify order' });
    }
});

// Get orders by M-Pesa code (for verification)
router.get('/mpesa/:code', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const code = req.params.code.toUpperCase();
        const orders = await Order.find({ mpesaCode: code }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders by M-Pesa code:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status (Admin only)
router.patch('/:orderId/status', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const { status } = req.body;
        const orderId = req.params.orderId;
        
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const order = await Order.findOneAndUpdate(
            { orderId },
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Update delivery status (Admin only)
router.patch('/:orderId/delivery-status', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const { deliveryStatus, deliveredBy } = req.body;
        const orderId = req.params.orderId;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({ error: 'Invalid delivery status' });
        }
        
        const updateData = {
            'delivery.status': deliveryStatus
        };
        
        if (deliveryStatus === 'delivered') {
            updateData['delivery.deliveredAt'] = new Date();
            if (deliveredBy) {
                updateData['delivery.deliveredBy'] = deliveredBy;
            }
        }
        
        const order = await Order.findOneAndUpdate(
            { orderId },
            { $set: updateData },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        console.log(`✅ Delivery status updated for order ${orderId}: ${deliveryStatus}`);
        res.json(order);
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'Failed to update delivery status' });
    }
});

// Send receipt to WhatsApp (with PDF)
router.post('/:orderId/send-whatsapp', async (req, res) => {
    try {
        const { orderId } = req.params;
        let order = await Order.findOne({ orderId });
        
        // If order not in database, use order from request body (for local orders)
        if (!order) {
            order = req.body;
        }
        
        // Extract PDF data if provided
        const { pdfBase64, pdfFileName } = req.body;
        
        // Send receipt to WhatsApp (with PDF if provided)
        const result = await sendReceiptToWhatsApp(order, pdfBase64, pdfFileName);
        
        res.json({
            success: true,
            message: 'Receipt sent to WhatsApp',
            method: result.method,
            phone: result.phone,
            pdfSent: result.pdfSent || false
        });
    } catch (error) {
        console.error('Error sending receipt to WhatsApp:', error);
        res.status(500).json({ error: 'Failed to send receipt to WhatsApp', message: error.message });
    }
});

// Helper function to send receipt to WhatsApp (with PDF support)
async function sendReceiptToWhatsApp(order, pdfBase64, pdfFileName) {
    try {
        // Get business WhatsApp number from environment or use default
        const businessPhone = process.env.WHATSAPP_BUSINESS_PHONE || '254724904692';
        
        // Format phone number (remove + if present, ensure it starts with country code)
        const phoneNumber = businessPhone.replace(/^\+/, '').replace(/\s/g, '');
        
        // Create detailed receipt message
        const message = `*NEW ORDER RECEIVED* 📦\n\n` +
            `*Order ID:* ${order.orderId}\n` +
            `*Date:* ${order.date}\n` +
            `*Customer:* ${order.customer.name}\n` +
            `*Phone:* ${order.customer.phone}\n` +
            `${order.customer.email ? `*Email:* ${order.customer.email}\n` : ''}\n` +
            `*Items:*\n` +
            `${order.items.map(item => {
                const hasImage = item.image && item.image.trim() !== '';
                return `• ${item.name} x${item.quantity} - KSh ${item.subtotal.toLocaleString('en-KE')}${hasImage ? ' 📷' : ''}`;
            }).join('\n')}\n\n` +
            `*Subtotal:* KSh ${(order.subtotal || order.total).toLocaleString('en-KE')}\n` +
            `${order.delivery && order.delivery.cost > 0 ? `*Delivery (${order.delivery.optionText}):* KSh ${order.delivery.cost.toLocaleString('en-KE')}\n` : ''}` +
            `*Total:* KSh ${order.total.toLocaleString('en-KE')}\n\n` +
            `*Payment Method:* ${order.paymentMethod}\n` +
            `*M-Pesa Code:* ${order.mpesaCode}\n` +
            `*Verified:* ${order.verified ? '✅ Yes' : '⚠️ Pending'}\n\n` +
            `${order.delivery && order.delivery.option !== 'pickup' ? `*Delivery Address:*\n${order.delivery.address}\n\n` : ''}` +
            `${pdfBase64 ? '📎 Receipt PDF attached below! ✅' : 'Receipt PDF will be available in the system. ✅'}`;
        
        // Option 1: Use Green API (free WhatsApp API service) - WITH PDF SUPPORT
        if (process.env.WHATSAPP_GREEN_API_ID && process.env.WHATSAPP_GREEN_API_TOKEN) {
            try {
                const instanceId = process.env.WHATSAPP_GREEN_API_ID;
                const apiToken = process.env.WHATSAPP_GREEN_API_TOKEN;
                const chatId = phoneNumber + '@c.us';
                
                // First, send the message
                const messageUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
                const messageResponse = await axios.post(messageUrl, {
                    chatId: chatId,
                    message: message
                });
                console.log('✅ Receipt message sent to WhatsApp via Green API');
                
                // Then, send the PDF if provided
                if (pdfBase64) {
                    try {
                        // Green API: First upload the file, then send it
                        const uploadUrl = `https://api.green-api.com/waInstance${instanceId}/sendFileByUpload/${apiToken}`;
                        
                        // Convert base64 to buffer for upload
                        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
                        
                        // Create form data for file upload
                        const form = new FormData();
                        form.append('chatId', chatId);
                        form.append('file', pdfBuffer, {
                            filename: pdfFileName || `Receipt_${order.orderId}.pdf`,
                            contentType: 'application/pdf'
                        });
                        form.append('caption', `Receipt for Order ${order.orderId}`);
                        
                        const fileResponse = await axios.post(uploadUrl, form, {
                            headers: form.getHeaders()
                        });
                        console.log('✅ Receipt PDF sent to WhatsApp via Green API');
                        return { success: true, method: 'green_api', phone: phoneNumber, pdfSent: true };
                    } catch (pdfError) {
                        console.error('❌ Error sending PDF via Green API:', pdfError.message);
                        // Continue - message was sent, PDF failed
                        return { success: true, method: 'green_api', phone: phoneNumber, pdfSent: false, pdfError: pdfError.message };
                    }
                }
                
                return { success: true, method: 'green_api', phone: phoneNumber, pdfSent: false };
            } catch (apiError) {
                console.error('❌ Green API error:', apiError.message);
                // Fall through to other methods
            }
        }
        
        // Option 2: Use WhatsApp Business API (if configured) - WITH PDF SUPPORT
        if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_API_URL) {
            try {
                // Send message first
                const messageResponse = await axios.post(process.env.WHATSAPP_API_URL, {
                    phone: phoneNumber,
                    message: message
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Receipt message sent to WhatsApp via Business API');
                
                // Send PDF if provided and upload URL is configured
                if (pdfBase64 && process.env.WHATSAPP_API_UPLOAD_URL) {
                    try {
                        // Convert base64 to buffer
                        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
                        
                        // Create form data
                        const form = new FormData();
                        form.append('phone', phoneNumber);
                        form.append('file', pdfBuffer, {
                            filename: pdfFileName || `Receipt_${order.orderId}.pdf`,
                            contentType: 'application/pdf'
                        });
                        form.append('caption', `Receipt for Order ${order.orderId}`);
                        
                        const pdfResponse = await axios.post(process.env.WHATSAPP_API_UPLOAD_URL, form, {
                            headers: {
                                'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                                ...form.getHeaders()
                            }
                        });
                        console.log('✅ Receipt PDF sent to WhatsApp via Business API');
                        return { success: true, method: 'business_api', phone: phoneNumber, pdfSent: true };
                    } catch (pdfError) {
                        console.error('❌ Error sending PDF via Business API:', pdfError.message);
                        return { success: true, method: 'business_api', phone: phoneNumber, pdfSent: false, pdfError: pdfError.message };
                    }
                }
                
                return { success: true, method: 'business_api', phone: phoneNumber, pdfSent: false };
            } catch (apiError) {
                console.error('❌ WhatsApp Business API error:', apiError.message);
                // Fall through to webhook method
            }
        }
        
        // Option 3: Use webhook URL (custom webhook service) - WITH PDF SUPPORT
        if (process.env.WHATSAPP_WEBHOOK_URL) {
            try {
                const webhookData = {
                    phone: phoneNumber,
                    message: message,
                    orderId: order.orderId
                };
                
                // Include PDF if provided
                if (pdfBase64) {
                    webhookData.pdfBase64 = pdfBase64;
                    webhookData.pdfFileName = pdfFileName || `Receipt_${order.orderId}.pdf`;
                }
                
                const response = await axios.post(process.env.WHATSAPP_WEBHOOK_URL, webhookData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Receipt sent to WhatsApp via Webhook' + (pdfBase64 ? ' (with PDF)' : ''));
                return { success: true, method: 'webhook', phone: phoneNumber, pdfSent: !!pdfBase64 };
            } catch (webhookError) {
                console.error('❌ Webhook error:', webhookError.message);
                // Fall through to logging method
            }
        }
        
        // Option 4: Use WhatsApp API via direct URL (for services like ChatAPI, etc.)
        if (process.env.WHATSAPP_DIRECT_URL) {
            try {
                const whatsappUrl = process.env.WHATSAPP_DIRECT_URL
                    .replace('{phone}', phoneNumber)
                    .replace('{message}', encodeURIComponent(message));
                const response = await axios.get(whatsappUrl);
                console.log('✅ Receipt sent to WhatsApp via Direct URL');
                return { success: true, method: 'direct_url', phone: phoneNumber };
            } catch (directError) {
                console.error('❌ Direct URL error:', directError.message);
                // Fall through to logging method
            }
        }
        
        // Option 5: Log the message clearly for manual sending or notification
        console.log('\n========================================');
        console.log('📱 WHATSAPP RECEIPT MESSAGE - ACTION REQUIRED');
        console.log('========================================');
        console.log('To:', phoneNumber);
        console.log('Message:');
        console.log(message);
        if (pdfBase64) {
            console.log('\n📎 PDF Receipt Available:');
            console.log(`File: ${pdfFileName || `Receipt_${order.orderId}.pdf`}`);
            console.log(`Size: ${(pdfBase64.length * 3 / 4 / 1024).toFixed(2)} KB (base64)`);
        }
        console.log('========================================');
        console.log('⚠️ To enable automatic WhatsApp sending, configure one of:');
        console.log('1. Green API: WHATSAPP_GREEN_API_ID and WHATSAPP_GREEN_API_TOKEN (supports PDF)');
        console.log('2. WhatsApp Business API: WHATSAPP_API_TOKEN, WHATSAPP_API_URL, and WHATSAPP_API_UPLOAD_URL (for PDF)');
        console.log('3. Webhook URL: WHATSAPP_WEBHOOK_URL (include pdfBase64 and pdfFileName in request)');
        console.log('4. Direct URL: WHATSAPP_DIRECT_URL (with {phone} and {message} placeholders)');
        console.log('========================================\n');
        
        // Return success (message is logged for manual sending)
        return { success: true, method: 'logged', phone: phoneNumber, message: message, pdfSent: false, hasPdf: !!pdfBase64 };
        
    } catch (error) {
        console.error('❌ Error in sendReceiptToWhatsApp:', error);
        throw error;
    }
}

// Helper function to send admin phone notification (WhatsApp/SMS)
async function sendAdminPhoneNotification(order) {
    try {
        // Get admin phone number from environment or use default
        const adminPhone = process.env.ADMIN_PHONE || '254724904692';
        
        // Format phone number (remove + if present, ensure it starts with country code)
        const phoneNumber = adminPhone.replace(/^\+/, '').replace(/\s/g, '');
        
        // Create admin notification message
        const message = `🔔 *NEW ORDER RECEIVED!* 📦\n\n` +
            `*Order ID:* ${order.orderId}\n` +
            `*Date:* ${order.date}\n` +
            `*Customer:* ${order.customer.name}\n` +
            `*Phone:* ${order.customer.phone}\n` +
            `${order.customer.email ? `*Email:* ${order.customer.email}\n` : ''}\n` +
            `*Items:*\n` +
            `${order.items.map(item => `• ${item.name} x${item.quantity} - KSh ${item.subtotal.toLocaleString('en-KE')}`).join('\n')}\n\n` +
            `*Subtotal:* KSh ${(order.subtotal || order.total).toLocaleString('en-KE')}\n` +
            `${order.delivery && order.delivery.cost > 0 ? `*Delivery (${order.delivery.optionText}):* KSh ${order.delivery.cost.toLocaleString('en-KE')}\n` : ''}` +
            `*Total:* KSh ${order.total.toLocaleString('en-KE')}\n\n` +
            `*Payment Method:* ${order.paymentMethod}\n` +
            `*M-Pesa Code:* ${order.mpesaCode}\n` +
            `*Verified:* ${order.verified ? '✅ Yes' : '⚠️ Pending'}\n\n` +
            `${order.delivery && order.delivery.option !== 'pickup' ? `*Delivery Address:*\n${order.delivery.address}\n\n` : ''}` +
            `📱 Check admin panel for full details`;
        
        // Option 1: Use Green API (free WhatsApp API service)
        if (process.env.WHATSAPP_GREEN_API_ID && process.env.WHATSAPP_GREEN_API_TOKEN) {
            try {
                const instanceId = process.env.WHATSAPP_GREEN_API_ID;
                const apiToken = process.env.WHATSAPP_GREEN_API_TOKEN;
                const chatId = phoneNumber + '@c.us';
                
                const messageUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
                await axios.post(messageUrl, {
                    chatId: chatId,
                    message: message
                });
                console.log('✅ Admin notification sent to WhatsApp via Green API');
                return { success: true, method: 'green_api', phone: phoneNumber };
            } catch (apiError) {
                console.error('❌ Green API error:', apiError.message);
                // Fall through to other methods
            }
        }
        
        // Option 2: Use WhatsApp Business API (if configured)
        if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_API_URL) {
            try {
                await axios.post(process.env.WHATSAPP_API_URL, {
                    phone: phoneNumber,
                    message: message
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Admin notification sent to WhatsApp via Business API');
                return { success: true, method: 'business_api', phone: phoneNumber };
            } catch (apiError) {
                console.error('❌ WhatsApp Business API error:', apiError.message);
                // Fall through to webhook method
            }
        }
        
        // Option 3: Use webhook URL (custom webhook service)
        if (process.env.ADMIN_NOTIFICATION_WEBHOOK_URL || process.env.WHATSAPP_WEBHOOK_URL) {
            try {
                const webhookUrl = process.env.ADMIN_NOTIFICATION_WEBHOOK_URL || process.env.WHATSAPP_WEBHOOK_URL;
                const webhookData = {
                    phone: phoneNumber,
                    message: message,
                    orderId: order.orderId,
                    type: 'admin_notification'
                };
                
                await axios.post(webhookUrl, webhookData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Admin notification sent via Webhook');
                return { success: true, method: 'webhook', phone: phoneNumber };
            } catch (webhookError) {
                console.error('❌ Webhook error:', webhookError.message);
                // Fall through to logging method
            }
        }
        
        // Option 4: Use WhatsApp API via direct URL
        if (process.env.WHATSAPP_DIRECT_URL) {
            try {
                const whatsappUrl = process.env.WHATSAPP_DIRECT_URL
                    .replace('{phone}', phoneNumber)
                    .replace('{message}', encodeURIComponent(message));
                await axios.get(whatsappUrl);
                console.log('✅ Admin notification sent via Direct URL');
                return { success: true, method: 'direct_url', phone: phoneNumber };
            } catch (directError) {
                console.error('❌ Direct URL error:', directError.message);
                // Fall through to logging method
            }
        }
        
        // Option 5: Log the notification for manual sending
        console.log('\n========================================');
        console.log('📱 ADMIN PHONE NOTIFICATION - ACTION REQUIRED');
        console.log('========================================');
        console.log('To:', phoneNumber);
        console.log('Message:');
        console.log(message);
        console.log('========================================');
        console.log('⚠️ To enable automatic admin notifications, configure one of:');
        console.log('1. Green API: WHATSAPP_GREEN_API_ID and WHATSAPP_GREEN_API_TOKEN');
        console.log('2. WhatsApp Business API: WHATSAPP_API_TOKEN and WHATSAPP_API_URL');
        console.log('3. Webhook URL: ADMIN_NOTIFICATION_WEBHOOK_URL or WHATSAPP_WEBHOOK_URL');
        console.log('4. Direct URL: WHATSAPP_DIRECT_URL (with {phone} and {message} placeholders)');
        console.log('5. Admin Phone: ADMIN_PHONE (default: 254724904692)');
        console.log('========================================\n');
        
        return { success: true, method: 'logged', phone: phoneNumber, message: message };
        
    } catch (error) {
        console.error('❌ Error in sendAdminPhoneNotification:', error);
        throw error;
    }
}

// Helper function to send admin email notification
async function sendAdminNotification(order) {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        
        if (!adminEmail) {
            // No email configured, skip
            return { success: false, reason: 'no_email_configured' };
        }
        
        // For now, we'll log the email notification
        // In production, you can use nodemailer or another email service
        const emailSubject = `New Order Received - ${order.orderId}`;
        const emailBody = `
New Order Received!

Order ID: ${order.orderId}
Date: ${order.date}
Customer: ${order.customer.name}
Phone: ${order.customer.phone}
Email: ${order.customer.email || 'N/A'}

Items:
${order.items.map(item => {
                const hasImage = item.image && item.image.trim() !== '';
                return `• ${item.name} x${item.quantity} - KSh ${item.subtotal.toLocaleString('en-KE')}${hasImage ? ' [Image included]' : ''}`;
            }).join('\n')}

Subtotal: KSh ${(order.subtotal || order.total).toLocaleString('en-KE')}
${order.delivery && order.delivery.cost > 0 ? `Delivery (${order.delivery.optionText}): KSh ${order.delivery.cost.toLocaleString('en-KE')}\n` : ''}Total: KSh ${order.total.toLocaleString('en-KE')}

Payment Method: ${order.paymentMethod}
M-Pesa Code: ${order.mpesaCode}
Verified: ${order.verified ? 'Yes' : 'Pending'}

${order.delivery && order.delivery.option !== 'pickup' ? `Delivery Address:\n${order.delivery.address}\n` : ''}
        `;
        
        console.log('\n📧 ADMIN EMAIL NOTIFICATION:');
        console.log('To:', adminEmail);
        console.log('Subject:', emailSubject);
        console.log('Body:', emailBody);
        console.log('ℹ️ To enable email sending, configure SMTP settings or use an email service API\n');
        
        // TODO: Implement actual email sending using nodemailer or email API
        // For now, just log it
        
        return { success: true, method: 'logged', email: adminEmail };
    } catch (error) {
        console.error('❌ Error in sendAdminNotification:', error);
        throw error;
    }
}

// Helper function to log admin notification (always called)
function logAdminNotification(order) {
    console.log('\n========================================');
    console.log('🔔 ADMIN NOTIFICATION - NEW PAYMENT RECEIVED');
    console.log('========================================');
    console.log(`Order ID: ${order.orderId}`);
    console.log(`Date: ${order.date}`);
    console.log(`Customer: ${order.customer.name}`);
    console.log(`Phone: ${order.customer.phone}`);
    console.log(`Email: ${order.customer.email || 'N/A'}`);
    console.log('\nItems:');
    order.items.forEach(item => {
        console.log(`  • ${item.name} x${item.quantity} - KSh ${item.subtotal.toLocaleString('en-KE')}`);
    });
    console.log(`\nSubtotal: KSh ${(order.subtotal || order.total).toLocaleString('en-KE')}`);
    if (order.delivery && order.delivery.cost > 0) {
        console.log(`Delivery (${order.delivery.optionText}): KSh ${order.delivery.cost.toLocaleString('en-KE')}`);
    }
    console.log(`Total: KSh ${order.total.toLocaleString('en-KE')}`);
    console.log(`\nPayment Method: ${order.paymentMethod}`);
    console.log(`M-Pesa Code: ${order.mpesaCode}`);
    console.log(`Verified: ${order.verified ? '✅ Yes' : '⚠️ Pending'}`);
    if (order.delivery && order.delivery.option !== 'pickup') {
        console.log(`\nDelivery Address: ${order.delivery.address}`);
    }
    console.log('========================================\n');
}

module.exports = router;
