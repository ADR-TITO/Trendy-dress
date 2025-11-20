# 🚨 FIX 500 ERROR NOW

## The Problem

- ✅ Health works: `/api/health` → 200
- ❌ Products fails: `/api/products` → 500
- ❌ Orders fails: `/api/orders` → 500

## Most Likely Cause: Tables Don't Exist

The database tables haven't been created yet.

## IMMEDIATE FIX

### Option 1: Use Create Tables Script (Easiest)

**Visit this URL:**
```
https://trendydresses.co.ke/backend-php/create-tables.php
```

This will create all tables automatically.

### Option 2: Use phpMyAdmin

1. **Login to phpMyAdmin** in cPanel
2. **Select database:** `trendydr_Shpo`
3. **Click SQL tab**
4. **Paste and run:**

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

## After Creating Tables

**Test:**
```
https://trendydresses.co.ke/backend-php/api/products
https://trendydresses.co.ke/backend-php/api/orders
```

Should return: `[]` (empty array)

## Verify Tables Created

**Visit:**
```
https://trendydresses.co.ke/backend-php/test-database.php
```

Check `tables_exist` - all should be `true`.

---

**Create the tables and the 500 error will be fixed!** ✅

