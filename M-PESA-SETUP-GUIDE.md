# M-Pesa Payment Setup Guide

## Overview

Your Trendy Dresses website now supports **manual M-Pesa payment verification** using your Till Number **177104**.

## How It Works

### For Customers:

1. **Add items to cart** and proceed to checkout
2. **Select M-Pesa** as payment method
3. **Send money** to Till Number `177104` (Buy Goods - Lucyline Smart Fashion)
4. **Enter the M-Pesa code** from the confirmation SMS (e.g., `SH12ABC123`)
5. System verifies the code and completes the order

### For Admin:

1. Customer orders appear in the **Admin Panel → Orders** tab
2. Each order shows the M-Pesa code used
3. You can verify payments in your M-Pesa statement
4. Mark orders as delivered when shipped

---

## Files Updated

The following files have been modified and need to be uploaded to your server:

### 1. **backend-php/routes/mpesa.php**
- Added `/mpesa/verify-code` endpoint
- Validates M-Pesa code format (10 characters, alphanumeric)
- Checks for duplicate codes in database
- Returns clear error messages

### 2. **api-service.js**
- Updated `verifyMpesaCode()` method
- Now calls the new `/mpesa/verify-code` endpoint
- Better error handling
- Clearer error messages for users

### 3. **backend-php/routes/auth.php**
- Fixed duplicate PHP tag syntax error
- Login now works correctly

### 4. **backend-php/index.php**
- Added missing `auth` route
- Login endpoint now accessible

---

## Upload Instructions

### Via cPanel:

1. **Login to cPanel → File Manager**

2. **Upload backend-php/routes/mpesa.php:**
   - Navigate to: `backend-php/routes/`
   - Upload the updated `mpesa.php` file
   - Overwrite existing file

3. **Upload api-service.js:**
   - Navigate to your website root
   - Upload the updated `api-service.js` file
   - Overwrite existing file

4. **Upload backend-php/routes/auth.php** (if not already done):
   - Navigate to: `backend-php/routes/`
   - Upload the updated `auth.php` file

5. **Upload backend-php/index.php** (if not already done):
   - Navigate to: `backend-php/`
   - Upload the updated `index.php` file

### Via Git:

```bash
git add backend-php/routes/mpesa.php api-service.js backend-php/routes/auth.php backend-php/index.php
git commit -m "Add M-Pesa manual verification system"
git push origin main
```

Then pull on your server or let auto-deployment update.

---

## Testing the System

### Test 1: Valid M-Pesa Code

1. Go to your website
2. Add a product to cart
3. Click "Checkout"
4. Select "M-Pesa" payment
5. Enter a test code: `SH12ABC123`
6. Should show: ✅ "M-Pesa code verified successfully"

### Test 2: Invalid Format

1. Try entering a short code: `ABC123`
2. Should show: ❌ "Invalid M-Pesa code format. Code must be exactly 10 characters."

### Test 3: Duplicate Code

1. Complete an order with code: `SH12ABC123`
2. Try using the same code again
3. Should show: ❌ "This M-Pesa code has already been used. Please use a different transaction code."

### Test 4: Invalid Characters

1. Try entering: `SH12@BC123`
2. Should show: ❌ "Invalid M-Pesa code. Only letters and numbers are allowed."

---

## Error Messages

The system now shows clear, specific error messages instead of "service unavailable":

| Error | Message |
|-------|---------|
| **Too short/long** | "Invalid M-Pesa code format. Code must be exactly 10 characters." |
| **Special characters** | "Invalid M-Pesa code. Only letters and numbers are allowed." |
| **Already used** | "This M-Pesa code has already been used. Please use a different transaction code." |
| **Service error** | "Payment verification service is temporarily unavailable. Please try again." |

---

## Customer Instructions

You can share these instructions with your customers:

### How to Pay via M-Pesa:

1. **Go to M-Pesa on your phone**
2. **Select "Lipa na M-Pesa"**
3. **Select "Buy Goods and Services"**
4. **Enter Till Number:** `177104`
5. **Enter the amount** shown in your cart
6. **Enter your M-Pesa PIN**
7. **You'll receive an SMS** with a code like `SH12ABC123`
8. **Enter this code** in the checkout form on the website
9. **Complete your order**

---

## Security Features

✅ **Duplicate Prevention:** Each M-Pesa code can only be used once  
✅ **Format Validation:** Only valid 10-character codes accepted  
✅ **Database Verification:** All codes checked against order history  
✅ **Clear Error Messages:** Users know exactly what went wrong

---

## Next Steps

1. ✅ Upload the updated files to your server
2. ✅ Test the payment flow
3. ✅ Share payment instructions with customers
4. ✅ Monitor orders in admin panel

---

## Support

If you encounter any issues:
- Check that all files are uploaded correctly
- Verify database connection is working
- Test with different M-Pesa code formats
- Check browser console for error messages (F12 → Console)
