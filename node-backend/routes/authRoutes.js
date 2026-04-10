const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // If it is the first user, maybe make them an admin.
        const [count] = await pool.query('SELECT COUNT(*) as cnt FROM users');
        const role = count[0].cnt === 0 ? 'admin' : 'user';

        const [result] = await pool.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );

        const token = jwt.sign(
            { id: result.insertId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            token,
            user: { id: result.insertId, email, role }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update FCM Token
router.post('/update-token', async (req, res) => {
    const { token } = req.body;
    let authorization = req.headers['authorization'];
    if (!token || !authorization) return res.status(400).json({success: false});
    
    if (authorization.startsWith('Bearer ')) {
        authorization = authorization.slice(7, authorization.length);
    }
    
    try {
        const decoded = jwt.verify(authorization, process.env.JWT_SECRET);
        await pool.query('UPDATE users SET notificationToken = ? WHERE id = ?', [token, decoded.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(401).json({ success: false });
    }
});

module.exports = router;
