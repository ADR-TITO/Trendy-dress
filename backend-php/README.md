# Trendy Dresses Backend API - PHP

PHP backend API for the Trendy Dresses e-commerce website.

## Features

- **MongoDB Integration**: Uses MongoDB PHP driver for database operations
- **RESTful API**: Clean API endpoints matching the Node.js version
- **M-Pesa Integration**: STK Push payment processing
- **CORS Support**: Configured for cross-origin requests
- **Error Handling**: Comprehensive error handling and logging

## Requirements

- PHP 7.4 or higher
- MongoDB PHP Extension
- Composer
- Web server (Apache/Nginx) with mod_rewrite enabled

## Installation

### 1. Install Dependencies

```bash
cd backend-php
composer install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
nano .env
```

### 3. Install MongoDB PHP Extension

**Windows:**
- Download from: https://pecl.php.net/package/mongodb
- Or use: `pecl install mongodb`

**Linux:**
```bash
sudo apt-get install php-mongodb
# or
sudo yum install php-mongodb
```

**Mac:**
```bash
brew install php-mongodb
```

### 4. Configure Web Server

**Apache (.htaccess already configured):**
- Ensure `mod_rewrite` is enabled
- Ensure `.htaccess` files are allowed

**Nginx:**
```nginx
location /api {
    try_files $uri $uri/ /index.php?route=$uri&$args;
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root/index.php;
    fastcgi_param REQUEST_URI $uri;
}
```

## API Endpoints

All endpoints match the Node.js version:

- `GET /api/health` - Health check
- `GET /api/db-status` - Database status
- `GET /api/server-info` - Server information
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `POST /api/orders/verify` - Verify M-Pesa code
- `PATCH /api/orders/:orderId/delivery-status` - Update delivery status
- `POST /api/admin/login` - Admin login
- `POST /api/mpesa/stk-push` - Initiate STK Push
- `POST /api/mpesa/webhook` - M-Pesa webhook

## Testing

```bash
# Health check
curl http://localhost/api/health

# Get products
curl http://localhost/api/products

# Database status
curl http://localhost/api/db-status
```

## Deployment

1. Upload `backend-php/` folder to your server
2. Run `composer install --no-dev`
3. Configure `.env` file
4. Ensure MongoDB PHP extension is installed
5. Configure web server to point to `backend-php/` directory
6. Test: `curl https://trendydresses.co.ke/api/health`

## Differences from Node.js Version

- Uses PHP instead of Node.js/Express
- Routes handled via `.htaccess` and `index.php`
- MongoDB operations use PHP MongoDB driver
- M-Pesa service uses cURL instead of axios
- Admin authentication simplified (can be enhanced with MongoDB)

## Notes

- The PHP backend maintains API compatibility with the Node.js version
- Frontend should work without changes (same endpoints)
- MongoDB connection string format is the same
- All environment variables are the same

