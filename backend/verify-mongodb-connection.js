#!/usr/bin/env node
/**
 * MongoDB Connection Verification Script
 * Verifies MongoDB connection is working correctly
 */

require('dotenv').config();
const { initDatabase, mongoose } = require('./database/db');
const Product = require('./models/Product');

console.log('========================================');
console.log('MongoDB Connection Verification');
console.log('========================================');
console.log('');

// Check environment variables
console.log('📋 Step 1: Checking environment variables...');
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env file!');
    console.error('');
    console.error('Please add to backend/.env:');
    console.error('MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority');
    console.error('');
    process.exit(1);
}

// Sanitize connection string for display
const sanitizedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
console.log('✅ MONGODB_URI is set');
console.log(`   Connection string: ${sanitizedURI}`);
console.log('');

// Test connection
console.log('📋 Step 2: Testing MongoDB connection...');
(async () => {
    try {
        // Initialize database connection
        await initDatabase();
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check connection state
        const readyState = mongoose.connection.readyState;
        const readyStateText = readyState === 0 ? 'disconnected' :
                              readyState === 1 ? 'connected' :
                              readyState === 2 ? 'connecting' :
                              readyState === 3 ? 'disconnecting' : 'unknown';
        
        console.log(`   ReadyState: ${readyState} (${readyStateText})`);
        console.log(`   Database: ${mongoose.connection.name || 'not connected'}`);
        console.log(`   Host: ${mongoose.connection.host || 'not connected'}`);
        console.log('');
        
        if (readyState !== 1) {
            console.error('❌ MongoDB is not connected!');
            console.error(`   Current state: ${readyStateText} (${readyState})`);
            console.error('');
            console.error('Troubleshooting:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify MongoDB Atlas IP whitelist');
            console.error('   3. Check if MongoDB Atlas cluster is running');
            console.error('   4. Verify connection string is correct');
            process.exit(1);
        }
        
        console.log('✅ MongoDB connection successful!');
        console.log('');
        
        // Test database operations
        console.log('📋 Step 3: Testing database operations...');
        
        // Test: Count products
        try {
            const productCount = await Product.countDocuments();
            console.log(`✅ Database query successful!`);
            console.log(`   Products in database: ${productCount}`);
        } catch (queryError) {
            console.error('❌ Database query failed:', queryError.message);
            console.error('');
            console.error('This might indicate:');
            console.error('   1. Database permissions issue');
            console.error('   2. Collection not initialized');
            console.error('   3. Network connectivity issue');
            process.exit(1);
        }
        
        // Test: Create a test product (then delete it)
        try {
            console.log('   Testing write operation...');
            const testProduct = new Product({
                name: 'TEST_PRODUCT_DELETE_ME',
                category: 'dresses',
                price: 0,
                discount: 0,
                quantity: 0,
                size: 'M',
                image: ''
            });
            
            const saved = await testProduct.save();
            console.log(`✅ Write operation successful! (Created test product: ${saved._id})`);
            
            // Delete test product
            await Product.deleteOne({ _id: saved._id });
            console.log('✅ Delete operation successful! (Removed test product)');
        } catch (writeError) {
            console.error('❌ Write operation failed:', writeError.message);
            console.error('');
            console.error('This might indicate:');
            console.error('   1. Database write permissions issue');
            console.error('   2. Schema validation error');
            console.error('   3. Network connectivity issue');
            process.exit(1);
        }
        
        console.log('');
        console.log('========================================');
        console.log('✅ ALL CHECKS PASSED!');
        console.log('========================================');
        console.log('');
        console.log('MongoDB is connected and working correctly!');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   ReadyState: ${readyState} (connected)`);
        console.log('');
        
        // Close connection gracefully
        await mongoose.connection.close();
        console.log('✅ Connection closed gracefully');
        
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ CONNECTION FAILED!');
        console.error('========================================');
        console.error('');
        console.error('Error:', error.message);
        console.error('Error name:', error.name);
        console.error('');
        
        if (error.name === 'MongoServerSelectionError') {
            console.error('⚠️ Could not connect to MongoDB server.');
            console.error('');
            console.error('Common causes:');
            console.error('   1. ❌ Internet connection issue');
            console.error('   2. ❌ MongoDB Atlas IP whitelist does not include your IP');
            console.error('      → Fix: Go to https://cloud.mongodb.com/');
            console.error('      → Network Access → Add IP Address');
            console.error('      → Click "Allow Access from Anywhere" or add "0.0.0.0/0"');
            console.error('   3. ❌ MongoDB Atlas cluster is paused or stopped');
            console.error('      → Fix: Go to MongoDB Atlas → Clusters → Resume cluster');
            console.error('   4. ❌ Connection string is incorrect');
            console.error('      → Fix: Check backend/.env file');
            console.error('      → Verify MONGODB_URI is correct');
            console.error('   5. ❌ Firewall blocking connection');
            console.error('      → Fix: Check firewall settings');
            console.error('');
            console.error('After fixing, wait 1-2 minutes for changes to take effect.');
        } else if (error.name === 'MongoNetworkError' || error.message.includes('ECONNREFUSED')) {
            console.error('⚠️ Network error - cannot reach MongoDB server.');
            console.error('');
            console.error('Common causes:');
            console.error('   1. ❌ Internet connection down');
            console.error('   2. ❌ MongoDB Atlas cluster is down');
            console.error('   3. ❌ Firewall blocking connection');
            console.error('   4. ❌ DNS resolution issue');
        } else if (error.message.includes('authentication')) {
            console.error('⚠️ Authentication failed.');
            console.error('');
            console.error('Common causes:');
            console.error('   1. ❌ Username or password incorrect in connection string');
            console.error('   2. ❌ Database user does not have permissions');
            console.error('   3. ❌ Connection string format is incorrect');
        } else {
            console.error('⚠️ Unexpected error occurred.');
            console.error('');
            console.error('Please check:');
            console.error('   1. MongoDB Atlas cluster status');
            console.error('   2. Network connectivity');
            console.error('   3. Connection string in .env file');
            console.error('   4. Backend server logs for more details');
        }
        
        console.error('');
        process.exit(1);
    }
})();

