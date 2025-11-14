# M-Pesa Transaction Verification Setup

This system verifies M-Pesa transaction codes by comparing them against real M-Pesa transactions received via webhooks.

## How It Works

1. **Webhook Reception**: When customers make M-Pesa payments, M-Pesa sends transaction notifications to our webhook endpoint (`/api/mpesa/webhook`)
2. **Transaction Storage**: These transactions are stored in the `MpesaTransaction` collection with receipt numbers, amounts, dates, and phone numbers
3. **Verification**: When a customer enters an M-Pesa code during checkout, the system:
   - Checks if the code exists in our database (from webhooks)
   - Verifies the amount matches the order total
   - Verifies the transaction date is within valid range
   - Checks if the transaction has already been used in another order

## Setup Instructions

### 1. M-Pesa Daraja API Credentials

To receive M-Pesa webhooks, you need to:

1. Register for M-Pesa Daraja API at: https://developer.safaricom.co.ke/
2. Get your credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode (PayBill or Till Number)
   - Passkey
   - Environment (sandbox or production)

### 2. Configure Environment Variables

Add these to your `backend/.env` file:

```env
# M-Pesa Daraja API Credentials
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CALLBACK_URL=http://your-domain.com/api/mpesa/callback
```

### 3. Configure M-Pesa Webhook URL

In your M-Pesa Daraja API dashboard:

1. Set the **Confirmation URL** to: `https://your-domain.com/api/mpesa/webhook`
2. Set the **Validation URL** to: `https://your-domain.com/api/mpesa/webhook`

**Note**: For local development, use a service like ngrok to expose your local server:
```bash
ngrok http 3000
```
Then use the ngrok URL in your M-Pesa dashboard.

### 4. Manual Transaction Sync (Optional)

If you need to manually add a transaction (for testing or if webhook was missed):

```bash
POST /api/mpesa/sync-transaction
Content-Type: application/json

{
  "receiptNumber": "ABC123XYZ9",
  "amount": 5000,
  "phoneNumber": "254712345678",
  "transactionDate": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### Verify M-Pesa Code
```
POST /api/orders/verify
Content-Type: application/json

{
  "mpesaCode": "ABC123XYZ9",
  "amount": 5000,
  "transactionDate": "2024-01-15T10:30:00Z"
}
```

### M-Pesa Webhook (Called by M-Pesa)
```
POST /api/mpesa/webhook
```

### Get M-Pesa Transactions (Admin)
```
GET /api/mpesa/transactions?phoneNumber=254712345678&startDate=2024-01-01&endDate=2024-01-31&limit=100
```

## Verification Flow

1. Customer enters M-Pesa code during checkout
2. Frontend calls `/api/orders/verify`
3. Backend checks:
   - Code format (10 alphanumeric characters)
   - Duplicate usage in existing orders
   - Existence in M-Pesa transaction database
   - Amount match (if transaction found)
   - Date validity (if transaction found)
4. If verified, order is created and transaction is linked to the order
5. If not found, order is still created but marked as "pending verification"

## Important Notes

- **Webhook Required**: For full verification, M-Pesa webhooks must be configured. Without webhooks, the system can only verify format and check for duplicates.
- **Transaction Timing**: Transactions may take a few seconds to appear in the database after payment. The system allows orders even if transaction is not yet received.
- **Security**: The system prevents duplicate use of M-Pesa codes and verifies amounts to prevent fraud.

## Troubleshooting

### Transactions Not Appearing
- Check webhook URL is correctly configured in M-Pesa dashboard
- Verify server is accessible from internet (use ngrok for local dev)
- Check server logs for webhook errors

### Verification Failing
- Ensure transaction was received via webhook
- Check amount matches exactly (allows 1 KSh difference for rounding)
- Verify transaction date is within 24 hours of stored transaction

### Testing
- Use M-Pesa sandbox environment for testing
- Test webhook with M-Pesa test credentials
- Use manual sync endpoint to add test transactions






