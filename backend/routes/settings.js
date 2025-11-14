const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../database/db');

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await dbHelpers.all('SELECT * FROM website_settings');
        
        // Convert array to object for easier access
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Get single setting
router.get('/:key', async (req, res) => {
    try {
        const setting = await dbHelpers.get(
            'SELECT * FROM website_settings WHERE setting_key = ?',
            [req.params.key]
        );
        
        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json({ [setting.setting_key]: setting.setting_value });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
});

// Update single setting
router.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const key = req.params.key;
        
        // Check if setting exists
        const existing = await dbHelpers.get(
            'SELECT * FROM website_settings WHERE setting_key = ?',
            [key]
        );
        
        if (existing) {
            // Update existing setting
            await dbHelpers.run(
                'UPDATE website_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
                [value || '', key]
            );
        } else {
            // Create new setting
            await dbHelpers.run(
                'INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)',
                [key, value || '']
            );
        }
        
        const updated = await dbHelpers.get(
            'SELECT * FROM website_settings WHERE setting_key = ?',
            [key]
        );
        
        res.json({ [updated.setting_key]: updated.setting_value });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// Update multiple settings at once
router.put('/', async (req, res) => {
    try {
        const settings = req.body;
        
        for (const [key, value] of Object.entries(settings)) {
            const existing = await dbHelpers.get(
                'SELECT * FROM website_settings WHERE setting_key = ?',
                [key]
            );
            
            if (existing) {
                await dbHelpers.run(
                    'UPDATE website_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
                    [value || '', key]
                );
            } else {
                await dbHelpers.run(
                    'INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)',
                    [key, value || '']
                );
            }
        }
        
        // Return all updated settings
        const allSettings = await dbHelpers.all('SELECT * FROM website_settings');
        const settingsObj = {};
        allSettings.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;








