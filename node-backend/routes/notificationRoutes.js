const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware for Admin validation
const verifyAdmin = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).json({ success: false, message: 'No token provided' });
    
    if (token.startsWith('Bearer ')) token = token.slice(7, token.length);
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to authenticate token' });
        if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
        req.userId = decoded.id;
        next();
    });
};

// Register FCM token
router.post('/register', async (req, res) => {
    const { token, userId } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
    
    try {
        if (userId) {
            // If user is logged in, attach token to user
            await pool.query('UPDATE users SET notificationToken = ? WHERE id = ?', [token, userId]);
        }
        res.json({ success: true, message: 'Token registered successfully' });
    } catch (error) {
        console.error('Error saving notification token:', error);
        res.status(500).json({ success: false, message: 'Failed to save token' });
    }
});

// Admin send notification
router.post('/send', verifyAdmin, async (req, res) => {
    const { title, body, token } = req.body;
    
    if (!admin.apps.length) {
        return res.status(500).json({ success: false, message: 'Firebase Admin not initialized. Missing credentials.' });
    }

    const message = {
        notification: { title, body }
    };

    try {
        if (token) {
            // Send to specific device
            message.token = token;
            const response = await admin.messaging().send(message);
            res.json({ success: true, message: 'Notification sent successfully', response });
        } else {
            // Send to all users with tokens
            const [users] = await pool.query('SELECT notificationToken FROM users WHERE notificationToken IS NOT NULL');
            const tokens = users.map(u => u.notificationToken);
            
            if (tokens.length === 0) {
                return res.json({ success: true, message: 'No registered devices found' });
            }
            
            const response = await admin.messaging().sendMulticast({
                tokens: tokens,
                notification: { title, body }
            });
            res.json({ success: true, message: `Notification sent to ${response.successCount} devices`, response });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification', error: error.message });
    }
});

module.exports = router;
