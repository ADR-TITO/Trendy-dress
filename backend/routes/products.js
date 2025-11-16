const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { mongoose } = require('../database/db');

// Get all products
router.get('/', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ MongoDB not connected. ReadyState:', mongoose.connection.readyState);
            console.error('❌ Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
            
            // Try to reconnect if not already connecting
            if (mongoose.connection.readyState === 0) {
                console.log('🔄 Attempting to reconnect to MongoDB...');
                try {
                    const { initDatabase } = require('../database/db');
                    await initDatabase();
                    // Wait a moment for connection to establish
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (reconnectError) {
                    console.error('❌ Reconnection failed:', reconnectError.message);
                    console.error('❌ Full error:', reconnectError);
                }
            }
            
            // If still not connected after retry, return empty array instead of error
            // This allows the frontend to work with localStorage while MongoDB is being fixed
            if (mongoose.connection.readyState !== 1) {
                console.warn('⚠️ Returning empty array - MongoDB not connected. Frontend will use localStorage.');
                console.warn('⚠️ To fix: Go to MongoDB Atlas → Network Access → Allow Access from Anywhere');
                return res.json([]); // Return empty array instead of error
            }
        }
        
        const { category, includeImages } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        console.log('Fetching products from MongoDB...');
        const products = await Product.find(query).sort({ createdAt: -1 });
        console.log(`✅ Found ${products.length} products`);
        
        // OPTIMIZATION: Exclude images from list endpoint by default (dramatically reduces response size)
        // Images can be loaded separately via /products/:id endpoint when needed
        if (includeImages !== 'true') {
            const productsWithoutImages = products.map(p => ({
                _id: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                discount: p.discount,
                quantity: p.quantity,
                size: p.size,
                image: '', // Exclude image data to reduce response size
                hasImage: !!(p.image && p.image.trim().length > 0), // Flag to indicate image exists
                createdAt: p.createdAt,
                updatedAt: p.updatedAt
            }));
            
            console.log(`📦 Returning ${productsWithoutImages.length} products without images (optimized)`);
            // Add caching headers for better performance
            res.set({
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
                'ETag': `"${productsWithoutImages.length}-${Date.now()}"`
            });
            res.json(productsWithoutImages);
        } else {
            // Include images if explicitly requested
            console.log(`📦 Returning ${products.length} products with images`);
            res.json(products);
        }
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch products',
            message: error.message 
        });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product (Admin only - authentication should be added)
router.post('/', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ Cannot create product - MongoDB not connected. ReadyState:', mongoose.connection.readyState);
            return res.status(503).json({ 
                error: 'Database not connected',
                message: 'MongoDB connection is not established. Please check your MongoDB Atlas IP whitelist.'
            });
        }
        
        const { name, category, price, discount, quantity, size, image } = req.body;
        
        // Validation
        if (!name || !category || !price || !size) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log(`📝 Creating product: ${name}`);
        const newProduct = new Product({
            name,
            category,
            price,
            discount: discount || 0,
            quantity: quantity || 0,
            size,
            image: image || ''
        });
        
        const savedProduct = await newProduct.save();
        console.log(`✅ Product created successfully: ${savedProduct._id}`);
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('❌ Error creating product:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create product', message: error.message });
    }
});

// Update product (Admin only)
router.put('/:id', async (req, res) => {
    try {
        const { name, category, price, discount, quantity, size, image } = req.body;
        const productId = req.params.id;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                category,
                price,
                discount: discount || 0,
                quantity: quantity || 0,
                size,
                image: image || ''
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        const deletedProduct = await Product.findByIdAndDelete(productId);
        
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Update product quantity (for stock management)
router.patch('/:id/quantity', async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.id;
        
        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { quantity },
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product quantity:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        res.status(500).json({ error: 'Failed to update product quantity' });
    }
});

module.exports = router;

