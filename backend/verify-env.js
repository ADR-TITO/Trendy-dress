// Verification script to check .env file is loaded correctly
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying .env file configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists at:', envPath);
    
    // Read .env file (without exposing sensitive data)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasMongoDB = envContent.includes('MONGODB_URI');
    
    if (hasMongoDB) {
        console.log('✅ MONGODB_URI found in .env file');
        
        // Check if it's loaded by dotenv
        if (process.env.MONGODB_URI) {
            const uri = process.env.MONGODB_URI;
            // Mask password for security
            const maskedURI = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
            console.log('✅ MONGODB_URI loaded by dotenv');
            console.log('📍 Connection string:', maskedURI);
            
            // Validate connection string format
            if (uri.includes('mongodb+srv://') || uri.includes('mongodb://')) {
                console.log('✅ Connection string format is valid');
                
                // Check if it's Atlas (mongodb+srv)
                if (uri.includes('mongodb+srv://')) {
                    console.log('✅ Using MongoDB Atlas (mongodb+srv://)');
                    if (uri.includes('cluster')) {
                        console.log('✅ Cluster detected in connection string');
                    }
                }
            } else {
                console.log('⚠️ Connection string format may be invalid');
            }
        } else {
            console.log('❌ MONGODB_URI not loaded by dotenv');
            console.log('⚠️ Check .env file format and ensure dotenv is called before using process.env');
        }
    } else {
        console.log('❌ MONGODB_URI not found in .env file');
    }
    
    // Check for PORT
    if (process.env.PORT) {
        console.log('✅ PORT loaded:', process.env.PORT);
    } else {
        console.log('ℹ️ PORT not set (will use default: 3000)');
    }
    
} else {
    console.log('❌ .env file not found at:', envPath);
    console.log('💡 Create .env file with your MongoDB Atlas connection string');
}

console.log('\n📋 Environment Variables Summary:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Not loaded');
console.log('   PORT:', process.env.PORT || '3000 (default)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');

