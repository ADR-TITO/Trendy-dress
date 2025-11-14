# Trendy Dresses Backend API

Backend database and API server for the Trendy Dresses e-commerce website.

## Features

- **SQLite Database**: Lightweight, file-based database (no separate server needed)
- **RESTful API**: Clean API endpoints for products, orders, admin, and settings
- **Product Management**: CRUD operations for products with inventory tracking
- **Order Management**: Create and track orders with order items
- **Admin Authentication**: Secure admin login and credential management
- **Website Settings**: Dynamic website content management

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Initialize Database

```bash
npm run init-db
```

This will:
- Create the database file (`database/database.db`)
- Set up all tables (products, orders, order_items, admin_users, website_settings)
- Create a default admin user:
  - **Username**: `admin`
  - **Password**: `admin123`
  - ⚠️ **Important**: Change this password after first login!

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Products

- `GET /api/products` - Get all products (optional query: `?category=shirts`)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `PATCH /api/products/:id/quantity` - Update product quantity

### Orders

- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:orderId` - Get single order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:orderId/status` - Update order status (Admin)

### Admin

- `POST /api/admin/login` - Admin login
- `PUT /api/admin/credentials` - Change admin credentials
- `GET /api/admin/info` - Get admin info

### Settings

- `GET /api/settings` - Get all website settings
- `GET /api/settings/:key` - Get single setting
- `PUT /api/settings/:key` - Update single setting
- `PUT /api/settings` - Update multiple settings (send object)

### Health Check

- `GET /api/health` - Check API status

## Database Schema

### Products Table
- `id` (INTEGER, PRIMARY KEY)
- `name` (TEXT)
- `category` (TEXT)
- `price` (REAL)
- `discount` (REAL, default: 0)
- `quantity` (INTEGER, default: 0)
- `size` (TEXT)
- `image` (TEXT, base64 or URL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Orders Table
- `id` (INTEGER, PRIMARY KEY)
- `order_id` (TEXT, UNIQUE)
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `customer_email` (TEXT)
- `total_amount` (REAL)
- `payment_method` (TEXT)
- `mpesa_code` (TEXT)
- `status` (TEXT, default: 'pending')
- `created_at` (DATETIME)

### Order Items Table
- `id` (INTEGER, PRIMARY KEY)
- `order_id` (INTEGER, FOREIGN KEY)
- `product_id` (INTEGER, FOREIGN KEY)
- `product_name` (TEXT)
- `quantity` (INTEGER)
- `price` (REAL)
- `subtotal` (REAL)

### Admin Users Table
- `id` (INTEGER, PRIMARY KEY)
- `username` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Website Settings Table
- `id` (INTEGER, PRIMARY KEY)
- `setting_key` (TEXT, UNIQUE)
- `setting_value` (TEXT)
- `updated_at` (DATETIME)

## Example API Calls

### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic White Shirt",
    "category": "shirts",
    "price": 2500,
    "discount": 0,
    "quantity": 10,
    "size": "M",
    "image": "data:image/png;base64,..."
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-1234567890",
    "customerName": "John Doe",
    "customerPhone": "254712345678",
    "customerEmail": "john@example.com",
    "items": [
      {
        "productId": 1,
        "name": "Classic White Shirt",
        "quantity": 2,
        "price": 2500,
        "subtotal": 5000
      }
    ],
    "totalAmount": 5000,
    "paymentMethod": "M-Pesa Till (177104)",
    "mpesaCode": "ABC123XYZ"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## Notes

- The database file (`database/database.db`) is created automatically on first run
- All timestamps are stored in SQLite DATETIME format
- Product images can be stored as base64 data URLs or external URLs
- Order creation automatically reduces product quantities
- Admin passwords are hashed using bcrypt

## Security Considerations

⚠️ **Important**: This is a basic implementation. For production use, consider:

1. Add JWT authentication for admin routes
2. Add rate limiting
3. Add input validation and sanitization
4. Use environment variables for sensitive data
5. Add HTTPS/SSL
6. Implement proper error handling and logging
7. Add database backups

## Troubleshooting

**Database locked error**: Make sure only one instance of the server is running.

**Port already in use**: Change the PORT in `server.js` or set `PORT` environment variable.

**Module not found**: Run `npm install` to install dependencies.








