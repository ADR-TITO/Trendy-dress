const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbHelpers } = require('../database/db');

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        const admin = await dbHelpers.get(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Don't send password hash in response
        const { password_hash, ...adminData } = admin;
        res.json({ success: true, admin: adminData });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Change admin credentials
router.put('/credentials', async (req, res) => {
    try {
        const { currentPassword, newUsername, newPassword } = req.body;
        
        // Get current admin (assuming single admin for now)
        const admin = await dbHelpers.get('SELECT * FROM admin_users LIMIT 1');
        
        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Update username if provided
        if (newUsername && newUsername.trim()) {
            if (newUsername.length < 3) {
                return res.status(400).json({ error: 'Username must be at least 3 characters' });
            }
            
            await dbHelpers.run(
                'UPDATE admin_users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newUsername, admin.id]
            );
        }
        
        // Update password if provided
        if (newPassword && newPassword.trim()) {
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await dbHelpers.run(
                'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [passwordHash, admin.id]
            );
        }
        
        const updatedAdmin = await dbHelpers.get('SELECT * FROM admin_users WHERE id = ?', [admin.id]);
        const { password_hash, ...adminData } = updatedAdmin;
        
        res.json({ success: true, admin: adminData });
    } catch (error) {
        console.error('Error updating credentials:', error);
        res.status(500).json({ error: 'Failed to update credentials' });
    }
});

// Get admin info (for verification)
router.get('/info', async (req, res) => {
    try {
        const admin = await dbHelpers.get('SELECT id, username, created_at FROM admin_users LIMIT 1');
        
        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }
        
        res.json(admin);
    } catch (error) {
        console.error('Error fetching admin info:', error);
        res.status(500).json({ error: 'Failed to fetch admin info' });
    }
});

module.exports = router;








