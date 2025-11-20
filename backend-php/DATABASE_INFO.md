# 📊 Database Information

## Server Type: MariaDB/MySQL

Your backend uses **MariaDB** (MySQL-compatible database).

## Connection Details

- **Type:** MariaDB/MySQL
- **Host:** localhost
- **Database:** trendydr_Shpo
- **Username:** trendydr_Adrian
- **Driver:** PDO MySQL (built into PHP)

## Configuration

### Environment Variables (`.env` file)

```
DB_HOST=localhost
DB_NAME=trendydr_Shpo
DB_USER=trendydr_Adrian
DB_PASS=i"d)Z8NGP}8"?aa
```

### Connection Code

Located in: `config/database.php`

Uses PDO (PHP Data Objects) with MySQL driver:
```php
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
$pdo = new PDO($dsn, $username, $password);
```

## Tables Structure

### products
- Stores all product information
- Auto-created on first connection

### orders
- Stores all customer orders
- Auto-created on first connection

### mpesa_transactions
- Stores M-Pesa payment transactions
- Auto-created on first connection

## No MongoDB

❌ **MongoDB is NOT used**
✅ **MariaDB/MySQL is used**

All MongoDB code has been removed and replaced with SQL queries.

---

**Database Type: MariaDB** ✅

