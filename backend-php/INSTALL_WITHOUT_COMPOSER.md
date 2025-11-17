# ⚡ Install Backend Without Composer

## Quick Setup (No Composer Required)

Since the backend now uses MariaDB (PDO), you **don't strictly need Composer** for basic functionality.

### What's Required

✅ **PHP 7.4+** - Already on your server
✅ **PDO MySQL extension** - Usually included with PHP
✅ **dotenv package** - Optional (can use environment variables directly)

### Option 1: Use Environment Variables Directly

Instead of using `.env` file with dotenv, you can set environment variables directly in `config/database.php`:

```php
// In config/database.php, replace:
$host = $_ENV['DB_HOST'] ?? 'localhost';

// With:
$host = 'localhost';  // Or getenv('DB_HOST') ?: 'localhost';
$dbname = 'trendydr_Shpo';
$username = 'trendydr_Adrian';
$password = 'i"d)Z8NGP}8"?aa';
```

### Option 2: Install dotenv Manually

1. **Download dotenv:**
   - Go to: https://github.com/vlucas/phpdotenv/releases
   - Download latest release
   - Extract `src/` folder to `backend-php/vendor/vlucas/phpdotenv/src/`

2. **Update autoload:**
   - Create simple autoloader or include directly

### Option 3: Skip dotenv Entirely

Modify `config/database.php` to read from `.env` file directly:

```php
// Simple .env parser
function loadEnv($file) {
    if (!file_exists($file)) return;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

loadEnv(__DIR__ . '/../.env');
```

## For Production Server

On your cPanel server, you can:

1. **Install Composer via cPanel Terminal:**
   ```bash
   curl -sS https://getcomposer.org/installer | php
   php composer.phar install
   ```

2. **Or upload vendor folder:**
   - Install dependencies on a machine with Composer
   - Upload `vendor/` folder to server

3. **Or use server's PHP extensions:**
   - Most cPanel servers have PDO MySQL enabled
   - Just need to configure database connection

---

**The backend will work without Composer!** ✅

Just ensure PHP and PDO MySQL are available.

