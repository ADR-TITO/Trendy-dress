# Trendy Dresses E-Commerce Website

A modern e-commerce website for Trendy Dresses featuring product catalog, shopping cart, M-Pesa payment integration, and admin panel.

## 🌟 Features

- **Product Management**: Browse products by category (Dresses, Tracksuits, Khaki Pants & Jeans, Others)
- **Shopping Cart**: Add to cart, update quantities, and checkout
- **Payment Integration**: 
  - M-Pesa Till Number
  - M-Pesa STK Push (Prompt Payment)
- **Admin Panel**: 
  - Product management (CRUD operations)
  - Order management
  - Delivery status tracking
  - Completed orders view
- **Receipt Generation**: PDF receipts with product images
- **WhatsApp Integration**: Send receipts to customers via WhatsApp
- **MongoDB Integration**: Cloud-based database using MongoDB Atlas
- **Offline Support**: IndexedDB cache for offline access

## 🚀 Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- jsPDF for PDF generation
- Font Awesome icons
- Responsive design

### Backend
- **PHP** (Primary) - RESTful API with MongoDB
- **Node.js** (Alternative) - Express.js with MongoDB (optional)

### Database
- MongoDB Atlas (Cloud)
- IndexedDB (Browser cache)
- localStorage (UI data only)

## 📁 Project Structure

```
trendy-dresses/
├── index.html              # Main HTML file
├── style.css               # Styles
├── script.js               # Main JavaScript
├── api-service.js          # API service layer
├── storage-manager.js      # IndexedDB manager
├── backend-php/            # PHP Backend (Primary)
│   ├── index.php          # Router
│   ├── config/            # Configuration
│   ├── src/               # Models & Services
│   └── routes/            # API routes
├── backend/                # Node.js Backend (Alternative)
│   ├── server.js          # Express server
│   ├── models/            # Mongoose models
│   └── routes/            # API routes
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Web server (Apache/Nginx) with PHP 7.4+ OR Node.js 14+
- MongoDB Atlas account
- M-Pesa API credentials (for payment processing)

### Quick Start

#### Option 1: PHP Backend (Recommended)

1. **Install PHP Backend**
   ```bash
   cd backend-php
   composer install
   ```

2. **Install MongoDB PHP Extension**
   - Windows: Download from [pecl.php.net](https://pecl.php.net/package/mongodb)
   - Linux: `sudo apt-get install php-mongodb`
   - Mac: `brew install php-mongodb`

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Deploy**
   - Upload `backend-php/` to your web server
   - Configure web server to route `/api` to PHP
   - Test: `curl https://trendydresses.co.ke/api/health`

#### Option 2: Node.js Backend

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp ENV_TEMPLATE.txt .env
   # Edit .env with your MongoDB connection string
   ```

3. **Start Server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Open `index.html`** in a web browser
2. The frontend will automatically detect the backend (PHP or Node.js)
3. For local development, ensure backend is running

## 🔧 Configuration

### MongoDB Connection

Add your MongoDB Atlas connection string to:
- `backend-php/.env` (for PHP backend)
- `backend/.env` (for Node.js backend)

Format:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority
```

### M-Pesa Configuration

Add M-Pesa credentials to `.env`:
```
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox  # or production
```

## 📡 API Endpoints

All endpoints are available at `/api/*`:

- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `POST /api/orders/verify` - Verify M-Pesa code
- `POST /api/mpesa/stk-push` - Initiate STK Push
- `POST /api/admin/login` - Admin login

## 🌐 Deployment

### Production Deployment

1. **Upload Files**
   - Upload frontend files to web root
   - Upload `backend-php/` to server

2. **Configure Web Server**
   - Apache: Ensure `.htaccess` is enabled
   - Nginx: Configure PHP-FPM routing

3. **Set Environment Variables**
   - Create `.env` file in `backend-php/`
   - Add MongoDB connection string
   - Add M-Pesa credentials

4. **Test**
   ```bash
   curl https://trendydresses.co.ke/api/health
   ```

## 📝 Documentation

- [PHP Backend Setup](backend-php/README.md)
- [Node.js Backend Setup](backend/README.md)
- [MongoDB Setup](MONGODB_ATLAS_SETUP.md)
- [M-Pesa Integration](backend/MPESA_SETUP.md)

## 🔒 Security

- Environment variables are excluded from Git (`.gitignore`)
- MongoDB connection strings are stored in `.env` files
- M-Pesa credentials are stored securely
- CORS is configured for production domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For issues or questions, please contact:
- Email: Trendy dresses790@gmail.com
- Phone: 254724904692

---

**Built with ❤️ for Trendy Dresses**
