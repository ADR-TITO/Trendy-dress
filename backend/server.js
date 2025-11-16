const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database/db');
const { isPortAvailable, findAvailablePort } = require('./utils/port-checker');
require('dotenv').config();

// Import routes
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const settingsRouter = require('./routes/settings');
const mpesaRouter = require('./routes/mpesa');

const app = express();
// Default port is 3001, but will automatically use next available port if in use
const DEFAULT_PORT = parseInt(process.env.PORT) || 3001;

// Middleware - CORS configuration
// Production: Allow only trendydresses.co.ke and www.trendydresses.co.ke
// Development: Allow localhost for local testing
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://trendydresses.co.ke',
        'https://www.trendydresses.co.ke',
        'http://trendydresses.co.ke', // HTTP fallback (should redirect to HTTPS)
        'http://www.trendydresses.co.ke' // HTTP fallback
      ]
    : [
        'http://localhost:3001',
        'http://localhost:8080',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8080',
        'file://', // For local file testing
        '*' // Allow all in development
      ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Log blocked origin for debugging
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Compression middleware for faster responses
const compression = require('compression');
app.use(compression({ level: 6 })); // Level 6 provides good balance between speed and compression

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

// Server info endpoint - returns current port and server info
app.get('/api/server-info', (req, res) => {
    const server = app.get('server');
    const port = server?.address()?.port || app.get('port') || DEFAULT_PORT;
    
    res.json({
        port: port,
        defaultPort: DEFAULT_PORT,
        hostname: req.hostname || 'localhost',
        protocol: req.protocol || 'http',
        baseURL: `${req.protocol || 'http'}://${req.hostname || 'localhost'}:${port}/api`
    });
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

// Start server with port conflict handling
let actualPort = DEFAULT_PORT; // Store actual port globally for server-info endpoint

async function startServer() {
    try {
        // Check if the requested port is available
        const portAvailable = await isPortAvailable(DEFAULT_PORT);
        
        if (!portAvailable) {
            console.warn(`⚠️ Port ${DEFAULT_PORT} is already in use`);
            console.log(`🔍 Automatically finding next available port...`);
            
            try {
                // Start from DEFAULT_PORT + 1 to use a different port
                actualPort = await findAvailablePort(DEFAULT_PORT + 1, 20);
                console.log(`✅ Using available port: ${actualPort} (${DEFAULT_PORT} was in use)`);
            } catch (error) {
                console.error(`❌ Could not find an available port: ${error.message}`);
                console.error(`💡 Please stop processes using ports ${DEFAULT_PORT}-${DEFAULT_PORT + 20} or change PORT in .env file`);
                process.exit(1);
            }
        } else {
            actualPort = DEFAULT_PORT;
            console.log(`✅ Port ${actualPort} is available`);
        }
        
        // Store actual port in app for server-info endpoint
        app.set('port', actualPort);
        
        // CORS is already configured above, and in development it allows all origins
        // The dynamic port will be handled by the wildcard '*' in development
        
        // Start the server on the available port
        const server = app.listen(actualPort, '0.0.0.0', () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`🚀 Server is running on http://localhost:${actualPort}`);
            console.log(`🚀 Server is also accessible on http://127.0.0.1:${actualPort}`);
            console.log(`📊 API endpoints available at http://localhost:${actualPort}/api`);
            console.log(`📊 Health check: http://localhost:${actualPort}/api/health`);
            console.log(`📊 Server info: http://localhost:${actualPort}/api/server-info`);
            console.log(`📊 DB status: http://localhost:${actualPort}/api/db-status`);
            console.log(`✅ CORS enabled for all origins`);
            if (actualPort !== DEFAULT_PORT) {
                console.log(`⚠️  Note: Using port ${actualPort} (${DEFAULT_PORT} was in use)`);
                console.log(`💡 Frontend will automatically detect this port`);
            }
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
        });
        
        // Store server reference for graceful shutdown
        app.set('server', server);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle server errors
app.on('error', (err) => {
    console.error('❌ Server error:', err);
});

// Handle unhandled promise rejections (prevents server crashes)
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('❌ Reason:', reason);
    console.error('⚠️ Server will continue running, but please fix the error above');
    // Don't exit - let the server continue running
});

// Handle uncaught exceptions (prevents server crashes)
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('❌ Stack:', error.stack);
    console.error('⚠️ Server will continue running, but please fix the error above');
    // Don't exit - let the server continue running for production
    // In production, you might want to exit(1) here, but for development, continue
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    const { mongoose } = require('./database/db');
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    const { mongoose } = require('./database/db');
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    process.exit(0);
});

