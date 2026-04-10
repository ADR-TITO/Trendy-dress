const pool = require('./db');

async function setupDatabase() {
    console.log('Starting Database Setup...');
    try {
        // 1. Create Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                notificationToken VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Users table ready');

        // 2. Add Discount Fields to Products Table (if not exist)
        try {
            await pool.query('ALTER TABLE products ADD COLUMN discountPercentage INT DEFAULT 0');
            console.log('✓ Added discountPercentage to products');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ discountPercentage already exists');
            else throw e;
        }

        try {
            await pool.query('ALTER TABLE products ADD COLUMN isDiscountHidden BOOLEAN DEFAULT FALSE');
            console.log('✓ Added isDiscountHidden to products');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ isDiscountHidden already exists');
            else throw e;
        }

        try {
            await pool.query("ALTER TABLE products ADD COLUMN discountVisibleTo ENUM('public', 'loggedIn') DEFAULT 'public'");
            console.log('✓ Added discountVisibleTo to products');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ discountVisibleTo already exists');
            else throw e;
        }

        console.log('Database setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
