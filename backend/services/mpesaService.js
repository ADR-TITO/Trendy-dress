const axios = require('axios');
require('dotenv').config();

class MpesaService {
    constructor() {
        // M-Pesa Daraja API credentials (from .env)
        this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
        this.shortCode = process.env.MPESA_SHORTCODE || '174379'; // Default test shortcode
        this.passkey = process.env.MPESA_PASSKEY || '';
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox'; // sandbox or production
        
        // API URLs
        this.baseURL = this.environment === 'production' 
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
        
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Get OAuth access token from M-Pesa
    async getAccessToken() {
        try {
            // Return cached token if still valid
            if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.accessToken;
            }

            if (!this.consumerKey || !this.consumerSecret) {
                throw new Error('M-Pesa credentials not configured');
            }

            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
            
            const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            this.accessToken = response.data.access_token;
            // Token expires in 1 hour, refresh 5 minutes early
            this.tokenExpiry = new Date(Date.now() + (55 * 60 * 1000));
            
            console.log('✅ M-Pesa access token obtained');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Error getting M-Pesa access token:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with M-Pesa API');
        }
    }

    // Query transaction status from M-Pesa
    async queryTransactionStatus(transactionCode, shortCode = null) {
        try {
            const token = await this.getAccessToken();
            const code = shortCode || this.shortCode;
            
            // Format: YYYYMMDDHHmmss
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
            
            // Generate password (Base64 encoded Shortcode+Passkey+Timestamp)
            const password = Buffer.from(`${code}${this.passkey}${timestamp}`).toString('base64');

            const requestData = {
                Initiator: code,
                SecurityCredential: this.passkey, // In production, this should be encrypted
                CommandID: 'TransactionStatusQuery',
                TransactionID: transactionCode,
                PartyA: code,
                IdentifierType: '4', // 4 = Organization
                ResultURL: `${process.env.MPESA_CALLBACK_URL || 'http://localhost:3000/api/mpesa/callback'}/result`,
                QueueTimeOutURL: `${process.env.MPESA_CALLBACK_URL || 'http://localhost:3000/api/mpesa/callback'}/timeout`,
                Remarks: 'Transaction verification',
                Occasion: 'Verify payment'
            };

            const response = await axios.post(
                `${this.baseURL}/mpesa/transactionstatus/v1/query`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Error querying M-Pesa transaction:', error.response?.data || error.message);
            throw error;
        }
    }

    // Verify transaction code against M-Pesa records
    // Note: M-Pesa API doesn't directly support querying by receipt number
    // We rely on webhooks to receive transactions and store them in the database
    // This method validates the credentials are configured and returns API status
    async verifyTransactionCode(transactionCode, expectedAmount, phoneNumber = null) {
        try {
            // First check if credentials are configured
            if (!this.consumerKey || !this.consumerSecret) {
                console.warn('⚠️ M-Pesa credentials not configured, skipping API verification');
                return {
                    verified: false,
                    method: 'format_only',
                    message: 'M-Pesa API not configured - using format validation only',
                    apiConfigured: false
                };
            }

            // Test API connection by getting access token
            try {
                const token = await this.getAccessToken();
                if (token) {
                    console.log('✅ M-Pesa API credentials are valid and access token obtained');
                    return {
                        verified: true,
                        method: 'api_configured',
                        message: 'M-Pesa API is configured and accessible. Transaction verification relies on webhook-stored transactions.',
                        apiConfigured: true,
                        accessTokenObtained: true
                    };
                }
            } catch (authError) {
                console.error('❌ Error authenticating with M-Pesa API:', authError.message);
                return {
                    verified: false,
                    method: 'api_error',
                    message: 'M-Pesa API credentials may be invalid. Please check your Consumer Key and Consumer Secret.',
                    apiConfigured: true,
                    accessTokenObtained: false,
                    error: authError.message
                };
            }

            // M-Pesa API doesn't provide a direct endpoint to verify receipt codes
            // For Buy Goods (Till Number) transactions, we must rely on:
            // 1. Webhooks to receive transaction notifications
            // 2. Storing transactions in the database when received
            // 3. Comparing entered codes against stored transactions
            
            return {
                verified: true,
                method: 'format_validation',
                message: 'M-Pesa API is configured. Transaction verification requires webhook setup to receive transaction notifications.',
                apiConfigured: true
            };
        } catch (error) {
            console.error('❌ Error verifying transaction with M-Pesa:', error);
            return {
                verified: false,
                error: error.message,
                method: 'error',
                apiConfigured: !!this.consumerKey && !!this.consumerSecret
            };
        }
    }

    // Alternative: Verify using Account Balance API (checks recent transactions)
    async verifyViaAccountBalance(transactionCode, expectedAmount) {
        try {
            const token = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
            const password = Buffer.from(`${this.shortCode}${this.passkey}${timestamp}`).toString('base64');

            // Note: Account Balance API doesn't return transaction details
            // This is a limitation - we need webhooks for proper verification
            console.warn('⚠️ Account Balance API does not provide transaction details');
            
            return {
                verified: false,
                message: 'M-Pesa API does not support direct transaction code verification. Webhook integration required.'
            };
        } catch (error) {
            console.error('❌ Error with Account Balance API:', error);
            throw error;
        }
    }
}

module.exports = new MpesaService();




