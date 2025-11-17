# 🚨 URGENT: Fix 500 Error on Products/Orders

## The Problem

- ✅ `/api/health` works (200 OK)
- ❌ `/api/products` returns 500
- ❌ `/api/orders` returns 500

## Most Likely Cause: Tables Don't Exist

The database tables (`products`, `orders`, `mpesa_transactions`) may not have been created.

## Quick Fix

### Step 1: Create Tables Manually

Visit: `https://trendydresses.co.ke/backend-php/create-tables.php`

This will create all required tables.

### Step 2: Or Use phpMyAdmin

1. **Login to phpMyAdmin** in cPanel
2. **Select database:** `trendydr_Shpo`
3. **Go to SQL tab**
4. **Run this SQL:**

```sql
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    size VARCHAR(50),
    quantity INT DEFAULT 0,
    image TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    orderId VARCHAR(100) UNIQUE NOT NULL,
    customerName VARCHAR(255) NOT NULL,
    customerPhone VARCHAR(50) NOT NULL,
    customerEmail VARCHAR(255),
    items TEXT NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentMethod VARCHAR(50),
    mpesaCode VARCHAR(100),
    deliveryStatus VARCHAR(50) DEFAULT 'pending',
    deliveredBy VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orderId (orderId),
    INDEX idx_deliveryStatus (deliveryStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receiptNumber VARCHAR(100) UNIQUE NOT NULL,
    transactionDate DATETIME NOT NULL,
    phoneNumber VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    merchantRequestID VARCHAR(255),
    checkoutRequestID VARCHAR(255),
    resultCode INT,
    resultDesc VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receiptNumber (receiptNumber),
    INDEX idx_transactionDate (transactionDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Step 3: Test

After creating tables:

```
https://trendydresses.co.ke/backend-php/api/products
https://trendydresses.co.ke/backend-php/api/orders
```

Should return: `[]` (empty array if no data)

## Alternative: Check What's Wrong

Visit: `https://trendydresses.co.ke/backend-php/test-database.php`

This will show:
- ✅ Which tables exist
- ✅ Database connection status
- ✅ Any errors

## If Still 500 After Creating Tables

1. **Check error logs:**
   - cPanel → Error Log
   - Look for specific error messages

2. **Check user permissions:**
   - User needs CREATE, SELECT, INSERT, UPDATE, DELETE
   - Check in cPanel MySQL Users

3. **Test in phpMyAdmin:**
   - Try: `SELECT * FROM products LIMIT 1`
   - If this works, the issue is in PHP code
   - If this fails, it's a permissions issue

---

**Create the tables and the 500 error should be fixed!** ✅

