# 🔧 Fix 500 Error on Products/Orders Endpoints

## The Problem

- ✅ `/api/health` works (200 OK)
- ❌ `/api/products` returns 500
- ❌ `/api/orders` returns 500

This means the backend is running but database queries are failing.

## Quick Diagnosis

### Step 1: Test Database Connection

Visit: `https://trendydresses.co.ke/backend-php/test-database.php`

This will show:
- ✅ Database connection status
- ✅ Which tables exist
- ✅ Table row counts
- ✅ Any errors

### Step 2: Check Debug Script

Visit: `https://trendydresses.co.ke/backend-php/debug.php`

Look for:
- ✅ PDO MySQL extension installed
- ✅ Database connection successful
- ✅ `.env` file correct

## Common Causes

### Issue 1: Tables Don't Exist

**Symptoms:**
- Database connected but queries fail
- "Table doesn't exist" error

**Fix:**
1. **Tables should auto-create** on first connection
2. **If not, create manually:**
   ```sql
   -- Run in phpMyAdmin or cPanel MySQL
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
       updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

### Issue 2: Database Connection Fails During Query

**Symptoms:**
- Health check works
- But queries return 500

**Fix:**
1. **Check database credentials:**
   - Verify in `.env` file
   - Test in phpMyAdmin

2. **Check user permissions:**
   - User needs SELECT, INSERT, UPDATE, DELETE
   - Check in cPanel MySQL Users

### Issue 3: PHP Error in Models

**Symptoms:**
- 500 error with empty response
- Check error logs

**Fix:**
1. **Check error logs:**
   - cPanel → Error Log
   - Or `backend-php/logs/php-errors.log`

2. **Common errors:**
   - Missing columns in tables
   - SQL syntax errors
   - Type mismatches

## Step-by-Step Fix

### 1. Upload Test Scripts

Upload these files to your server:
- `backend-php/test-database.php`
- `backend-php/debug.php`

### 2. Run Diagnostics

Visit:
- `https://trendydresses.co.ke/backend-php/test-database.php`
- `https://trendydresses.co.ke/backend-php/debug.php`

### 3. Check Output

**If tables don't exist:**
- Tables should auto-create
- If not, create manually (see above)

**If connection fails:**
- Check `.env` credentials
- Verify database exists
- Check user permissions

**If queries fail:**
- Check error logs
- Verify table structure
- Test queries in phpMyAdmin

### 4. Fix Issues

Based on diagnostic output:
- Create missing tables
- Fix database credentials
- Fix user permissions
- Fix SQL errors

### 5. Test Again

```
https://trendydresses.co.ke/backend-php/api/products
https://trendydresses.co.ke/backend-php/api/orders
```

Should return JSON arrays (empty if no data).

## Quick Checklist

- [ ] Database connection works (test-database.php shows connected)
- [ ] Tables exist (products, orders, mpesa_transactions)
- [ ] User has proper permissions (SELECT, INSERT, UPDATE, DELETE)
- [ ] `.env` file has correct credentials
- [ ] PDO MySQL extension enabled
- [ ] No PHP errors in logs

## Manual Table Creation

If tables don't auto-create, run in phpMyAdmin:

```sql
-- Products table
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

-- Orders table
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

-- M-Pesa transactions table
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

---

**Run test-database.php to diagnose the exact issue!** ✅

