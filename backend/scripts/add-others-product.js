const mongoose = require('mongoose');
require('dotenv').config();
const { initDatabase } = require('../database/db');
const Product = require('../models/Product');

async function addOthersProduct() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await initDatabase();
        
        console.log('🔍 Checking if "others" product already exists...');
        const existingProduct = await Product.findOne({ name: 'others', category: 'others' });
        
        if (existingProduct) {
            console.log('✅ Product "others" already exists with ID:', existingProduct._id);
            console.log('📦 Product details:', {
                name: existingProduct.name,
                category: existingProduct.category,
                price: existingProduct.price,
                quantity: existingProduct.quantity
            });
            await mongoose.connection.close();
            return;
        }
        
        console.log('📝 Creating "others" product...');
        const newProduct = new Product({
            name: 'others',
            category: 'others',
            price: 0, // Default price, can be updated later
            discount: 0,
            quantity: 0, // Default quantity, can be updated later
            size: 'One Size', // Default size, can be updated later
            image: '' // Default empty image, can be updated later
        });
        
        const savedProduct = await newProduct.save();
        console.log('✅ Product "others" created successfully!');
        console.log('📦 Product details:', {
            id: savedProduct._id,
            name: savedProduct.name,
            category: savedProduct.category,
            price: savedProduct.price,
            quantity: savedProduct.quantity,
            size: savedProduct.size
        });
        
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
    } catch (error) {
        console.error('❌ Error adding "others" product:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

// Run the script
addOthersProduct();

