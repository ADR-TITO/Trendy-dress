const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const nodemailer = require('nodemailer');

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

        // Send Welcome Email
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_PORT == 465,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_FROM || '"Trendy Dresses" <trendy@example.com>',
                    to: email,
                    subject: 'Welcome to Trendy Dresses!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #ff3366;">Welcome to Trendy Dresses!</h2>
                            <p>Hello,</p>
                            <p>Thank you for signing up! Your account has been successfully created.</p>
                            <p>You can now browse our latest collections of dresses and tracksuits, and save your favorite items to your cart.</p>
                            <br>
                            <p>Best regards,<br><strong>Trendy Dresses Team</strong></p>
                        </div>
                    `
                };

                // Remove await to avoid delaying the API response
                transporter.sendMail(mailOptions).then(() => {
                    console.log(`Welcome email sent to ${email}`);
                }).catch((emailError) => {
                    console.error('Failed to send welcome email:', emailError);
                });
            } catch (configError) {
                console.error('Nodemailer configuration error:', configError);
            }
        }

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
