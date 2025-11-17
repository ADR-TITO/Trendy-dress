# 🔍 Diagnose 500 Error - Step by Step

## Current Status

- ✅ Health endpoint works: `/api/health` → 200 OK
- ❌ Products endpoint fails: `/api/products` → 500
- ❌ Orders endpoint fails: `/api/orders` → 500

## Diagnosis Steps

### Step 1: Test Database Connection

Visit: `https://trendydresses.co.ke/backend-php/test-database.php`

**Check output:**
- `database_connection`: Should be `true`
- `tables_exist`: Check which tables exist
- `errors`: Any error messages

### Step 2: Check if Tables Exist

**If tables don't exist:**
- Visit: `https://trendydresses.co.ke/backend-php/create-tables.php`
- This will create all tables

**Or use phpMyAdmin:**
- Login to phpMyAdmin
- Select database `trendydr_Shpo`
- Check if tables `products`, `orders`, `mpesa_transactions` exist

### Step 3: Check Error Logs

**In cPanel:**
1. Go to "Error Log"
2. Look for recent PHP errors
3. Check for:
   - "Table doesn't exist"
   - "Access denied"
   - "SQL syntax error"

### Step 4: Test Database Queries

**In phpMyAdmin:**
```sql
-- Test products table
SELECT * FROM products LIMIT 1;

-- Test orders table  
SELECT * FROM orders LIMIT 1;
```

**If these fail:**
- Tables don't exist → Create them
- Permission error → Check user permissions
- SQL error → Check table structure

## Common Fixes

### Fix 1: Create Tables

**Easiest:** Visit `create-tables.php` URL

**Or manually in phpMyAdmin:** Run SQL from `URGENT_FIX_PRODUCTS_ORDERS.md`

### Fix 2: Check User Permissions

**In cPanel:**
1. Go to "MySQL Users"
2. Find user `trendydr_Adrian`
3. Verify it has access to database `trendydr_Shpo`
4. Check permissions: SELECT, INSERT, UPDATE, DELETE, CREATE

### Fix 3: Verify .env File

**Check `.env` file contains:**
```
DB_HOST=localhost
DB_NAME=trendydr_Shpo
DB_USER=trendydr_Adrian
DB_PASS=i"d)Z8NGP}8"?aa
```

### Fix 4: Test Connection

**In phpMyAdmin:**
- Try to connect with credentials
- If connection fails, credentials are wrong
- If connection works, issue is in PHP code

## Expected Behavior After Fix

**Products endpoint:**
```
GET https://trendydresses.co.ke/backend-php/api/products
Response: [] (empty array if no products)
```

**Orders endpoint:**
```
GET https://trendydresses.co.ke/backend-php/api/orders
Response: [] (empty array if no orders)
```

## Quick Test

After fixing, test:
```bash
curl https://trendydresses.co.ke/backend-php/api/products
curl https://trendydresses.co.ke/backend-php/api/orders
```

Both should return JSON arrays (empty `[]` if no data).

---

**Run test-database.php first to see what's wrong!** ✅

