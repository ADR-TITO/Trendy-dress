# ✅ Solution: Fix 500 Error on Products/Orders

## Problem Summary

- ✅ `/api/health` → 200 OK (backend is running)
- ❌ `/api/products` → 500 Error (database query failing)
- ❌ `/api/orders` → 500 Error (database query failing)

## Root Cause

**Most likely:** Database tables don't exist yet.

The tables should auto-create on first connection, but if there's a permission issue or the connection fails during table creation, they won't be created.

## Solution: Create Tables

### Method 1: Use Create Tables Script (Easiest)

**Visit this URL:**
```
https://trendydresses.co.ke/backend-php/create-tables.php
```

This will create all three tables automatically.

### Method 2: Use phpMyAdmin

1. **Login to cPanel**
2. **Open phpMyAdmin**
3. **Select database:** `trendydr_Shpo`
4. **Click "SQL" tab**
5. **Paste and execute:**

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
    INDEX idx_deliveryStatus (deliveryStatus),
    INDEX idx_createdAt (createdAt)
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
    INDEX idx_transactionDate (transactionDate),
    INDEX idx_checkoutRequestID (checkoutRequestID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Verify Tables Created

**Visit:**
```
https://trendydresses.co.ke/backend-php/test-database.php
```

**Check output:**
- `tables_exist.products` → should be `true`
- `tables_exist.orders` → should be `true`
- `tables_exist.mpesa_transactions` → should be `true`

## Test Endpoints

After creating tables:

```
https://trendydresses.co.ke/backend-php/api/products
https://trendydresses.co.ke/backend-php/api/orders
```

**Should return:** `[]` (empty JSON array if no data)

## If Still Getting 500

1. **Check error logs:**
   - cPanel → Error Log
   - Look for specific error messages

2. **Check user permissions:**
   - User needs: SELECT, INSERT, UPDATE, DELETE, CREATE
   - Check in cPanel → MySQL Users

3. **Test in phpMyAdmin:**
   ```sql
   SELECT * FROM products LIMIT 1;
   ```
   - If this works, tables exist
   - If this fails, check permissions

---

**Create the tables and the 500 error will be fixed!** ✅

