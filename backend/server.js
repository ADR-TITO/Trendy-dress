const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database/db');
require('dotenv').config();

// Import routes
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const settingsRouter = require('./routes/settings');
const mpesaRouter = require('./routes/mpesa');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
app.use(cors({
    origin: '*', // Allow all origins (you can restrict this to specific domains in production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database on startup (don't exit on error - allow server to start)
let dbInitialized = false;
initDatabase()
    .then(() => {
        dbInitialized = true;
        console.log('✅ Database initialization complete');
    })
    .catch(err => {
        dbInitialized = false;
        console.error('⚠️ Failed to initialize database:', err);
        console.error('⚠️ Server will continue but MongoDB operations will fail');
        console.error('⚠️ Please check your MongoDB connection string in .env file');
        console.error('⚠️ Error details:', err.message);
    });

// Add endpoint to check database status
app.get('/api/db-status', (req, res) => {
    const { mongoose } = require('./database/db');
    res.json({
        initialized: dbInitialized,
        readyState: mongoose.connection.readyState,
        readyStateText: mongoose.connection.readyState === 0 ? 'disconnected' : 
                        mongoose.connection.readyState === 1 ? 'connected' : 
                        mongoose.connection.readyState === 2 ? 'connecting' : 'disconnecting',
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected'
    });
});

// Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/mpesa', mpesaRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Trendy Dresses API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Trendy Dresses Backend API',
        version: '1.0.0',
        endpoints: {
            products: '/api/products',
            orders: '/api/orders',
            admin: '/api/admin',
            settings: '/api/settings',
            health: '/api/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🚀 Server is also accessible on http://127.0.0.1:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`✅ CORS enabled for all origins`);
});

// Handle server errors
app.on('error', (err) => {
    console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

