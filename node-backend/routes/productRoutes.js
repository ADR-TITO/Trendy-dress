const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Middleware to optionally get user
const optionalAuth = (req, res, next) => {
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

// Get all products (with hidden discount logic)
router.get('/', optionalAuth, async (req, res) => {
    const category = req.query.category || 'all';
    try {
        let sql = 'SELECT * FROM products';
        const params = [];
        
        if (category !== 'all') {
            sql += ' WHERE category = ?';
            params.push(category);
        }
        sql += ' ORDER BY createdAt DESC';
        
        const [products] = await pool.query(sql, params);
        
        // Apply discount logic
        const processedProducts = products.map(product => {
            const p = { ...product };
            
            // Check if discount is hidden and user is not logged in / not an admin
            if (p.isDiscountHidden && p.discountVisibleTo === 'loggedIn') {
                if (!req.user) {
                    // Hide the discount from public
                    p.discountPercentage = 0;
                    p.discount = 0; // Legacy field
                    p.hideDiscountMessage = true; 
                }
            }
            
            // Standardize discount field
            if (p.discountPercentage !== undefined) {
                p.discount = p.discountPercentage;
            }
            
            return p;
        });
        
        res.json({ success: true, count: processedProducts.length, data: processedProducts });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
