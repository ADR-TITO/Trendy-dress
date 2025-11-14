const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trendy-dresses';

// Connect to MongoDB
async function initDatabase() {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        console.log('📍 Connection string:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide password
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 second timeout (increased for slow connections)
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
        });
        
        console.log('✅ Connected to MongoDB successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        console.log(`📝 ReadyState: ${mongoose.connection.readyState} (1 = connected)`);
        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        if (error.name === 'MongoServerSelectionError') {
            console.error('⚠️ Could not connect to MongoDB server. Possible issues:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for all)');
            console.error('      → Go to: https://cloud.mongodb.com/ → Network Access → Add IP Address');
            console.error('      → Click "Allow Access from Anywhere" or add "0.0.0.0/0"');
            console.error('   3. Check if your MongoDB Atlas cluster is running');
            console.error('   4. Verify the connection string in .env file is correct');
            console.error('   5. Wait 1-2 minutes after updating IP whitelist for changes to take effect');
        }
        throw error;
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = { initDatabase, mongoose };
