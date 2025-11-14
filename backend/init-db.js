const { initDatabase } = require('./database/db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        await initDatabase();
        
        // Create default admin user
        const { dbHelpers } = require('./database/db');
        const defaultUsername = 'admin';
        const defaultPassword = 'admin123';
        
        // Check if admin user already exists
        const existingAdmin = await dbHelpers.get(
            'SELECT * FROM admin_users WHERE username = ?',
            [defaultUsername]
        );
        
        if (!existingAdmin) {
            // Hash password
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            
            // Insert default admin
            await dbHelpers.run(
                'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
                [defaultUsername, passwordHash]
            );
            
            console.log('Default admin user created:');
            console.log(`Username: ${defaultUsername}`);
            console.log(`Password: ${defaultPassword}`);
            console.log('⚠️  Please change the default password after first login!');
        } else {
            console.log('Admin user already exists');
        }
        
        // Initialize default website settings
        const defaultSettings = [
            { key: 'heroTitle', value: 'Fashion That Speaks Your Style' },
            { key: 'heroDescription', value: 'Discover the latest trends in dresses and tracksuits' },
            { key: 'heroImage', value: '' },
            { key: 'websiteIcon', value: '' },
            { key: 'aboutText', value: 'Welcome to Trendy Dresses, your one-stop shop for the latest fashion trends. We offer a wide selection of high-quality dresses and tracksuits that combine style, comfort, and affordability. Our mission is to help you express your unique style with confidence.' },
            { key: 'contactPhone', value: '254724904692' },
            { key: 'contactEmail', value: 'Trendy dresses790@gmail.com' },
            { key: 'contactAddress', value: 'Nairobi, Moi avenue, Imenti HSE Glory Exhibition Basement, Shop B4' }
        ];
        
        for (const setting of defaultSettings) {
            const existing = await dbHelpers.get(
                'SELECT * FROM website_settings WHERE setting_key = ?',
                [setting.key]
            );
            
            if (!existing) {
                await dbHelpers.run(
                    'INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)',
                    [setting.key, setting.value]
                );
            }
        }
        
        console.log('Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();


