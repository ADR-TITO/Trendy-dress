# Trendy Dresses E-Commerce Website

A modern, full-featured e-commerce website for Trendy Dresses with MongoDB backend, M-Pesa payment integration, and admin panel.

## 🌟 Features

- **Product Management**: Full CRUD operations for products with images, categories, sizes, and inventory tracking
- **Shopping Cart**: Add to cart, quantity management, and order processing
- **Payment Integration**: 
  - M-Pesa Till Number payment
  - M-Pesa STK Push (Prompt) payment
  - Transaction verification
- **Admin Panel**: 
  - Product management
  - Order management and tracking
  - Delivery status updates
  - Completed orders view
- **MongoDB Backend**: Cloud database with MongoDB Atlas integration
- **PDF Receipts**: Automatic PDF receipt generation and WhatsApp delivery
- **Responsive Design**: Mobile-friendly interface
- **SEO Optimized**: Sitemap and robots.txt included

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- M-Pesa Daraja API credentials (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/trendy-dresses.git
   cd trendy-dresses
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cd backend
   cp ENV_TEMPLATE.txt .env
   # Edit .env and add your MongoDB connection string and M-Pesa credentials
   ```

4. **Start the backend server**
   ```bash
   # Windows
   start-backend.bat
   
   # Or manually
   npm start
   ```

5. **Open the website**
   - Open `index.html` in your browser
   - Or serve via a web server

## 📁 Project Structure

```
trendy-dresses/
├── backend/              # Backend API server
│   ├── routes/          # API routes
│   ├── models/          # MongoDB models
│   ├── services/        # Business logic services
│   ├── database/        # Database configuration
│   └── server.js        # Express server
├── index.html            # Main frontend page
├── script.js            # Frontend JavaScript
├── styles.css           # Stylesheet
├── api-service.js       # API client
├── storage-manager.js   # Local storage manager
└── README.md            # This file
```

## 🔧 Configuration

### Backend Configuration

Create a `.env` file in the `backend/` folder:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trendy-dresses

# Server Port
PORT=3000

# M-Pesa Configuration (Optional)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=production
```

### Frontend Configuration

The frontend automatically detects the backend URL:
- **Development**: `http://localhost:3000/api`
- **Production**: `https://trendydresses.co.ke/api`

To change the production URL, edit `api-service.js`.

## 📚 Documentation

- **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** - MongoDB Atlas setup guide
- **[PRODUCTION_BACKEND_SETUP.md](./PRODUCTION_BACKEND_SETUP.md)** - Production deployment guide
- **[QUICK_SETUP.md](./QUICK_SETUP.md)** - Quick setup instructions
- **[backend/QUICK_START.md](./backend/QUICK_START.md)** - Backend quick start
- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - GitHub setup guide

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon (auto-reload)
```

### Check Backend Status

```bash
cd backend
npm run check  # Health check
npm run verify-env  # Verify environment variables
```

## 🌐 Production Deployment

See **[PRODUCTION_BACKEND_SETUP.md](./PRODUCTION_BACKEND_SETUP.md)** for complete production deployment instructions.

### Quick Production Steps

1. Upload files to your server
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Start with PM2: `pm2 start npm --name "trendy-dresses-api" -- start`
5. Configure Nginx/Apache reverse proxy

## 🔒 Security

- All sensitive files (`.env`, credentials) are excluded from Git
- MongoDB connection strings are stored in `.env` (not committed)
- M-Pesa credentials are stored in `.env` (not committed)
- CORS is configured for specific domains in production

## 📝 API Endpoints

- `GET /api/health` - Health check
- `GET /api/db-status` - Database connection status
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (Admin)
- `POST /api/mpesa/stk-push` - Initiate STK Push payment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC License

## 📞 Support

For issues and questions:
- Check the documentation files
- Review troubleshooting guides
- Open an issue on GitHub

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Safaricom M-Pesa Daraja API for payment processing
- Express.js for backend framework
- jsPDF for PDF generation

---

**Note**: Remember to configure your `.env` file with your actual credentials before running the application.

