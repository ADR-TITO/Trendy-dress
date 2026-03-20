// Product Data - Prices in Kenyan Shillings
let products = [];

// Cart
let cart = [];
let currentCategory = 'all';

// Admin
let isAdmin = false;

// Admin credentials are now handled by the backend


// Website Content
let websiteContent = {
    heroTitle: 'Fashion That Speaks Your Style',
    heroDescription: 'Discover the latest trends in dresses and tracksuits',
    heroImage: '', // Background image URL for hero section
    websiteIcon: '', // Website favicon/icon
    aboutText: 'Welcome to Trendy Dresses, your one-stop shop for the latest fashion trends. We offer a wide selection of high-quality dresses and tracksuits that combine style, comfort, and affordability. Our mission is to help you express your unique style with confidence.',
    contactPhone: '254724904692',
    contactEmail: 'Trendy dresses790@gmail.com',
    contactAddress: 'Nairobi, Moi avenue, Imenti HSE Glory Exhibition Basement, Shop B4'
};

// Global status flags
let useDatabase = false;

// Initialize
// Function to migrate ALL products from localStorage to MariaDB (preserves all data)
async function migrateProductsToDatabase(overwrite = false) {
    console.log('🚀 Starting migration to MariaDB...');

    // Check if backend is available
    const backendAvailable = await apiService.checkBackend();
    if (!backendAvailable) {
        const errorMsg = 'PHP backend server is not available. Please deploy PHP backend.';
        console.error('❌', errorMsg);
        showNotification(errorMsg + ' See console for instructions.', 'error');
        console.warn('⚠️ To deploy PHP backend:');
        console.warn('   1. Upload backend-php/ folder to your server');
        console.warn('   2. Run: composer install in backend-php/');
        console.warn('   3. Configure .env file with Database connection');
        console.warn('   4. Configure web server to route /api to PHP');
        console.warn('   5. Test: curl https://trendydresses.co.ke/api/health');
        console.warn('   6. Refresh this page and try again');
        return false;
    }

    try {
        // Get products from localStorage
        const savedProducts = localStorage.getItem('products');
        if (!savedProducts) {
            console.log('ℹ️ No products in localStorage to migrate');
            showNotification('No products found in localStorage to migrate', 'info');
            return false;
        }

        const localProducts = JSON.parse(savedProducts);
        if (localProducts.length === 0) {
            console.log('ℹ️ localStorage is empty - nothing to migrate');
            showNotification('localStorage is empty - nothing to migrate', 'info');
            return false;
        }

        console.log(`📦 Found ${localProducts.length} products in localStorage`);
        console.log(`🔄 Starting migration to Database...`);

        // Check if Database already has products (with timeout handling)
        let dbProducts = [];
        try {
            // Use optimized version without images for faster checking
            console.log('🔍 Checking existing Database products...');
            dbProducts = await apiService.getProducts('all', false); // false = without images for speed
            if (dbProducts && dbProducts.length > 0 && !overwrite) {
                console.log(`✅ Found ${dbProducts.length} existing products in database`);
                console.log(`⚠️ Database already has ${dbProducts.length} products.`);
                console.log('💡 To overwrite existing products, run: migrateProductsToDatabase(true)');
                console.log('💡 To merge products, the migration will update existing ones by name and size');

                // Ask user if they want to proceed with merge (update existing, add new)
                const proceed = confirm(
                    `Database already has ${dbProducts.length} products.\n\n` +
                    `Click OK to merge (update existing products, add new ones).\n` +
                    `Click Cancel to skip migration.`
                );
                if (!proceed) {
                    console.log('❌ Migration cancelled by user');
                    return false;
                }
            }
        } catch (error) {
            // If check fails (timeout, network issue), proceed with migration anyway
            const errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
                console.warn('⚠️ Could not check Database products (timeout) - proceeding with migration anyway');
                console.log('ℹ️ Migration will proceed. If products already exist, they will be updated.');
            } else {
                console.warn('⚠️ Could not check Database products:', errorMsg);
                console.log('ℹ️ Proceeding with migration - existing products will be updated if found.');
            }
        }

        // Create a map of existing Database products by name+size for duplicate detection
        const existingProductsMap = new Map();
        if (dbProducts && dbProducts.length > 0) {
            dbProducts.forEach(p => {
                const key = `${p.name.toLowerCase().trim()}_${(p.size || 'M').toUpperCase().trim()}`;
                existingProductsMap.set(key, p);
            });
        }

        // Upload each product to Database (preserve ALL data including images)
        let successCount = 0;
        let updateCount = 0;
        let createCount = 0;
        let failCount = 0;
        const failedProducts = [];
        const migratedProducts = [];

        console.log(`\n📤 Migrating ${localProducts.length} products...\n`);

        for (let i = 0; i < localProducts.length; i++) {
            const product = localProducts[i];
            try {
                // Preserve ALL product properties
                const productData = {
                    name: product.name || '',
                    category: product.category || 'dresses',
                    price: product.price || 0,
                    discount: product.discount || 0,
                    quantity: product.quantity || 0,
                    size: normalizeSize(product.size || 'M'), // Normalize size
                    image: product.image || '' // Preserve images
                };

                // Check if product already exists in Database (by name + size)
                const key = `${productData.name.toLowerCase().trim()}_${productData.size.toUpperCase().trim()}`;
                const existingProduct = existingProductsMap.get(key);

                let result;
                if (existingProduct && existingProduct._id) {
                    // Update existing product
                    console.log(`🔄 Updating existing: ${product.name} (Size: ${productData.size})...`);
                    result = await apiService.updateProduct(existingProduct._id, productData);
                    updateCount++;
                    console.log(`✅ Updated: ${product.name} (${i + 1}/${localProducts.length})`);
                } else {
                    // Create new product
                    console.log(`➕ Creating new: ${product.name} (Size: ${productData.size})...`);
                    result = await apiService.createProduct(productData);
                    createCount++;
                    console.log(`✅ Created: ${product.name} (${i + 1}/${localProducts.length})`);
                }

                successCount++;
                migratedProducts.push({ name: product.name, size: productData.size, id: result._id || result.id });

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
                failCount++;
                const errorMsg = error.message || 'Unknown error';
                console.error(`❌ Failed to migrate ${product.name}:`, errorMsg);
                failedProducts.push({
                    name: product.name,
                    size: product.size || 'N/A',
                    error: errorMsg
                });

                // If we get a 503 error, Database is not connected - stop migration
                if (error.message && (error.message.includes('Database not connected') || error.message.includes('503'))) {
                    console.error('❌ CRITICAL: Database is not connected. Stopping migration.');
                    console.error('❌ Please check your backend server console for Database connection errors.');
                    console.error('❌ Make sure Database Atlas IP whitelist is updated and server is restarted.');
                    break;
                }

                // Continue with next product even if one fails
            }
        }

        // Summary
        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Total migrated: ${successCount}/${localProducts.length}`);
        console.log(`   ➕ Created: ${createCount}`);
        console.log(`   🔄 Updated: ${updateCount}`);
        console.log(`   ❌ Failed: ${failCount}`);

        if (migratedProducts.length > 0) {
            console.log(`\n✅ Successfully migrated products:`);
            migratedProducts.slice(0, 10).forEach(p => {
                console.log(`   - ${p.name} (Size: ${p.size})`);
            });
            if (migratedProducts.length > 10) {
                console.log(`   ... and ${migratedProducts.length - 10} more`);
            }
        }

        if (failedProducts.length > 0) {
            console.log(`\n❌ Failed products:`);
            failedProducts.forEach(fp => {
                console.log(`   - ${fp.name} (Size: ${fp.size}): ${fp.error}`);
            });
        }

        // Update localStorage preference
        if (successCount > 0) {
            localStorage.setItem('useDatabase', 'true');
            localStorage.setItem('preferredStorage', 'database');
            console.log('\n✅ Migration complete! Reloading products from Database...');

            // After migration, try to reload from Database, but don't fail if it times out
            try {
                // Wait a moment for Database to process the new products
                await new Promise(resolve => setTimeout(resolve, 500));

                // Try to reload from Database (without images for faster loading)
                await loadProducts();
                console.log('✅ Successfully reloaded products from Database after migration');
            } catch (reloadError) {
                // If reload fails (timeout, etc.), use the products we just migrated
                console.warn('⚠️ Could not reload from Database after migration (this is okay):', reloadError.message);
                console.log('ℹ️ Using migrated products directly - they are already in Database');
            }

            displayProducts('all');

            showNotification(
                `Successfully migrated ${successCount} products to Database! (${createCount} created, ${updateCount} updated)`,
                'success'
            );
            return true;
        } else if (failCount > 0) {
            const errorMsg = failedProducts.length > 0 ? failedProducts[0].error : 'Unknown error';
            showNotification(`Migration failed: ${errorMsg}. Check console for details.`, 'error');
            console.error('❌ Migration failed completely. Check backend server console for Database connection status.');
        }

        return successCount > 0;
    } catch (error) {
        console.error('❌ Migration error:', error);
        showNotification('Error migrating products: ' + error.message, 'error');
        return false;
    }
}

// Function to recover products from IndexedDB
async function recoverFromIndexedDB() {
    console.log('🔍 Checking IndexedDB for products...');

    try {
        // Initialize IndexedDB
        await storageManager.init();

        if (!storageManager.useIndexedDB || !storageManager.db) {
            console.log('ℹ️ IndexedDB not available');
            return null;
        }

        // Load products from IndexedDB
        const indexedProducts = await storageManager.loadProducts();

        if (indexedProducts && indexedProducts.length > 0) {
            console.log(`📦 Found ${indexedProducts.length} products in IndexedDB`);

            // Check how many have images
            const productsWithImages = indexedProducts.filter(p => {
                const img = p.image || '';
                return img && img.trim().length > 0 &&
                    (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
            }).length;

            console.log(`📊 ${productsWithImages}/${indexedProducts.length} products have images in IndexedDB`);
            console.log(`📦 Products:`, indexedProducts.map(p => ({
                id: p.id,
                name: p.name,
                size: p.size,
                hasImage: !!(p.image && p.image.length > 0 && (p.image.startsWith('data:image/') || p.image.startsWith('http')))
            })));

            return indexedProducts;
        } else {
            console.log('ℹ️ No products found in IndexedDB');
            return null;
        }
    } catch (error) {
        console.error('❌ Error recovering from IndexedDB:', error);
        return null;
    }
}

// Function to migrate from IndexedDB to Database
async function migrateFromIndexedDBToDatabase() {
    console.log('🚀 Starting migration from IndexedDB to Database...');

    // Check if backend is available
    const backendAvailable = await apiService.checkBackend();
    if (!backendAvailable) {
        const errorMsg = 'PHP backend server is not available. Please deploy PHP backend.';
        console.error('❌', errorMsg);
        showNotification(errorMsg + ' See console for instructions.', 'error');
        console.warn('⚠️ To deploy PHP backend:');
        console.warn('   1. Upload backend-php/ folder to your server');
        console.warn('   2. Run: composer install in backend-php/');
        console.warn('   3. Configure .env file with Database connection');
        console.warn('   4. Configure web server to route /api to PHP');
        console.warn('   5. Test: curl https://trendydresses.co.ke/api/health');
        console.warn('   6. Refresh this page and try again');
        return false;
    }

    try {
        // Recover products from IndexedDB
        const indexedProducts = await recoverFromIndexedDB();

        if (!indexedProducts || indexedProducts.length === 0) {
            console.log('ℹ️ No products found in IndexedDB to migrate');
            showNotification('No products found in IndexedDB to migrate', 'info');
            return false;
        }

        console.log(`📦 Found ${indexedProducts.length} products in IndexedDB`);
        console.log(`🔄 Starting migration to Database...`);

        // Check if Database already has products (with timeout handling)
        let dbProducts = [];
        try {
            // Use optimized version without images for faster checking
            console.log('🔍 Checking existing Database products...');
            dbProducts = await apiService.getProducts('all', false); // false = without images for speed

            if (dbProducts && dbProducts.length > 0) {
                console.log(`✅ Found ${dbProducts.length} existing products in Database`);
                const proceed = confirm(
                    `Database already has ${dbProducts.length} products.\n\n` +
                    `IndexedDB has ${indexedProducts.length} products.\n\n` +
                    `Click OK to merge (update existing products, add new ones).\n` +
                    `Click Cancel to skip migration.`
                );
                if (!proceed) {
                    console.log('❌ Migration cancelled by user');
                    return false;
                }
            } else {
                console.log('ℹ️ No existing products found in Database - will create new products');
            }
        } catch (error) {
            // If check fails (timeout, network issue), proceed with migration anyway
            // The migration will handle duplicates if they exist
            const errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
                console.warn('⚠️ Could not check Database products (timeout) - proceeding with migration anyway');
                console.log('ℹ️ Migration will proceed. If products already exist, they will be updated.');
            } else {
                console.warn('⚠️ Could not check Database products:', errorMsg);
                console.log('ℹ️ Proceeding with migration - existing products will be updated if found.');
            }
            // Continue with migration - we'll handle duplicates during the migration process
        }

        // Create a map of existing Database products
        const existingProductsMap = new Map();
        if (dbProducts && dbProducts.length > 0) {
            dbProducts.forEach(p => {
                const key = `${p.name.toLowerCase().trim()}_${normalizeSize(p.size || 'M').toUpperCase().trim()}`;
                existingProductsMap.set(key, p);
            });
        }

        // Migrate each product
        let successCount = 0;
        let updateCount = 0;
        let createCount = 0;
        let failCount = 0;
        const failedProducts = [];
        const migratedProducts = [];

        console.log(`\n📤 Migrating ${indexedProducts.length} products from IndexedDB to Database...\n`);

        for (let i = 0; i < indexedProducts.length; i++) {
            const product = indexedProducts[i];
            try {
                // Preserve ALL product properties including images
                const productData = {
                    name: product.name || '',
                    category: product.category || 'dresses',
                    price: product.price || 0,
                    discount: product.discount || 0,
                    quantity: product.quantity || 0,
                    size: normalizeSize(product.size || 'M'),
                    image: product.image || '' // Preserve images
                };

                // Check if product already exists
                const key = `${productData.name.toLowerCase().trim()}_${productData.size.toUpperCase().trim()}`;
                const existingProduct = existingProductsMap.get(key);

                let result;
                const hasImage = !!(productData.image && productData.image.length > 0);

                if (existingProduct && existingProduct._id) {
                    // Update existing
                    console.log(`🔄 Updating: ${product.name} (Size: ${productData.size})${hasImage ? ' [with image]' : ''}...`);
                    result = await apiService.updateProduct(existingProduct._id, productData);
                    updateCount++;
                    console.log(`✅ Updated: ${product.name} (${i + 1}/${indexedProducts.length})`);
                } else {
                    // Create new
                    console.log(`➕ Creating: ${product.name} (Size: ${productData.size})${hasImage ? ' [with image]' : ''}...`);
                    result = await apiService.createProduct(productData);
                    createCount++;
                    console.log(`✅ Created: ${product.name} (${i + 1}/${indexedProducts.length})`);
                }

                successCount++;
                migratedProducts.push({
                    name: product.name,
                    size: productData.size,
                    hasImage: hasImage
                });

                // Small delay
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
                failCount++;
                const errorMsg = error.message || 'Unknown error';
                console.error(`❌ Failed to migrate ${product.name}:`, errorMsg);
                failedProducts.push({ name: product.name, error: errorMsg });
            }
        }

        // Summary
        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Total migrated: ${successCount}/${indexedProducts.length}`);
        console.log(`   ➕ Created: ${createCount}`);
        console.log(`   🔄 Updated: ${updateCount}`);
        console.log(`   ❌ Failed: ${failCount}`);

        const productsWithImages = migratedProducts.filter(p => p.hasImage).length;
        console.log(`   📷 Products with images: ${productsWithImages}`);

        if (successCount > 0) {
            localStorage.setItem('useDatabase', 'true');
            localStorage.setItem('preferredStorage', 'database');

            // Also save to localStorage as backup
            try {
                localStorage.setItem('products', JSON.stringify(indexedProducts));
                console.log(`✅ Also saved ${indexedProducts.length} products to localStorage as backup`);
            } catch (error) {
                console.error('❌ Could not save to localStorage:', error);
            }

            console.log('\n✅ Migration complete! Reloading products from Database...');

            // After migration, try to reload from Database, but don't fail if it times out
            // We'll use the migrated products directly if Database reload fails
            try {
                // Wait a moment for Database to process the new products
                await new Promise(resolve => setTimeout(resolve, 500));

                // Try to reload from Database (without images for faster loading)
                await loadProducts();
                console.log('✅ Successfully reloaded products from Database after migration');
            } catch (reloadError) {
                // If reload fails (timeout, etc.), use the products we just migrated
                console.warn('⚠️ Could not reload from Database after migration (this is okay):', reloadError.message);
                console.log('ℹ️ Using migrated products directly - they are already in Database');

                // Products are already in the products array from migration
                // Just refresh the display
            }

            displayProducts('all');

            showNotification(
                `Successfully migrated ${successCount} products from IndexedDB to Database! (${createCount} created, ${updateCount} updated, ${productsWithImages} with images)`,
                'success'
            );
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Migration error:', error);
        showNotification('Error migrating from IndexedDB: ' + error.message, 'error');
        return false;
    }
}

// Comprehensive function to check ALL storage facilities
async function checkAllStorageFacilities() {
    console.log('🔍 Checking ALL storage facilities for products...\n');
    console.log('═'.repeat(60));

    const results = {
        database: { available: false, count: 0, withImages: 0, products: [] },
        localStorage: { available: false, count: 0, withImages: 0, products: [] },
        indexedDB: { available: false, count: 0, withImages: 0, products: [] }
    };

    // Check Database
    console.log('\n📊 Checking Database (MariaDB)...');
    try {
        const backendAvailable = await apiService.checkBackend();
        if (backendAvailable) {
            try {
                const dbProducts = await apiService.getProducts('all');
                results.database.available = true;
                results.database.count = dbProducts ? dbProducts.length : 0;
                results.database.products = dbProducts || [];

                // Count products with images
                results.database.withImages = (dbProducts || []).filter(p => {
                    const img = p.image || '';
                    return img && img.trim().length > 0 &&
                        (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
                }).length;

                console.log(`   ✅ Database: ${results.database.count} products (${results.database.withImages} with images)`);

                if (results.database.count > 0) {
                    console.log(`   📦 Products:`, dbProducts.map(p => ({
                        id: p._id || p.id,
                        name: p.name,
                        size: p.size,
                        hasImage: !!(p.image && p.image.length > 0 && (p.image.startsWith('data:image/') || p.image.startsWith('http')))
                    })));
                }
            } catch (error) {
                // Check if it's an expected error (timeout, network, abort)
                const errorName = error.name || '';
                const errorMsg = error.message || '';

                const isExpectedError =
                    errorName === 'AbortError' ||
                    errorName === 'TypeError' ||
                    errorMsg.includes('aborted') ||
                    errorMsg.includes('Aborted') ||
                    errorMsg.includes('fetch') ||
                    errorMsg.includes('network') ||
                    errorMsg.includes('Network') ||
                    errorMsg.includes('timeout') ||
                    errorMsg.includes('Timeout');

                if (!isExpectedError) {
                    // Only log unexpected errors
                    console.log(`   ⚠️ Database: Backend available but error fetching products: ${error.message}`);
                } else {
                    // Handle expected errors (timeout, network issues)
                    if (errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
                        console.log(`   ⚠️ Database: Backend available but request timed out (20s)`);
                        console.log(`   ℹ️ This may be due to slow network or backend processing. Will retry automatically or use fallback storage.`);
                    } else {
                        console.log(`   ⚠️ Database: Backend available but error fetching products: ${error.message}`);
                    }
                    results.database.available = false;
                }
            }
        } else {
            console.log('   ❌ Database: Backend not available');
        }
    } catch (error) {
        console.log(`   ❌ Database: Error checking backend: ${error.message}`);
    }

    // Check localStorage
    console.log('\n📊 Checking localStorage...');
    try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            try {
                const localProducts = JSON.parse(savedProducts);
                results.localStorage.available = true;
                results.localStorage.count = localProducts ? localProducts.length : 0;
                results.localStorage.products = localProducts || [];

                // Count products with images
                results.localStorage.withImages = (localProducts || []).filter(p => {
                    const img = p.image || '';
                    return img && img.trim().length > 0 &&
                        (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
                }).length;

                console.log(`   ✅ localStorage: ${results.localStorage.count} products (${results.localStorage.withImages} with images)`);

                if (results.localStorage.count > 0) {
                    console.log(`   📦 Products:`, localProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        size: p.size,
                        hasImage: !!(p.image && p.image.length > 0 && (p.image.startsWith('data:image/') || p.image.startsWith('http')))
                    })));
                }
            } catch (error) {
                console.log(`   ❌ localStorage: Error parsing products: ${error.message}`);
            }
        } else {
            console.log('   ❌ localStorage: No products found');
        }
    } catch (error) {
        console.log(`   ❌ localStorage: Error checking: ${error.message}`);
    }

    // Check IndexedDB
    console.log('\n📊 Checking IndexedDB...');
    try {
        await storageManager.init();
        if (storageManager.useIndexedDB && storageManager.db) {
            const indexedProducts = await storageManager.loadProducts();
            if (indexedProducts && indexedProducts.length > 0) {
                results.indexedDB.available = true;
                results.indexedDB.count = indexedProducts.length;
                results.indexedDB.products = indexedProducts;

                // Count products with images
                results.indexedDB.withImages = indexedProducts.filter(p => {
                    const img = p.image || '';
                    return img && img.trim().length > 0 &&
                        (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
                }).length;

                console.log(`   ✅ IndexedDB: ${results.indexedDB.count} products (${results.indexedDB.withImages} with images)`);

                console.log(`   📦 Products:`, indexedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    size: p.size,
                    hasImage: !!(p.image && p.image.length > 0 && (p.image.startsWith('data:image/') || p.image.startsWith('http')))
                })));
            } else {
                console.log('   ❌ IndexedDB: No products found');
            }
        } else {
            console.log('   ❌ IndexedDB: Not available or not initialized');
        }
    } catch (error) {
        console.log(`   ❌ IndexedDB: Error checking: ${error.message}`);
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 STORAGE SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`\n📦 Database:      ${results.database.count} products (${results.database.withImages} with images) ${results.database.available ? '✅' : '❌'}`);
    console.log(`📦 localStorage: ${results.localStorage.count} products (${results.localStorage.withImages} with images) ${results.localStorage.available ? '✅' : '❌'}`);
    console.log(`📦 IndexedDB:    ${results.indexedDB.count} products (${results.indexedDB.withImages} with images) ${results.indexedDB.available ? '✅' : '❌'}`);

    const totalProducts = Math.max(
        results.database.count,
        results.localStorage.count,
        results.indexedDB.count
    );
    const totalWithImages = Math.max(
        results.database.withImages,
        results.localStorage.withImages,
        results.indexedDB.withImages
    );

    console.log(`\n📊 TOTAL: ${totalProducts} products found (${totalWithImages} with images)`);

    // Find unique products across all storage (using name+size as key since IDs may differ)
    const productMap = new Map(); // Map of product key to product data and sources
    const allProducts = [];

    // Helper function to create unique key
    const getProductKey = (p) => `${(p.name || '').toLowerCase().trim()}_${normalizeSize(p.size || 'M').toUpperCase().trim()}`;

    // Helper function to add product to map
    const addProduct = (p, source) => {
        const key = getProductKey(p);
        const id = p._id || p.id;

        if (!productMap.has(key)) {
            // New product - add to map
            productMap.set(key, {
                ...p,
                id: id,
                key: key,
                sources: [source],
                bestImage: p.image || '' // Keep the first image found
            });
        } else {
            // Existing product - add source and update image if needed
            const existing = productMap.get(key);
            if (!existing.sources.includes(source)) {
                existing.sources.push(source);
            }
            // Keep the image if current product has one and existing doesn't
            if (p.image && p.image.length > 0 && (!existing.bestImage || existing.bestImage.length === 0)) {
                existing.bestImage = p.image;
            }
        }
    };

    // Collect from Database
    results.database.products.forEach(p => {
        addProduct(p, 'Database');
    });

    // Collect from localStorage
    results.localStorage.products.forEach(p => {
        addProduct(p, 'localStorage');
    });

    // Collect from IndexedDB
    results.indexedDB.products.forEach(p => {
        addProduct(p, 'IndexedDB');
    });

    // Convert map to array
    productMap.forEach((product, key) => {
        allProducts.push({
            ...product,
            image: product.bestImage || product.image || '',
            source: product.sources.join(', ')
        });
    });

    console.log(`\n📊 UNIQUE PRODUCTS: ${allProducts.length} unique products across all storage`);

    if (allProducts.length > 0) {
        console.log('\n📦 All Products:');
        allProducts.forEach((p, index) => {
            const hasImage = !!(p.image && p.image.length > 0 && (p.image.startsWith('data:image/') || p.image.startsWith('http')));
            const sources = p.sources || [p.source];
            const sourceText = sources.length > 1 ? `Sources: ${sources.join(', ')}` : `Source: ${sources[0] || p.source}`;
            console.log(`   ${index + 1}. ${p.name} (Size: ${p.size || 'M'}) - ${hasImage ? '📷 Has Image' : '⚠️ No Image'} - ${sourceText}`);
        });
    }

    console.log('\n' + '═'.repeat(60));

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (results.indexedDB.count > 0 && results.database.count === 0) {
        console.log('   🔄 IndexedDB has products but Database is empty.');
        console.log('   💡 Run: migrateFromIndexedDBToDatabase() to migrate to Database');
    }
    if (results.localStorage.count > 0 && results.database.count === 0) {
        console.log('   🔄 localStorage has products but Database is empty.');
        console.log('   💡 Run: migrateProductsToDatabase() to migrate to Database');
    }
    if (results.indexedDB.count > results.localStorage.count) {
        console.log('   ⚠️ IndexedDB has more products than localStorage.');
        console.log('   💡 Consider migrating IndexedDB products to database');
    }
    if (results.database.count > 0) {
        console.log('   ✅ Database is active and has products - this is the preferred storage.');
    }

    console.log('\n' + '═'.repeat(60));

    return results;
}

// Unified function to sync products to storage locations (Database, IndexedDB cache)
// PRIORITY: Database is PRIMARY storage (permanent, centralized)
// IndexedDB is CACHE only (for offline access)
// localStorage is NOT used for products - only for UI data (cart, preferences)
async function syncProductsToAllStorage(productsToSync, options = {}) {
    const {
        skipDatabase = false,
        skipLocalStorage = true, // ALWAYS skip localStorage - only for UI data
        skipIndexedDB = false,
        preserveImages = true
    } = options;

    console.log(`🔄 [syncProductsToAllStorage] Syncing ${productsToSync.length} products...`);
    console.log(`   Database: ${skipDatabase ? '⏭️ Skipped' : '✅ Enabled (PRIMARY - permanent storage)'}`);
    console.log(`   localStorage: ⏭️ Skipped (ONLY for UI data: cart, preferences)`);
    console.log(`   IndexedDB: ${skipIndexedDB ? '⏭️ Skipped' : '✅ Enabled (CACHE - offline access)'}`);

    console.log('🔄 [syncProductsToAllStorage] Starting sync to all storage locations...');
    console.log('🔄 Products to sync:', productsToSync.length);

    const results = {
        database: { success: false, count: 0, error: null },
        localStorage: { success: false, count: 0, error: null },
        indexedDB: { success: false, count: 0, error: null }
    };

    // Prepare products array (ensure all have required fields)
    const productsToSave = productsToSync.map(p => ({
        id: p.id || p._id,
        name: p.name || '',
        category: p.category || 'dresses',
        price: p.price || 0,
        discount: p.discount || 0,
        quantity: p.quantity || 0,
        size: normalizeSize(p.size || 'M'),
        image: preserveImages ? (p.image || '') : ''
    }));

    // 1. Sync to Database (if backend is available and database is connected)
    if (!skipDatabase) {
        try {
            const backendAvailable = await apiService.checkBackend();
            if (backendAvailable) {
                // Check if Database is actually connected (not just backend available)
                try {
                    const dbStatus = await apiService.checkDatabaseStatus();
                    if (dbStatus.readyState !== 1) {
                        console.log('ℹ️ Database backend available but database not connected - skipping Database sync');
                        results.database.error = `Database not connected (ReadyState: ${dbStatus.readyState})`;
                        // Skip Database sync if database is not connected
                    } else {
                        console.log('🔄 Syncing to Database...');

                        // Load existing products from Database first
                        let existingProducts = [];
                        try {
                            existingProducts = await apiService.getProducts('all');
                            console.log(`📦 Found ${existingProducts.length} existing products in Database`);
                        } catch (error) {
                            console.warn('⚠️ Could not load existing products from Database:', error.message);
                            // Continue anyway - might be a network issue
                        }

                        // Create a map of existing products by name+size (for matching)
                        const existingProductsMap = new Map();
                        existingProducts.forEach(p => {
                            const key = `${(p.name || '').toLowerCase().trim()}_${normalizeSize(p.size || 'M').toUpperCase().trim()}`;
                            existingProductsMap.set(key, p);
                        });

                        let successCount = 0;
                        let failCount = 0;
                        let updateCount = 0;
                        let createCount = 0;

                        for (const product of productsToSave) {
                            try {
                                const productData = {
                                    name: product.name,
                                    category: product.category,
                                    price: product.price,
                                    discount: product.discount,
                                    quantity: product.quantity,
                                    size: product.size,
                                    image: product.image
                                };

                                // Try to match existing product by name+size first
                                const productKey = `${(product.name || '').toLowerCase().trim()}_${normalizeSize(product.size || 'M').toUpperCase().trim()}`;
                                const existingProduct = existingProductsMap.get(productKey);

                                if (existingProduct && existingProduct._id) {
                                    // Product exists in Database - update it
                                    await apiService.updateProduct(existingProduct._id, productData);
            console.log(`✅ API: Successfully updated product ${product.name} (${product.size}) in Database.`);
                                    // Update product ID with Database _id
                                    product.id = existingProduct._id;
                                    product._id = existingProduct._id;
                                    updateCount++;
                                    console.log(`✅ Updated product in Database: ${product.name} (${product.size})`);
                                } else if (product.id && typeof product.id === 'string' && (product.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(product.id) || product.id.startsWith('prod_'))) {
                                    // Product has Database ObjectId or prod_ ID - try to update existing
                                    try {
                                        await apiService.updateProduct(product.id, productData);
                                        updateCount++;
                                        console.log(`✅ Updated product in Database by ID: ${product.name}`);
                                    } catch (updateError) {
                                        // If update fails with 404 (Product not found), try to create it instead
                                        if (updateError.message && (updateError.message.includes('Product not found') || updateError.message.includes('404'))) {
                                            console.log(`⚠️ Product ID ${product.id} not found in Database, creating new...`);
                                            const created = await apiService.createProduct(productData);
                                            // Update product ID with new Database _id
                                            product.id = created._id || created.id || product.id;
                                            product._id = created._id || created.id;
                                            createCount++;
                                            console.log(`✅ Created product in Database (after update failed): ${product.name}`);
                                        } else {
                                            throw updateError; // Re-throw other update errors
                                        }
                                    }
                                } else {
                                    // New product or numeric ID not matching existing, try to create new
                                    try {
                                        const created = await apiService.createProduct(productData);
                                        // Update product ID with Database _id
                                        product.id = created._id || created.id || product.id;
                                        product._id = created._id || created.id;
                                        createCount++;
                                        console.log(`✅ Created product in Database: ${product.name} (${product.size})`);
                                    } catch (createError) {
                                        // If create fails (e.g., duplicate), try to find by name+size and update
                                        if (createError.message && createError.message.includes('duplicate')) {
                                            console.log(`⚠️ Duplicate product detected during creation, trying to find and update: ${product.name}`);
                                            // Try to find by name+size and update
                                            const found = existingProducts.find(p => {
                                                const key = `${(p.name || '').toLowerCase().trim()}_${normalizeSize(p.size || 'M').toUpperCase().trim()}`;
                                                return key === productKey;
                                            });
                                            if (found && found._id) {
                                                await apiService.updateProduct(found._id, productData);
                                                product.id = found._id;
                                                product._id = found._id;
                                                updateCount++;
                                                console.log(`✅ Updated duplicate product in Database: ${product.name}`);
                                            } else {
                                                throw createError; // If not found, re-throw original create error
                                            }
                                        } else {
                                            throw createError; // Re-throw other creation errors
                                        }
                                    }
                                }
                                successCount++;
                            } catch (error) {
                                // Only log if it's not a database connection error (we already handled that)
                                const errorMsg = error.message || error.toString() || '';
                                if (!errorMsg.includes('Database not connected') && !errorMsg.includes('Database connection')) {
                                    console.error('❌ Error syncing product to Database:', product.id, product.name, errorMsg);
                                } else {
                                    // Database connection error - stop trying to sync to Database
                                    console.log('⚠️ Database database not connected - stopping sync to Database');
                                    break; // Stop trying to sync remaining products
                                }
                                failCount++;
                            }
                        }

                            // No longer deleting products automatically
                            // Deletions should only be triggered by explicit admin actions.
                            // The sync process focuses on adding and updating products.

                        if (successCount > 0) {
                            results.database.success = true;
                            results.database.count = successCount;
                            console.log(`✅ Synced ${successCount} products to Database (${updateCount} updated, ${createCount} created)`);
                            if (failCount > 0) {
                                console.warn(`⚠️ ${failCount} products failed to sync to Database`);
                            }
                        } else { // No products were synced successfully (could be all failed)
                            results.database.error = `All ${productsToSave.length} products failed to sync`;
                            console.error('❌ Failed to sync any products to Database');
                        }
                    }
                } catch (dbStatusError) {
                    console.log('ℹ️ Could not check Database connection status - skipping Database sync');
                    results.database.error = 'Could not verify database connection';
                }
            } else {
                console.log('ℹ️ Database backend not available - skipping Database sync');
                results.database.error = 'Backend not available';
            }
        } catch (error) {
            console.error('❌ Database sync error:', error);
            results.database.error = error.message;
        }
    }

    // 2. Cache to IndexedDB (for offline access only - Database is PRIMARY)
    // NOTE: localStorage is NOT used for products - only for UI data (cart, preferences)
    if (!skipIndexedDB) {
        try {
            console.log('🔄 Caching to IndexedDB (for offline access only)...');
            // Initialize IndexedDB
            await storageManager.init();

            if (storageManager.useIndexedDB && storageManager.db) {
                // Cache to IndexedDB (Database is primary, this is just for offline access)
                const indexedResult = await storageManager.saveProducts(productsToSave);
                if (indexedResult) {
                    results.indexedDB.success = true;
                    results.indexedDB.count = productsToSave.length;
                    console.log(`✅ Cached ${productsToSave.length} products to IndexedDB (for offline access)`);
                } else {
                    results.indexedDB.error = 'Save operation returned false';
                    console.error('❌ IndexedDB cache save returned false');
                }
            } else {
                console.log('ℹ️ IndexedDB not available - skipping cache');
                results.indexedDB.error = 'IndexedDB not available';
            }
        } catch (error) {
            console.error('❌ IndexedDB cache error:', error);
            results.indexedDB.error = error.message;
        }
    }

    // 3. DO NOT sync to localStorage for products
    // localStorage is ONLY for UI-related data (cart, preferences, admin credentials)
    // Products are stored in Database (permanent storage) and cached in IndexedDB (offline access)
    if (!skipLocalStorage && false) { // Disabled - localStorage not used for products
        console.log('ℹ️ localStorage sync skipped - localStorage is ONLY for UI data (cart, preferences)');
        results.localStorage.error = 'Not used for products - only for UI data';
    }

    // Summary
    const totalSuccess = (results.database.success ? 1 : 0) +
        (results.indexedDB.success ? 1 : 0); // localStorage not counted - not used for products

    console.log('\n📊 Sync Summary:');
    console.log(`   Database:      ${results.database.success ? '✅' : '❌'} ${results.database.count} products ${results.database.error ? '(' + results.database.error + ')' : ''} (PRIMARY - permanent storage)`);
    console.log(`   IndexedDB:    ${results.indexedDB.success ? '✅' : '❌'} ${results.indexedDB.count} products ${results.indexedDB.error ? '(' + results.indexedDB.error + ')' : ''} (CACHE - offline access)`);
    console.log(`   localStorage: ⏭️ Not used for products (ONLY for UI data: cart, preferences)`);
    console.log(`   Total: ${totalSuccess}/2 storage locations synced successfully`);

    // Return success if Database succeeded (primary requirement)
    // IndexedDB cache is optional (for offline access)
    return {
        success: results.database.success, // Database is required for success
        results: results,
        products: productsToSave // Return updated products (with Database IDs if applicable)
    };
}


// Unified function to delete product from ALL storage locations (Database, localStorage, IndexedDB)
async function deleteProductFromAllStorage(productId) {
    console.log('🗑️ [deleteProductFromAllStorage] Starting deletion from all storage locations...');
    console.log('🗑️ Product ID:', productId);

    const results = {
        database: { success: false, error: null },
        localStorage: { success: false, error: null },
        indexedDB: { success: false, error: null }
    };

    // Helper function to compare IDs (handles both Database ObjectId, prod_ IDs, and numeric IDs)
    const compareIds = (id1, id2) => {
        // Handle Database ObjectId (24 char hex string) or prod_ IDs
        if ((typeof id1 === 'string' && (id1.length === 24 && /^[0-9a-fA-F]{24}$/.test(id1) || id1.startsWith('prod_'))) ||
            (typeof id2 === 'string' && (id2.length === 24 && /^[0-9a-fA-F]{24}$/.test(id2) || id2.startsWith('prod_')))) {
            return String(id1) === String(id2);
        }
        // Handle numeric IDs
        const id1Num = typeof id1 === 'string' ? parseInt(id1) : id1;
        const id2Num = typeof id2 === 'string' ? parseInt(id2) : id2;
        return id1Num === id2Num;
    };

    // 1. Delete from Database (if backend is available and database is connected)
    try {
        const backendAvailable = await apiService.checkBackend();
        if (backendAvailable) {
            // Check if Database is actually connected
            try {
                const dbStatus = await apiService.checkDatabaseStatus();
                if (dbStatus.readyState !== 1) {
                    console.log('ℹ️ Database backend available but database not connected - skipping Database deletion');
                    results.database.error = `Database not connected (ReadyState: ${dbStatus.readyState})`;
                } else {
                    console.log('🗑️ Deleting from Database...');

                    // Check if productId is a Database ObjectId (24 char hex string) or prod_ ID
                    if (typeof productId === 'string' && ((productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId)) || productId.startsWith('prod_'))) {
                        // Database ObjectId or prod_ ID - try to delete directly
                        try {
                            await apiService.deleteProduct(productId);
                            results.database.success = true;
                            console.log('✅ Product deleted from Database');
                        } catch (error) {
                            console.error('❌ Error deleting from Database:', error.message);
                            results.database.error = error.message;
                        }
                    } else {
                        // Numeric ID or other format - try to find product by name+size and delete
                        // Note: We need the product name and size to find it in Database
                        // For now, we'll skip Database deletion if ID is not a Database ObjectId or prod_ ID
                        // The product will be removed when we sync remaining products
                        console.log('ℹ️ Product ID is not a Database ObjectId or prod_ ID - will remove during sync of remaining products');
                        results.database.error = 'Invalid product ID format (not Database ObjectId or prod_ ID)';
                        // This is okay - the product will be removed when we sync remaining products
                    }
                }
            } catch (dbStatusError) {
                console.log('ℹ️ Could not check Database connection status - skipping Database deletion');
                results.database.error = 'Could not verify database connection';
            }
        } else {
            console.log('ℹ️ Database backend not available - skipping Database deletion');
            results.database.error = 'Backend not available';
        }
    } catch (error) {
        console.error('❌ Database delete error:', error);
        results.database.error = error.message;
    }

    // 2. Delete from localStorage
    try {
        console.log('🗑️ Deleting from localStorage...');
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            try {
                const parsed = JSON.parse(savedProducts);
                const filtered = parsed.filter(p => {
                    // Check both id and _id fields
                    return !compareIds(p.id, productId) && !compareIds(p._id, productId);
                });

                if (filtered.length < parsed.length) {
                    localStorage.setItem('products', JSON.stringify(filtered));
                    results.localStorage.success = true;
                    console.log(`✅ Product deleted from localStorage (${parsed.length} → ${filtered.length} products)`);
                } else {
                    console.log('ℹ️ Product not found in localStorage');
                    results.localStorage.success = true; // Not found, but operation succeeded
                }
            } catch (error) {
                console.error('❌ Error parsing localStorage products:', error);
                results.localStorage.error = error.message;
            }
        } else {
            console.log('ℹ️ No products in localStorage');
            results.localStorage.success = true; // No products, operation succeeded
        }
    } catch (error) {
        console.error('❌ localStorage delete error:', error);
        results.localStorage.error = error.message;
    }

    // 3. Delete from IndexedDB
    try {
        console.log('🗑️ Deleting from IndexedDB...');
        await storageManager.init();

        if (storageManager.useIndexedDB && storageManager.db) {
            try {
                // Load all products from IndexedDB to find the correct product to delete
                const indexedProducts = await storageManager.loadProducts();
                if (indexedProducts && indexedProducts.length > 0) {
                    // Find the product to delete (handle both Database ObjectId and numeric IDs)
                    const productToDelete = indexedProducts.find(p => {
                        return compareIds(p.id, productId) || compareIds(p._id, productId);
                    });

                    if (productToDelete) {
                        // Delete using the product's actual stored ID
                        const storedId = productToDelete.id;
                        await storageManager.deleteProduct(storedId);
                        results.indexedDB.success = true;
                        console.log(`✅ Product deleted from IndexedDB (ID: ${storedId})`);
                    } else {
                        console.log('ℹ️ Product not found in IndexedDB (may have already been deleted)');
                        results.indexedDB.success = true; // Not found, but operation succeeded
                    }
                } else {
                    console.log('ℹ️ No products in IndexedDB');
                    results.indexedDB.success = true; // No products, operation succeeded
                }
            } catch (error) {
                console.error('❌ Error deleting from IndexedDB:', error);
                results.indexedDB.error = error.message;
            }
        } else {
            console.log('ℹ️ IndexedDB not available - skipping IndexedDB deletion');
            results.indexedDB.error = 'IndexedDB not available';
        }
    } catch (error) {
        console.error('❌ IndexedDB delete error:', error);
        results.indexedDB.error = error.message;
    }

    // Summary
    const totalSuccess = (results.database.success ? 1 : 0) +
        (results.localStorage.success ? 1 : 0) +
        (results.indexedDB.success ? 1 : 0);

    console.log('\n📊 Delete Summary:');
    console.log(`   Database:      ${results.database.success ? '✅' : '❌'} ${results.database.error ? '(' + results.database.error + ')' : ''}`);
    console.log(`   localStorage: ${results.localStorage.success ? '✅' : '❌'} ${results.localStorage.error ? '(' + results.localStorage.error + ')' : ''}`);
    console.log(`   IndexedDB:    ${results.indexedDB.success ? '✅' : '❌'} ${results.indexedDB.error ? '(' + results.indexedDB.error + ')' : ''}`);
    console.log(`   Total: ${totalSuccess}/3 storage locations deleted successfully`);

    // Return success if at least one storage location succeeded
    return {
        success: totalSuccess > 0,
        results: results
    };
}

// Make migration functions available globally
if (typeof window !== 'undefined') {
    window.migrateProductsToDatabase = migrateProductsToDatabase;
    window.recoverFromIndexedDB = recoverFromIndexedDB;
    window.migrateFromIndexedDBToDatabase = migrateFromIndexedDBToDatabase;
    window.checkAllStorageFacilities = checkAllStorageFacilities;
    window.syncProductsToAllStorage = syncProductsToAllStorage;
    window.deleteProductFromAllStorage = deleteProductFromAllStorage;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check if Database backend is available
    const backendAvailable = await apiService.checkBackend();
    
    if (backendAvailable) {
        console.log('✅ Database backend is available - using API');
        localStorage.setItem('useDatabase', 'true');
        useDatabase = true;

        // Check Database connection status
        try {
            const dbStatus = await apiService.checkDatabaseStatus();
            if (dbStatus.readyState === 1) {
                console.log('✅ Database is connected and ready');
                console.log(`📊 Database: ${dbStatus.name || 'trendy-dresses'}`);
                console.log(`🔗 Host: ${dbStatus.host || 'connected'}`);

                // Sync orders from Database to localStorage (to prevent duplicate M-Pesa codes)
                try {
                    await syncOrdersFromDatabase();
                } catch (syncError) {
                    console.error('❌ Error syncing orders:', syncError);
                    // Continue even if sync fails
                }
            } else {
                console.warn(`⚠️ Database connection status: ${dbStatus.readyStateText} (ReadyState: ${dbStatus.readyState})`);
                console.warn('⚠️ Server may still be connecting or Database is not connected');
                console.warn('⚠️ Website will use localStorage until Database connects');
            }
        } catch (error) {
            // Silently handle - backend check already failed
        }
    } else {
        // Backend not available - show warning and instructions
        localStorage.setItem('useDatabase', 'false');
        localStorage.setItem('preferredStorage', 'database'); // Keep preference as Database

        // Initialize IndexedDB to check for products
        await storageManager.init();

        // Check IndexedDB for products
        if (storageManager.useIndexedDB && storageManager.db) {
            try {
                const indexedProducts = await storageManager.loadProducts();
                if (indexedProducts && indexedProducts.length > 0) {
                    const productsWithImages = indexedProducts.filter(p => {
                        const img = p.image || '';
                        return img && img.trim().length > 0 &&
                            (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
                    }).length;

                    console.log(`\n💡 ========================================`);
                    console.log(`💡 INDEXEDDB PRODUCTS FOUND`);
                    console.log(`💡 ========================================`);
                    console.log(`💡 Found ${indexedProducts.length} products in IndexedDB`);
                    console.log(`💡 ${productsWithImages} products have images`);
                    console.log(`💡 These products will be loaded automatically`);
                    console.log(`💡 To migrate to Database, start backend server and run:`);
                    console.log(`💡    migrateFromIndexedDBToDatabase()`);
                    console.log(`💡 ========================================\n`);
                }
            } catch (error) {
                console.error('❌ Error checking IndexedDB:', error);
            }
        }

        console.warn('⚠️ Database backend not available');
        console.warn('⚠️ To use Database:');
        console.warn('   1. Navigate to the "backend" folder');
        console.warn('   2. Run: npm start');
        console.warn('   3. Wait for "✅ Connected to Database successfully"');
        console.warn('   4. Refresh this page');
        console.log('ℹ️ Currently using localStorage/IndexedDB as fallback (temporary)');
    }

    loadCart(); // Load cart (UI data - localStorage OK)
    await loadProducts(); // Load products from Database API using fetch() - NOT localStorage

    // START PERIODIC POLLING FOR STOCK SYNC
    // This ensures stock levels are synced across all devices every 60 seconds
    setInterval(async () => {
        // Only poll if the tab is active/visible to save resources
        if (document.visibilityState === 'visible') {
            console.log('🔄 Periodic sync: Refreshing products from server...');
            try {
                // Use a silent load
                await loadProducts();
            } catch (pollError) {
                console.warn('⚠️ Periodic sync failed:', pollError.message);
            }
        }
    }, 60000); // Poll every 60 seconds

    // Automatically check all storage facilities for products
    console.log('\n💡 ========================================');
    console.log('💡 To check ALL storage facilities, run:');
    console.log('💡    checkAllStorageFacilities()');
    console.log('💡 ========================================\n');

    // Run automatic check (can be disabled if too verbose)
    try {
        await checkAllStorageFacilities();
    } catch (error) {
        console.error('❌ Error checking storage facilities:', error);
    }

    // Check if we should offer migration (when backend is available)
    if (backendAvailable) {
        // Check localStorage
        const hasLocalProducts = localStorage.getItem('products');
        let localProducts = [];
        if (hasLocalProducts) {
            try {
                localProducts = JSON.parse(hasLocalProducts);
            } catch (error) {
                // Ignore parsing errors
            }
        }

        // Check IndexedDB
        let indexedProducts = [];
        try {
            if (storageManager.useIndexedDB && storageManager.db) {
                indexedProducts = await storageManager.loadProducts();
            } else {
                await storageManager.init();
                if (storageManager.useIndexedDB && storageManager.db) {
                    indexedProducts = await storageManager.loadProducts();
                }
            }
        } catch (error) {
            // Ignore IndexedDB errors
        }

        // Determine which source has the most products
        const localCount = localProducts.length;
        const indexedCount = indexedProducts ? indexedProducts.length : 0;
        const maxCount = Math.max(localCount, indexedCount);

        if (maxCount > 0) {
            try {
                const dbProducts = await apiService.getProducts('all');
                const mongoCount = dbProducts ? dbProducts.length : 0;

                if (mongoCount === 0) {
                    console.log(`\n💡 ========================================`);
                    console.log(`💡 MIGRATION AVAILABLE`);
                    console.log(`💡 ========================================`);
                    if (indexedCount > localCount && indexedCount > 0) {
                        const indexedWithImages = indexedProducts.filter(p => {
                            const img = p.image || '';
                            return img && img.trim().length > 0 &&
                                (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
                        }).length;
                        console.log(`💡 You have ${indexedCount} products in IndexedDB (${indexedWithImages} with images) but Database is empty.`);
                        console.log(`💡 To migrate ALL products from IndexedDB to Database, run:`);
                        console.log(`💡    migrateFromIndexedDBToDatabase()`);
                    } else if (localCount > 0) {
                        console.log(`💡 You have ${localCount} products in localStorage but Database is empty.`);
                        console.log(`💡 To migrate ALL products to Database, run:`);
                        console.log(`💡    migrateProductsToDatabase()`);
                    }
                    console.log(`💡 Or open browser console (F12) and type the migration function`);
                    console.log(`💡 ========================================\n`);
                } else if (maxCount > mongoCount) {
                    console.log(`\n💡 ========================================`);
                    console.log(`💡 MIGRATION AVAILABLE`);
                    console.log(`💡 ========================================`);
                    if (indexedCount > localCount && indexedCount > 0) {
                        console.log(`💡 You have ${indexedCount} products in IndexedDB and ${mongoCount} in Database.`);
                        console.log(`💡 To migrate/merge from IndexedDB to Database, run:`);
                        console.log(`💡    migrateFromIndexedDBToDatabase()`);
                    } else if (localCount > 0) {
                        console.log(`💡 You have ${localCount} products in localStorage and ${mongoCount} in Database.`);
                        console.log(`💡 To migrate/merge to Database, run:`);
                        console.log(`💡    migrateProductsToDatabase()`);
                    }
                    console.log(`💡 This will update existing products and add new ones.`);
                    console.log(`💡 ========================================\n`);
                } else if (maxCount > 0) {
                    if (indexedCount > 0 && indexedCount > localCount) {
                        console.log(`\n💡 You have ${indexedCount} products in IndexedDB.`);
                        console.log(`💡 To migrate them to Database, run: migrateFromIndexedDBToDatabase()`);
                    } else if (localCount > 0) {
                        console.log(`\n💡 You have ${localCount} products in localStorage.`);
                        console.log(`💡 To migrate them to Database, run: migrateProductsToDatabase()`);
                    }
                }
            } catch (error) {
                // Database might be empty or not accessible
                console.log(`\n💡 ========================================`);
                console.log(`💡 MIGRATION AVAILABLE`);
                console.log(`💡 ========================================`);
                if (indexedCount > localCount && indexedCount > 0) {
                    console.log(`💡 You have ${indexedCount} products in IndexedDB.`);
                    console.log(`💡 To migrate ALL products from IndexedDB to Database, run:`);
                    console.log(`💡    migrateFromIndexedDBToDatabase()`);
                } else if (localCount > 0) {
                    console.log(`💡 You have ${localProducts.length} products in localStorage.`);
                    console.log(`💡 To migrate ALL products to Database, run:`);
                    console.log(`💡    migrateProductsToDatabase()`);
                }
                console.log(`💡 ========================================\n`);
            }
        }
    }

    // Verify products were loaded before displaying
    console.log('🔍 After loadProducts - products array length:', products.length);
    console.log('🔍 After loadProducts - product IDs:', products.map(p => p.id));

    // If no products exist in database, show empty state — do NOT reinitialize fake products
    if (products.length === 0) {
        console.log('ℹ️ No products found in storage. Products grid will show empty state.');
    }

    // Always display products - this ensures visibility
    console.log('🔄 Displaying products...');
    displayProducts('all');

    // Final verification after display
    setTimeout(() => {
        console.log('🔍 Final check - products array length:', products.length);
        console.log('🔍 Final check - products visible in DOM:', document.getElementById('productsGrid')?.children.length || 0);
        const productsGrid = document.getElementById('productsGrid');
        if (products.length > 0 && (!productsGrid || productsGrid.children.length === 0)) {
            console.error('❌ CRITICAL: Products loaded but not visible in DOM!');
            console.error('❌ Attempting to re-display products...');
            displayProducts('all');
            // Force a second attempt after a short delay
            setTimeout(() => {
                if (productsGrid && productsGrid.children.length === 0) {
                    console.error('❌ Second attempt failed. Forcing display...');
                    displayProducts('all');
                }
            }, 1000);
        } else if (products.length > 0 && productsGrid && productsGrid.children.length > 0) {
            console.log('✅ SUCCESS: Products are visible in DOM!');
        }
    }, 500);

    setupEventListeners();
    loadCart();
    loadWebsiteContent().catch(error => console.warn('⚠️ Error loading website content:', error));
    checkAdminStatus();
    updateContactDisplay();
    updateWebsiteIcon(); // Load website icon

    // Check storage usage on load (only if not using Database)
    if (!useDatabase) {
        setTimeout(async () => {
            console.warn('⚠️ Using localStorage (temporary) - Database is preferred');
            console.warn('⚠️ Deploy PHP backend to use Database for unlimited storage');
            const storageInfo = await checkStorageUsage();
            if (storageInfo.warning) {
                console.warn(`⚠️ Storage Usage: ${storageInfo.size.toFixed(2)}MB / ${storageInfo.quota.toFixed(2)}MB limit`);
                console.warn('⚠️ Database provides unlimited storage - start backend server to use it');
            } else {
                console.log(`ℹ️ Storage: ${storageInfo.size.toFixed(2)}MB used / ${storageInfo.quota.toFixed(2)}MB available (${storageInfo.type})`);
                console.log('💡 Switch to Database for unlimited storage');
            }
        }, 1000);
    } else {
        console.log('✅ Using Database - unlimited storage, no quota limits');
    }
});

// Size mapping configuration
const SIZE_MAPPING = {
    'M': { label: 'M', sizes: ['38', '10'], display: 'M (38, 10)' },
    'L': { label: 'L', sizes: ['40', '12'], display: 'L (40, 12)' },
    'XL': { label: 'XL', sizes: ['42/44', '14'], display: 'XL (42/44, 14)' },
    '2XL': { label: '2XL', sizes: ['46', '16'], display: '2XL (46, 16)' },
    '3XL': { label: '3XL', sizes: ['48/50', '18'], display: '3XL (48/50, 18)' },
    '4XL': { label: '4XL', sizes: ['52/54', '20'], display: '4XL (52/54, 20)' },
    '5XL': { label: '5XL', sizes: ['54/56', '22'], display: '5XL (54/56, 22)' },
    '6XL': { label: '6XL', sizes: ['24'], display: '6XL (24)' },
    // Support for old sizes and numeric values
    'S': { label: 'S', sizes: ['S'], display: 'S' },
    '38': { label: 'M', sizes: ['38', '10'], display: 'M (38, 10)' },
    '40': { label: 'L', sizes: ['40', '12'], display: 'L (40, 12)' },
    '10': { label: 'M', sizes: ['38', '10'], display: 'M (38, 10)' },
    '12': { label: 'L', sizes: ['40', '12'], display: 'L (40, 12)' },
    '14': { label: 'XL', sizes: ['42/44', '14'], display: 'XL (42/44, 14)' },
    '16': { label: '2XL', sizes: ['46', '16'], display: '2XL (46, 16)' },
    '18': { label: '3XL', sizes: ['48/50', '18'], display: '3XL (48/50, 18)' },
    '20': { label: '4XL', sizes: ['52/54', '20'], display: '4XL (52/54, 20)' },
    '22': { label: '5XL', sizes: ['54/56', '22'], display: '5XL (54/56, 22)' },
    '24': { label: '6XL', sizes: ['24'], display: '6XL (24)' },
    '42/44': { label: 'XL', sizes: ['42/44', '14'], display: 'XL (42/44, 14)' },
    '46': { label: '2XL', sizes: ['46', '16'], display: '2XL (46, 16)' },
    '48/50': { label: '3XL', sizes: ['48/50', '18'], display: '3XL (48/50, 18)' },
    '52/54': { label: '4XL', sizes: ['52/54', '20'], display: '4XL (52/54, 20)' },
    '54/56': { label: '5XL', sizes: ['54/56', '22'], display: '5XL (54/56, 22)' }
};

// Get size display label
function getSizeDisplay(size) {
    if (!size) return 'N/A';
    const sizeKey = size.toString().toUpperCase().trim();
    if (SIZE_MAPPING[sizeKey]) {
        return SIZE_MAPPING[sizeKey].display;
    }
    // If size contains any of the mapped values, use the mapping
    for (const [key, value] of Object.entries(SIZE_MAPPING)) {
        if (value.sizes.some(s => sizeKey.includes(s.toUpperCase()))) {
            return value.display;
        }
    }
    return size; // Return as-is if no mapping found
}

// Normalize size for storage (always store as S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL)
function normalizeSize(size) {
    if (!size) return 'M';
    const sizeKey = size.toString().toUpperCase().trim();

    // Check direct mapping first (exact match)
    if (SIZE_MAPPING[sizeKey]) {
        return SIZE_MAPPING[sizeKey].label;
    }

    // Check for combined sizes first (most specific)
    if (sizeKey.includes('54/56') || sizeKey.includes('56')) return '5XL';
    if (sizeKey.includes('52/54') || sizeKey.includes('52')) return '4XL';
    if (sizeKey.includes('48/50') || (sizeKey.includes('48') && sizeKey.includes('50'))) return '3XL';
    if (sizeKey.includes('42/44') || (sizeKey.includes('42') && sizeKey.includes('44'))) return 'XL';

    // Check for individual numeric values (check from largest to smallest to avoid conflicts)
    if (sizeKey === '24') return '6XL';
    if (sizeKey === '22' && !sizeKey.includes('44') && !sizeKey.includes('56')) return '5XL'; // 22 alone is 5XL
    if (sizeKey === '20') return '4XL';
    if (sizeKey === '18') return '3XL';
    if (sizeKey === '16') return '2XL';
    if (sizeKey === '14') return 'XL';
    if (sizeKey === '12') return 'L';
    if (sizeKey === '10') return 'M';

    // Check for individual numeric values in string format
    if (sizeKey.includes('46')) return '2XL';
    if (sizeKey.includes('48') || sizeKey.includes('50')) return '3XL';
    if (sizeKey.includes('52') || sizeKey.includes('54')) {
        // Distinguish between 4XL (52/54) and 5XL (54/56)
        if (sizeKey.includes('56')) return '5XL';
        return '4XL';
    }
    if (sizeKey.includes('42') || sizeKey.includes('44')) {
        // Distinguish between XL (42/44) and other sizes
        if (sizeKey.includes('42') && sizeKey.includes('44')) return 'XL';
        if (sizeKey.includes('44') && !sizeKey.includes('22') && !sizeKey.includes('52')) return 'XL';
        return 'XL';
    }
    if (sizeKey.includes('40')) return 'L';
    if (sizeKey.includes('38')) return 'M';

    // Check for size labels
    if (sizeKey === 'S' || sizeKey === 'SMALL') return 'S';
    if (sizeKey === 'M' || sizeKey === 'MEDIUM') return 'M';
    if (sizeKey === 'L' || sizeKey === 'LARGE') return 'L';
    if (sizeKey === 'XL' || sizeKey === 'EXTRA LARGE' || sizeKey === 'EXTRALARGE') return 'XL';
    if (sizeKey === '2XL' || sizeKey === 'XXL') return '2XL';
    if (sizeKey === '3XL' || sizeKey === 'XXXL') return '3XL';
    if (sizeKey === '4XL') return '4XL';
    if (sizeKey === '5XL') return '5XL';
    if (sizeKey === '6XL') return '6XL';

    // Default to M if unknown
    return sizeKey || 'M';
}

// Get display name for category
function getCategoryDisplayName(category) {
    const categoryMap = {
        'dresses': 'Dresses',
        'tracksuits': 'Tracksuits',
        'others': 'Others',
        'khaki-pants-jeans': 'Khaki Pants & Jeans'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}

// Lazy load product images in background (optimization for faster initial page load)
// Optimized lazy image loading with batching and caching
async function loadProductImagesLazy(products) {
    try {
        const useDatabase = localStorage.getItem('useDatabase') === 'true';
        if (!useDatabase) {
            // If not using Database, images should already be in localStorage
            return;
        }

        // Filter products that need images loaded
        const productsNeedingImages = products.filter(p => {
            const hasImageFlag = p.hasImage === true;
            const noImageData = !p.image || p.image.trim() === '';
            return hasImageFlag && noImageData;
        });

        if (productsNeedingImages.length === 0) {
            return; // All images already loaded
        }

        console.log(`🖼️ Loading images for ${productsNeedingImages.length} products in background...`);

        // Load images in larger batches for faster loading
        const batchSize = 10; // Increased batch size for faster loading
        let lastUpdateTime = Date.now();

        for (let i = 0; i < productsNeedingImages.length; i += batchSize) {
            const batch = productsNeedingImages.slice(i, i + batchSize);

            // Load images for this batch in parallel
            await Promise.all(batch.map(async (product) => {
                try {
                    const productId = product._id || product.id;
                    if (!productId) return;

                    // Fetch full product with image
                    const fullProduct = await apiService.getProduct(productId);
                    if (fullProduct && fullProduct.image) {
                        // Update product in products array
                        const productIndex = products.findIndex(p =>
                            (p._id || p.id) === productId
                        );
                        if (productIndex !== -1) {
                            products[productIndex].image = fullProduct.image;
                        }
                    }
                } catch (imgError) {
                    // Silently fail - image will remain empty
                    console.warn(`⚠️ Failed to load image for product ${product.name}:`, imgError.message);
                }
            }));

            // Throttle display updates - only update every 500ms to avoid excessive re-renders
            const now = Date.now();
            if (now - lastUpdateTime > 500) {
                displayProducts(currentCategory);
                lastUpdateTime = now;
            }
        }

        // Final display update
        displayProducts(currentCategory);

        console.log(`✅ Finished loading product images in background`);
    } catch (error) {
        console.warn('⚠️ Error in lazy image loading:', error.message);
        // Don't throw - this is a background optimization
    }
}

// Calculate final price with discount
function getFinalPrice(product) {
    const discount = product.discount || 0;
    if (discount > 0) {
        return product.price * (1 - discount / 100);
    }
    return product.price;
}

// Display Products - Shows ALL products without any limits
function displayProducts(filterCategory = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    const sectionTitle = document.querySelector('.section-title');

    // Check if productsGrid exists
    if (!productsGrid) {
        console.error('[displayProducts] productsGrid element not found');
        return;
    }

    // Filter products by category (no limits - shows ALL)
    const filteredProducts = filterCategory === 'all'
        ? products
        : products.filter(p => p.category === filterCategory);

    // Update section title with product count (only visible to admin)
    if (sectionTitle) {
        const categoryName = filterCategory === 'all'
            ? 'All Products'
            : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1);
        const count = filteredProducts.length;
        // Only show product count if admin is logged in
        if (isAdmin) {
            sectionTitle.innerHTML = `${categoryName} <span style="font-size: 1.2rem; color: var(--primary-color);">(${count} items)</span>`;
        } else {
            sectionTitle.innerHTML = categoryName;
        }
    }

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No products found in this category.</p>';
        return;
    }

    // Clear the grid first
    productsGrid.innerHTML = '';

    // Group products by name (case-insensitive)
    const groupedProducts = {};
    filteredProducts.forEach(product => {
        const nameKey = product.name.toLowerCase().trim();
        if (!groupedProducts[nameKey]) {
            groupedProducts[nameKey] = [];
        }
        groupedProducts[nameKey].push(product);
    });

    // Display grouped products one by one
    const groupedCount = Object.keys(groupedProducts).length;
    const productGroups = Object.values(groupedProducts);

    // Render products with staggered animation
    productGroups.forEach((productGroup, index) => {
        // Use first product for main info (image, price, category)
        const mainProduct = productGroup[0];
        const discount = mainProduct.discount || 0;
        const finalPrice = getFinalPrice(mainProduct);
        const hasDiscount = discount > 0;

        // Sort sizes for better display (S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL order)
        const sizeOrder = { 'S': 0, 'M': 1, 'L': 2, 'XL': 3, '2XL': 4, '3XL': 5, '4XL': 6, '5XL': 7, '6XL': 8 };
        productGroup.sort((a, b) => {
            const sizeA = normalizeSize(a.size || 'M');
            const sizeB = normalizeSize(b.size || 'M');
            const orderA = sizeOrder[sizeA] || 99;
            const orderB = sizeOrder[sizeB] || 99;
            return orderA - orderB;
        });

        // Calculate total stock across all sizes
        const totalStock = productGroup.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const hasAnyStock = totalStock > 0;

        // Generate size options HTML - compact version
        const sizeOptions = productGroup.map(p => {
            const sizeQty = p.quantity || 0;
            const sizeAvailable = sizeQty > 0;
            return `
                <div class="size-option ${sizeAvailable ? 'available' : 'sold-out'}" 
                     onclick="${sizeAvailable ? `selectSizeAndAddToCart('${p.id}')` : ''}"
                     style="
                         padding: 5px 8px;
                         border: 2px solid ${sizeAvailable ? '#4caf50' : '#ddd'};
                         border-radius: 4px;
                         cursor: ${sizeAvailable ? 'pointer' : 'not-allowed'};
                         background: ${sizeAvailable ? '#f0f8f0' : '#f5f5f5'};
                         color: ${sizeAvailable ? '#333' : '#999'};
                         text-align: center;
                         transition: all 0.2s;
                         font-size: 0.75rem;
                         font-weight: bold;
                     "
                     onmouseover="${sizeAvailable ? 'this.style.background=\'#e8f5e9\'; this.style.borderColor=\'#4caf50\'; this.style.transform=\'scale(1.1)\';' : ''}"
                     onmouseout="${sizeAvailable ? 'this.style.background=\'#f0f8f0\'; this.style.borderColor=\'#4caf50\'; this.style.transform=\'scale(1)\';' : ''}">
                    ${getSizeDisplay(p.size)}
                </div>
            `;
        }).join('');

        // Get background image style - ensure proper scaling for all products
        // Calculate overlay height based on image to ensure consistent card sizes
        let bgImageStyle;
        let overlayHeight = '15%'; // Default overlay height

        // Check if image exists and is valid
        const imageValue = mainProduct.image || '';
        const isFromDatabase = useDatabase && mainProduct.id && !isNaN(mainProduct.id);
        
        // A product needs lazy loading if:
        // 1. It came from the Database AND we don't have the image data yet
        // 2. OR it has a valid-looking URL but isn't loaded
        const hasValidImage = imageValue && imageValue.trim().length > 0 &&
            (imageValue.startsWith('data:image/') || imageValue.startsWith('http://') || imageValue.startsWith('https://'));
            
        const needsLazyLoad = isFromDatabase && !hasValidImage;

        if (hasValidImage) {
            // Escape single quotes in image URL to prevent CSS issues
            const escapedImage = imageValue.replace(/'/g, "\\'");
            bgImageStyle = `background-image: url('${escapedImage}'); background-size: cover; background-position: center; background-repeat: no-repeat; transition: transform 0.5s ease, background-size 0.5s ease;`;
            overlayHeight = '15%';
        } else {
            // Use gradient with proper scaling for initial products
            bgImageStyle = `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-size: cover; background-position: center; transition: transform 0.5s ease, background-size 0.5s ease;`;
            overlayHeight = '15%'; // Default for products without images
            // Log missing image for debugging
            if (imageValue && imageValue.trim().length > 0) {
                console.warn(`⚠️ Product "${mainProduct.name}" has invalid image format:`, imageValue.substring(0, 50));
            }
        }

        // Generate unique ID for this product card
        const cardId = `product-card-${mainProduct.id}`;

        // Add placeholder icon display if no image (reuse imageValue from above)
        const hasImage = hasValidImage;
        const placeholderDisplay = '';

        // Create product HTML
        const productHTML = `
        <div class="product-card ${!hasAnyStock ? 'sold-out' : ''}" 
             id="${cardId}"
             style="${bgImageStyle} position: relative; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; cursor: pointer;"
             onmouseenter="this.style.transform='scale(1.05)'; this.style.backgroundSize='110%'; this.querySelector('.product-info-overlay').style.transform='translateY(0)';"
             onmouseleave="this.style.transform='scale(1)'; this.style.backgroundSize='cover'; this.querySelector('.product-info-overlay').style.transform='translateY(10px)';">
            
            ${placeholderDisplay}
            
            ${!hasAnyStock ? `
            <!-- Diagonal SOLD overlay -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4rem;
                font-weight: bold;
                color: rgba(255, 0, 0, 0.9);
                background: linear-gradient(to bottom right, rgba(255, 0, 0, 0.4) 0%, rgba(255, 0, 0, 0.2) 50%, rgba(255, 0, 0, 0.4) 100%);
                transform: rotate(-45deg);
                transform-origin: center;
                z-index: 5;
                pointer-events: none;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.7);
                letter-spacing: 12px;
                -webkit-text-stroke: 3px rgba(255, 255, 255, 0.9);
                text-stroke: 3px rgba(255, 255, 255, 0.9);
            ">SOLD</div>
            ` : ''}
            
            <!-- Badges -->
            <div style="position: absolute; top: 15px; right: 15px; z-index: 10; display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                ${!hasAnyStock ? `<div class="sold-out-badge">SOLD OUT</div>` : ''}
                ${hasDiscount ? `<div class="discount-badge">-${discount}%</div>` : ''}
            </div>
            
            <!-- Product Info Overlay - consistent size for all products (image is 85%) -->
            <div class="product-info-overlay product-info" style="
                position: relative;
                z-index: 2;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                padding: 14px 16px;
                border-radius: 15px 15px 0 0;
                margin-top: auto;
                transform: translateY(10px);
                transition: transform 0.3s ease;
                box-shadow: 0 -3px 15px rgba(0,0,0,0.2);
                min-height: ${overlayHeight};
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 180px;">
                        <div class="product-category" style="color: var(--primary-color); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${getCategoryDisplayName(mainProduct.category)}</div>
                        <div class="product-name" style="font-size: 1rem; font-weight: bold; color: var(--dark-color); margin-bottom: 8px; line-height: 1.2;">${mainProduct.name}</div>
                        <div style="margin: 8px 0;">
                            <div style="font-size: 0.7rem; color: #666; margin-bottom: 6px; font-weight: 500;">
                                <i class="fas fa-ruler"></i> Select Size:
                </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(50px, 1fr)); gap: 6px;">
                                ${sizeOptions}
                    </div>
                        </div>
                    </div>
                    
                    <div style="text-align: right; flex-shrink: 0;">
                        <div class="product-price" style="margin-bottom: 5px;">
                    ${hasDiscount ? `
                                <div style="text-decoration: line-through; color: #999; font-size: 0.75rem; margin-bottom: 2px;">
                                    KSh ${mainProduct.price.toLocaleString('en-KE')}
                                </div>
                                <div style="color: var(--primary-color); font-weight: bold; font-size: 1.1rem;">
                            KSh ${Math.round(finalPrice).toLocaleString('en-KE')}
                                </div>
                    ` : `
                                <div style="font-size: 1.1rem; font-weight: bold; color: var(--primary-color);">KSh ${mainProduct.price.toLocaleString('en-KE')}</div>
                    `}
                </div>
                        ${hasAnyStock ? `
                            <div style="color: #666; font-size: 0.7rem; margin-top: 5px;">
                                <i class="fas fa-box"></i> <strong>${totalStock}</strong> in stock
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        `;

        // Render immediately — no stagger delay
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = productHTML.trim();
        const productCard = tempDiv.firstChild;

        // Fade-in on first paint (no delay)
        productCard.style.opacity = '0';
        productCard.style.transition = 'opacity 0.25s ease';
        productsGrid.appendChild(productCard);
        requestAnimationFrame(() => { productCard.style.opacity = '1'; });

        // Lazy-load the actual image only when the card enters the viewport
        if (hasValidImage || needsLazyLoad) {
            // Store actual image URL OR marker for API fetch as a data attribute
            productCard.dataset.bgImage = hasValidImage ? imageValue : 'fetch-from-api';
            productCard.dataset.productId = mainProduct.id;
            productCard.style.backgroundImage = '';
            productCard.style.background = 'linear-gradient(135deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)';
            productCard.style.backgroundSize = '400% 400%';
            productCard.style.animation = 'shimmer 1.5s infinite';
            productCard.classList.add('img-lazy-pending');
        }
    });

    // Intersection Observer: load image when card scrolls into view
    if (!window._lazyImgObserver) {
        window._lazyImgObserver = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    let imgSrc = card.dataset.bgImage;
                    const productId = card.dataset.productId;
                    
                    if (imgSrc) {
                        try {
                            // If we need to fetch from API, do it now
                            if (imgSrc === 'fetch-from-api' && productId) {
                                console.log(`🖼️ Lazy fetching image for product#${productId}...`);
                                const productData = await apiService.getProduct(productId);
                                if (productData && productData.image) {
                                    imgSrc = productData.image;
                                    // Cache it in the main products array for future filter/re-render
                                    const pIndex = products.findIndex(p => p.id == productId);
                                    if (pIndex !== -1) products[pIndex].image = imgSrc;
                                } else {
                                    imgSrc = ''; // No image available
                                }
                            }
                            
                            if (imgSrc) {
                                // Preload via Image object, then apply — prevents FOUC
                                const img = new Image();
                                img.onload = () => {
                                    card.style.animation = '';
                                    card.style.backgroundSize = 'cover';
                                    card.style.backgroundPosition = 'center';
                                    card.style.backgroundRepeat = 'no-repeat';
                                    card.style.backgroundImage = `url('${imgSrc.replace(/'/g, "\\'")}')`;
                                    card.classList.remove('img-lazy-pending');
                                };
                                img.src = imgSrc;
                            } else {
                                // No image found - use fallback gradient
                                card.style.animation = '';
                                card.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                card.classList.remove('img-lazy-pending');
                            }
                        } catch (error) {
                            console.error('❌ Error lazy-loading image:', error);
                            card.style.animation = '';
                        }
                        
                        delete card.dataset.bgImage;
                        delete card.dataset.productId;
                    }
                    window._lazyImgObserver.unobserve(card);
                }
            });
        }, { rootMargin: '200px' }); // start loading 200px before card enters view
    }
    // Observe all lazy-pending cards
    productsGrid.querySelectorAll('.img-lazy-pending').forEach(card => {
        window._lazyImgObserver.observe(card);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Category filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            currentCategory = category;
            displayProducts(category);
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// Select size and add to cart (for grouped products)
function selectSizeAndAddToCart(productId) {
    addToCart(productId);
}

// Add to Cart
function addToCart(productId) {
    // Handle both Database IDs (string), numeric IDs, and string IDs (e.g. prod_...)
    let id = productId;
    if (typeof productId === 'string' && (productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId) || productId.startsWith('prod_'))) {
        // Database ID or prod_ ID - use as is
        id = productId;
    } else {
        // Try to parse as number if it's a string
        const parsedId = typeof productId === 'string' ? parseInt(productId) : productId;
        if (!isNaN(parsedId) && parsedId.toString() === productId.toString()) {
            id = parsedId;
        } else if (typeof productId === 'string' && productId.length > 0) {
            // Fallback: treat as string ID if it's a non-empty string
            id = productId;
        } else {
            console.error('❌ Invalid product ID for addToCart:', productId);
            showNotification('Error: Invalid product ID', 'error');
            return;
        }
    }

    // Find product - handle both Database and numeric IDs
    const product = products.find(p => {
        const pId = p.id || p._id;
        const pIdStr = String(pId);

        if (typeof id === 'string' && (id.length === 24 || id.startsWith('prod_'))) {
            // Database ID comparison
            return (pIdStr === id) || (String(p._id) === id) || (String(p.id) === id);
        } else {
            // Numeric ID comparison
            const productIdNum = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return productIdNum === id;
        }
    });

    if (!product) {
        console.error('❌ Product not found for addToCart. ID:', id);
        showNotification('Product not found!', 'error');
        return;
    }

    // Check if product is in stock
    const quantity = product.quantity || 0;
    if (quantity <= 0) {
        showNotification(`${product.name} (Size: ${getSizeDisplay(product.size)}) is sold out!`, 'error');
        return;
    }

    // For grouped products, include size in cart item identifier
    const cartItemId = `${productId}_${product.size}`;
    const existingItem = cart.find(item => {
        if (item.cartItemId) {
            return item.cartItemId === cartItemId;
        }
        return item.id === productId && item.size === product.size;
    });

    const finalPrice = getFinalPrice(product);

    // Check if adding more would exceed available stock
    const cartQuantity = existingItem ? existingItem.quantity : 0;
    if (cartQuantity >= quantity) {
        showNotification(`Only ${quantity} ${product.name} (Size: ${getSizeDisplay(product.size)}) available in stock!`, 'error');
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
        // Update price in case discount changed
        existingItem.price = finalPrice;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            image: product.image,
            price: finalPrice, // Use final price after discount
            originalPrice: product.price, // Store original price for display
            discount: product.discount,
            size: product.size,
            quantity: 1,
            cartItemId: cartItemId // Unique identifier for this item in cart
        });
    }


    updateCartUI();
    saveCart();

    // Show pop-up modal
    showCartAddedModal(product);
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCart();
}

// Remove from Cart by Index (for grouped products)
function removeFromCartByIndex(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        updateCartUI();
        saveCart();
    }
}

// Update Cart Quantity
function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = item.quantity + change;

    // Check if new quantity exceeds available stock
    const availableStock = product.quantity || 0;
    if (newQuantity > availableStock) {
        showNotification(`Only ${availableStock} ${product.name}(s) available in stock!`, 'error');
        return;
    }

    item.quantity = newQuantity;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
        saveCart();
    }
}

// Update Cart Quantity by Index (for grouped products)
function updateCartQuantityByIndex(index, change) {
    if (index < 0 || index >= cart.length) return;

    const item = cart[index];
    const product = products.find(p => p.id === item.id && p.size === item.size);

    if (!product) {
        // Fallback: find by id only
        const productById = products.find(p => p.id === item.id);
        if (!productById) return;

        const newQuantity = item.quantity + change;
        const availableStock = productById.quantity || 0;

        if (newQuantity > availableStock) {
            showNotification(`Only ${availableStock} ${item.name} (Size: ${item.size}) available in stock!`, 'error');
            return;
        }

        item.quantity = newQuantity;

        if (item.quantity <= 0) {
            removeFromCartByIndex(index);
        } else {
            updateCartUI();
            saveCart();
        }
        return;
    }

    const newQuantity = item.quantity + change;
    const availableStock = product.quantity || 0;

    if (newQuantity > availableStock) {
        showNotification(`Only ${availableStock} ${product.name} (Size: ${getSizeDisplay(product.size)}) available in stock!`, 'error');
        return;
    }

    item.quantity = newQuantity;

    if (item.quantity <= 0) {
        removeFromCartByIndex(index);
    } else {
        updateCartUI();
        saveCart();
    }
}

// Update Cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.image && item.image.trim() ?
                `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="no-image-placeholder" style="display: none;"></div>` :
                `<div class="no-image-placeholder" style="display: none;"></div>`
            }
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-size" style="color: #666; font-size: 0.85rem; margin: 3px 0;">
                        Size: <strong>${item.size || 'N/A'}</strong>
                    </div>
                    <div class="cart-item-price">
                        KSh ${item.price.toLocaleString('en-KE')} x ${item.quantity}
                        ${item.discount && item.discount > 0 ? `<span style="color: var(--primary-color); font-size: 0.85rem; margin-left: 5px;">(${item.discount}% off)</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
                        <button onclick="updateCartQuantityByIndex(${index}, -1)" style="background: var(--light-color); border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantityByIndex(${index}, 1)" style="background: var(--light-color); border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCartByIndex(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toLocaleString('en-KE');
}

// Toggle Cart
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');

    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('show');
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    openPaymentModal();
}

// Get delivery cost based on selected option
function getDeliveryCost() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked');
    if (!deliveryOption) return 0;

    switch (deliveryOption.value) {
        case 'pickup':
            return 0;
        case 'nairobi-cbd':
            return 250;
        case 'elsewhere':
            return 300;
        default:
            return 0;
    }
}

// Update delivery cost and total when delivery option changes
function updateDeliveryCost() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked');
    const deliveryAddressGroup = document.getElementById('deliveryAddressGroup');
    const deliveryAddress = document.getElementById('deliveryAddress');
    const deliveryAddressHint = document.getElementById('deliveryAddressHint');

    // Show/hide delivery address field based on delivery option
    if (deliveryOption && (deliveryOption.value === 'nairobi-cbd' || deliveryOption.value === 'elsewhere')) {
        deliveryAddressGroup.style.display = 'block';
        deliveryAddress.required = true;

        // Update placeholder and hint based on delivery option
        if (deliveryOption.value === 'nairobi-cbd') {
            deliveryAddress.placeholder = 'Enter your delivery address, landmarks, building name, floor, etc. (e.g., Archives, Imenti House, 3rd Floor, Room 301)';
            if (deliveryAddressHint) {
                deliveryAddressHint.textContent = 'Please provide detailed delivery address within Nairobi CBD and any special instructions';
            }
        } else if (deliveryOption.value === 'elsewhere') {
            deliveryAddress.placeholder = 'Enter your delivery address, town/city, landmarks, building name, etc. (e.g., Thika, Karen, Meru, ABC Building, Room 301)';
            if (deliveryAddressHint) {
                deliveryAddressHint.textContent = 'Please provide detailed delivery address within Kenya and any special instructions';
            }
        }
    } else {
        deliveryAddressGroup.style.display = 'none';
        deliveryAddress.required = false;
        deliveryAddress.value = '';
        deliveryAddress.placeholder = '';
    }

    // Update order summary and payment amount
    updateOrderSummary();
}

// Update order summary with delivery cost
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = getDeliveryCost();
    const total = subtotal + deliveryCost;

    // Update order summary
    const orderSummary = document.getElementById('orderSummary');
    orderSummary.innerHTML = `
        <h3>Order Summary</h3>
        <div class="order-items">
            ${cart.map(item => `
                <div class="order-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>KSh ${(item.price * item.quantity).toLocaleString('en-KE')}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-subtotal" style="padding: 10px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Subtotal:</span>
                <span>KSh ${subtotal.toLocaleString('en-KE')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Delivery:</span>
                <span>KSh ${deliveryCost.toLocaleString('en-KE')}</span>
            </div>
        </div>
        <div class="order-total">
            <strong>Total: KSh ${total.toLocaleString('en-KE')}</strong>
        </div>
    `;

    // Update payment amount
    document.getElementById('paymentAmount').textContent = `KSh ${total.toLocaleString('en-KE')}`;
}

// Open Payment Modal
function openPaymentModal() {
    // Initialize payment method UI immediately (no delay needed)
    updatePaymentMethod();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = getDeliveryCost();
    const total = subtotal + deliveryCost;

    // Reset delivery option to pickup (default)
    const deliveryOptions = document.querySelectorAll('input[name="deliveryOption"]');
    deliveryOptions.forEach(option => {
        if (option.value === 'pickup') {
            option.checked = true;
        } else {
            option.checked = false;
        }
    });

    // Hide delivery address field initially
    const deliveryAddressGroup = document.getElementById('deliveryAddressGroup');
    const deliveryAddress = document.getElementById('deliveryAddress');
    if (deliveryAddressGroup) {
        deliveryAddressGroup.style.display = 'none';
    }
    if (deliveryAddress) {
        deliveryAddress.required = false;
        deliveryAddress.value = '';
    }

    // Update order summary
    updateOrderSummary();

    // Payment steps are now static (only Till Number supported)

    // Show modal
    const modal = document.getElementById('paymentModal');
    const overlay = document.getElementById('paymentOverlay');
    modal.classList.add('show');
    overlay.classList.add('show');
    overlay.style.display = 'block';
}

// Update payment method UI based on selection
function updatePaymentMethod() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'till';
    console.log('📱 updatePaymentMethod called - payment method:', paymentMethod);

    const mpesaCodeGroup = document.getElementById('mpesaCodeGroup');
    const mpesaCodeInput = document.getElementById('mpesaCode');
    const tillPaymentSteps = document.getElementById('tillPaymentSteps');
    const stkPushPaymentSteps = document.getElementById('stkPushPaymentSteps');
    const customerPhoneGroup = document.getElementById('customerPhoneGroup');
    const customerPhoneLabel = document.getElementById('customerPhoneLabel');
    const phoneNumberHint = document.getElementById('phoneNumberHint');
    const customerPhoneInput = document.getElementById('customerPhone');

    if (paymentMethod === 'stk-push') {
        console.log('📱 STK Push selected - showing phone number field');
        // Hide M-Pesa code input for STK Push
        if (mpesaCodeGroup) {
            mpesaCodeGroup.style.display = 'none';
        }
        if (mpesaCodeInput) {
            mpesaCodeInput.removeAttribute('required');
            mpesaCodeInput.value = ''; // Clear the value
        }
        // Show STK Push steps, hide Till steps
        if (tillPaymentSteps) {
            tillPaymentSteps.style.display = 'none';
        }
        if (stkPushPaymentSteps) {
            stkPushPaymentSteps.style.display = 'block';
        }
        // Make phone number field more prominent for STK Push
        if (customerPhoneGroup) {
            customerPhoneGroup.style.display = 'block';
            customerPhoneGroup.style.marginTop = '20px';
            customerPhoneGroup.style.padding = '15px';
            customerPhoneGroup.style.background = '#f0f7ff';
            customerPhoneGroup.style.border = '2px solid var(--primary-color)';
            customerPhoneGroup.style.borderRadius = '8px';
        }
        if (customerPhoneLabel) {
            customerPhoneLabel.innerHTML = '<i class="fas fa-mobile-alt"></i> Your M-Pesa Phone Number *';
            customerPhoneLabel.style.color = 'var(--primary-color)';
            customerPhoneLabel.style.fontWeight = 'bold';
            customerPhoneLabel.style.fontSize = '1.1rem';
        }
        if (phoneNumberHint) {
            phoneNumberHint.style.display = 'block';
        }
        if (customerPhoneInput) {
            customerPhoneInput.setAttribute('required', 'required');
            customerPhoneInput.style.fontSize = '1.1rem';
            customerPhoneInput.style.padding = '12px';
            customerPhoneInput.style.borderWidth = '2px';
            customerPhoneInput.placeholder = 'Enter M-Pesa phone number (0724904692 or 254724904692)';
            customerPhoneInput.focus(); // Focus on phone number input
        }
    } else {
        // Show M-Pesa code input for Till payment
        if (mpesaCodeGroup) {
            mpesaCodeGroup.style.display = 'block';
        }
        if (mpesaCodeInput) {
            mpesaCodeInput.setAttribute('required', 'required');
        }
        // Show Till steps, hide STK Push steps
        if (tillPaymentSteps) {
            tillPaymentSteps.style.display = 'block';
        }
        if (stkPushPaymentSteps) {
            stkPushPaymentSteps.style.display = 'none';
        }
        // Reset phone number field styling for Till payment
        if (customerPhoneGroup) {
            customerPhoneGroup.style.display = 'block';
            customerPhoneGroup.style.marginTop = '';
            customerPhoneGroup.style.padding = '';
            customerPhoneGroup.style.background = '';
            customerPhoneGroup.style.border = '';
            customerPhoneGroup.style.borderRadius = '';
        }
        if (customerPhoneLabel) {
            customerPhoneLabel.innerHTML = 'Your Phone Number *';
            customerPhoneLabel.style.color = '';
            customerPhoneLabel.style.fontWeight = '';
            customerPhoneLabel.style.fontSize = '';
        }
        if (phoneNumberHint) {
            phoneNumberHint.style.display = 'none';
        }
        if (customerPhoneInput) {
            customerPhoneInput.setAttribute('required', 'required');
            customerPhoneInput.style.fontSize = '';
            customerPhoneInput.style.padding = '';
            customerPhoneInput.style.borderWidth = '';
            customerPhoneInput.placeholder = '07XX XXX XXX or 2547XX XXX XXX';
        }
    }
}

// Update payment steps (simplified - only Till Number)
function updatePaymentSteps() {
    // Payment steps are now static since we only support Till Number
    updatePaymentMethod(); // Also update payment method UI
}

// Show Secure Till Payment Modal
function showTillPaymentModal() {
    const modal = document.getElementById('tillPaymentModal');
    const overlay = document.getElementById('tillPaymentOverlay');

    if (!modal || !overlay) {
        console.error('Till payment modal elements not found');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = getDeliveryCost();
    const total = subtotal + deliveryCost;
    const customerName = document.getElementById('customerName')?.value || '';
    const customerPhone = document.getElementById('customerPhone')?.value || '';
    const customerEmail = document.getElementById('customerEmail')?.value || '';

    // Update payment details
    const paymentDetails = document.getElementById('tillPaymentDetails');
    if (paymentDetails) {
        paymentDetails.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Till Number:</strong></span>
                <span style="color: var(--primary-color); font-weight: bold; font-size: 1.1rem;">177104 (Lucyline Smart Fashion)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Subtotal:</strong></span>
                <span style="color: #666;">KSh ${subtotal.toLocaleString('en-KE')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Delivery:</strong></span>
                <span style="color: #666;">KSh ${deliveryCost.toLocaleString('en-KE')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <span><strong>Total Amount:</strong></span>
                <span style="color: var(--primary-color); font-weight: bold; font-size: 1.1rem;">KSh ${total.toLocaleString('en-KE')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Payment Type:</strong></span>
                <span style="color: #666;">Buy Goods</span>
            </div>
        `;
    }

    // Update customer info
    const customerInfo = document.getElementById('tillCustomerInfo');
    if (customerInfo) {
        customerInfo.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>Name:</strong> ${customerName || 'Not entered'}</div>
            <div style="margin-bottom: 5px;"><strong>Phone:</strong> ${customerPhone || 'Not entered'}</div>
            ${customerEmail ? `<div style="margin-bottom: 5px;"><strong>Email:</strong> ${customerEmail}</div>` : ''}
        `;
    }

    // Store payment info for later use
    window.tillPaymentInfo = {
        total: total,
        subtotal: subtotal,
        deliveryCost: deliveryCost,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail
    };

    // Show modal
    modal.classList.add('show');
    overlay.classList.add('show');
    overlay.style.display = 'block';
}

// Close Till Payment Modal
function closeTillPaymentModal() {
    const modal = document.getElementById('tillPaymentModal');
    const overlay = document.getElementById('tillPaymentOverlay');

    if (modal) {
        modal.classList.remove('show');
    }
    if (overlay) {
        overlay.classList.remove('show');
        overlay.style.display = 'none';
    }
}

// Open M-Pesa App with pre-filled details
function openMpesaApp() {
    // Use total from payment info (which includes delivery cost) or calculate it
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = getDeliveryCost();
    const total = window.tillPaymentInfo?.total || (subtotal + deliveryCost);
    const tillNumber = '177104';

    // Try M-Pesa deep link (works on mobile)
    const mpesaDeepLink = `mpesa://buygoods?till=${tillNumber}&amount=${total}`;

    // Fallback: USSD code format
    const ussdCode = `*234*1*${tillNumber}*${total}#`;

    // Try to open M-Pesa app
    try {
        // For mobile devices
        window.location.href = mpesaDeepLink;

        // Fallback after 1 second if deep link doesn't work
        setTimeout(() => {
            // Show instructions
            alert(`To pay via M-Pesa:\n\n1. Open M-Pesa app\n2. Select "Buy Goods and Services"\n3. Enter Till Number: ${tillNumber} (Lucyline Smart Fashion)\n4. Enter Amount: KSh ${total.toLocaleString('en-KE')}\n\nOr dial: ${ussdCode}`);
        }, 1000);
    } catch (error) {
        // Show instructions if deep link fails
        alert(`To pay via M-Pesa:\n\n1. Open M-Pesa app\n2. Select "Buy Goods and Services"\n3. Enter Till Number: ${tillNumber}\n4. Enter Amount: KSh ${total.toLocaleString('en-KE')}\n\nOr dial: ${ussdCode}`);
    }
}

// Validate M-Pesa Transaction Code
function validateMpesaCode(code) {
    if (!code) {
        return { valid: false, error: 'M-Pesa code is required' };
    }

    const trimmedCode = code.trim().toUpperCase();

    // Check length
    if (trimmedCode.length !== 10) {
        return { valid: false, error: 'M-Pesa code must be exactly 10 characters' };
    }

    // Check format: M-Pesa codes are alphanumeric (letters and numbers only)
    if (!/^[A-Z0-9]{10}$/.test(trimmedCode)) {
        return { valid: false, error: 'M-Pesa code must contain only letters and numbers' };
    }

    // M-Pesa codes typically have specific patterns:
    // - Usually contain at least one letter and one number
    // - Common formats: Starts with letter(s) followed by numbers, or mixed
    const hasLetter = /[A-Z]/.test(trimmedCode);
    const hasNumber = /[0-9]/.test(trimmedCode);

    if (!hasLetter || !hasNumber) {
        return { valid: false, error: 'M-Pesa code must contain both letters and numbers' };
    }

    // Check for common invalid patterns
    // M-Pesa codes don't usually have all same characters
    if (/^(.)\1{9}$/.test(trimmedCode)) {
        return { valid: false, error: 'Invalid M-Pesa code format' };
    }

    // M-Pesa codes don't usually start with all zeros
    if (/^0{10}$/.test(trimmedCode)) {
        return { valid: false, error: 'Invalid M-Pesa code format' };
    }

    return { valid: true, code: trimmedCode };
}

// Validate M-Pesa Code Input (for real-time validation in input fields)
function validateMpesaCodeInput(inputElement) {
    if (!inputElement) return;

    const code = inputElement.value.trim().toUpperCase();
    const errorElementId = inputElement.id === 'mpesaCode' ? 'mpesaCodeError' : '';
    const errorElement = errorElementId ? document.getElementById(errorElementId) : null;

    // Reset border color
    inputElement.style.borderColor = '#ddd';

    // Hide error if input is empty (user is still typing)
    if (!code) {
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        return;
    }

    // Validate the code
    const validation = validateMpesaCode(code);

    if (!validation.valid) {
        // Show error
        if (errorElement) {
            errorElement.textContent = validation.error;
            errorElement.style.display = 'block';
        }
        inputElement.style.borderColor = '#f44336';
    } else {
        // Clear error
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        inputElement.style.borderColor = '#4caf50';
    }
}

// Check for duplicate M-Pesa code in localStorage (FAST - uses used codes list)
function checkDuplicateMpesaCodeLocal(mpesaCode) {
    try {
        const code = mpesaCode.toUpperCase().trim();

        // First check the fast lookup list (usedMpesaCodes)
        const usedCodesJson = localStorage.getItem('usedMpesaCodes');
        if (usedCodesJson) {
            try {
                const usedCodes = JSON.parse(usedCodesJson);
                if (Array.isArray(usedCodes) && usedCodes.includes(code)) {
                    // Found in used codes list - now find the order details
                    console.log('⚠️ Duplicate M-Pesa code found in used codes list:', code);

                    // Get order details from orders list
                    const ordersJson = localStorage.getItem('orders');
                    if (ordersJson) {
                        try {
                            const orders = JSON.parse(ordersJson);
                            const duplicateOrder = orders.find(order =>
                                order.mpesaCode && order.mpesaCode.toUpperCase().trim() === code
                            );
                            if (duplicateOrder) {
                                console.log('✅ Found duplicate order:', duplicateOrder.orderId);
                                return duplicateOrder;
                            }
                        } catch (parseError) {
                            console.error('Error parsing orders:', parseError);
                        }
                    }

                    // If order not found but code is in used list, return a generic duplicate object
                    return {
                        orderId: 'Unknown',
                        date: 'Unknown',
                        mpesaCode: code,
                        total: 0,
                        customer: { name: 'Unknown' }
                    };
                }
            } catch (parseError) {
                console.error('Error parsing used M-Pesa codes:', parseError);
            }
        }

        // Fallback: Check orders list directly (slower but more thorough)
        const ordersJson = localStorage.getItem('orders');
        if (!ordersJson) {
            return null; // No orders stored, so no duplicate
        }

        try {
            const orders = JSON.parse(ordersJson);

            // Find order with same M-Pesa code
            const duplicateOrder = orders.find(order =>
                order.mpesaCode && order.mpesaCode.toUpperCase().trim() === code
            );

            if (duplicateOrder) {
                console.log('⚠️ Duplicate M-Pesa code found in orders list:', duplicateOrder.orderId);
                return duplicateOrder;
            }
        } catch (parseError) {
            console.error('Error parsing orders from localStorage:', parseError);
        }

        return null; // No duplicate found
    } catch (error) {
        console.error('Error checking duplicate M-Pesa code in localStorage:', error);
        return null;
    }
}

// Save order to localStorage
function saveOrderToLocalStorage(order) {
    try {
        const ordersJson = localStorage.getItem('orders');
        let orders = [];

        if (ordersJson) {
            try {
                orders = JSON.parse(ordersJson);
            } catch (parseError) {
                console.error('Error parsing orders from localStorage:', parseError);
                orders = [];
            }
        }

        // Check if order already exists (by orderId or mpesaCode)
        const code = order.mpesaCode ? order.mpesaCode.toUpperCase().trim() : '';
        const existingOrderIndex = orders.findIndex(o =>
            (o.orderId === order.orderId) || (o.mpesaCode && o.mpesaCode.toUpperCase().trim() === code && code !== '')
        );

        if (existingOrderIndex >= 0) {
            // Update existing order
            orders[existingOrderIndex] = {
                orderId: order.orderId,
                date: order.date,
                mpesaCode: order.mpesaCode,
                total: order.total,
                customer: order.customer,
                createdAt: orders[existingOrderIndex].createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            console.log('✅ Order updated in localStorage');
        } else {
            // Add new order
            orders.push({
                orderId: order.orderId,
                date: order.date,
                mpesaCode: order.mpesaCode,
                total: order.total,
                customer: order.customer,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Order saved to localStorage');
        }

        // Save back to localStorage
        localStorage.setItem('orders', JSON.stringify(orders));

        // Also save M-Pesa code(s) separately for quick lookup
        // Handle both single code and multiple codes
        const codesToSave = [];
        if (code) {
            codesToSave.push(code);
        }
        // Also check for mpesaCodes array (for partial payments)
        if (order.mpesaCodes && Array.isArray(order.mpesaCodes)) {
            order.mpesaCodes.forEach(payment => {
                if (payment.code && !codesToSave.includes(payment.code.toUpperCase().trim())) {
                    codesToSave.push(payment.code.toUpperCase().trim());
                }
            });
        }

        if (codesToSave.length > 0) {
            const usedCodesJson = localStorage.getItem('usedMpesaCodes');
            let usedCodes = [];

            if (usedCodesJson) {
                try {
                    usedCodes = JSON.parse(usedCodesJson);
                } catch (parseError) {
                    console.error('Error parsing used M-Pesa codes:', parseError);
                    usedCodes = [];
                }
            }

            codesToSave.forEach(codeToSave => {
                if (!usedCodes.includes(codeToSave)) {
                    usedCodes.push(codeToSave);
                }
            });

            localStorage.setItem('usedMpesaCodes', JSON.stringify(usedCodes));
            console.log(`✅ ${codesToSave.length} M-Pesa code(s) saved to used codes list`);
        }
    } catch (error) {
        console.error('Error saving order to localStorage:', error);
    }
}

// Sync orders from Database to localStorage
async function syncOrdersFromDatabase() {
    const useDatabase = localStorage.getItem('useDatabase') === 'true';
    if (!useDatabase) {
        return; // Skip if Database is not available
    }

    try {
        console.log('🔄 Syncing orders from Database to localStorage...');
        const mongoOrders = await apiService.getOrders();

        if (mongoOrders && mongoOrders.length > 0) {
            // Get existing orders from localStorage
            const ordersJson = localStorage.getItem('orders');
            let localOrders = [];

            if (ordersJson) {
                try {
                    localOrders = JSON.parse(ordersJson);
                } catch (parseError) {
                    console.error('Error parsing orders from localStorage:', parseError);
                    localOrders = [];
                }
            }

            // Create a map of local orders by M-Pesa code for quick lookup
            const localOrdersMap = new Map();
            localOrders.forEach(order => {
                if (order.mpesaCode) {
                    const code = order.mpesaCode.toUpperCase().trim();
                    localOrdersMap.set(code, order);
                }
            });

            // Merge Database orders into localStorage
            let updated = false;
            mongoOrders.forEach(mongoOrder => {
                if (mongoOrder.mpesaCode) {
                    const code = mongoOrder.mpesaCode.toUpperCase().trim();

                    // Check if order exists in localStorage
                    const existingOrder = localOrdersMap.get(code);

                    if (!existingOrder) {
                        // Add new order from Database
                        localOrders.push({
                            orderId: mongoOrder.orderId,
                            date: mongoOrder.date,
                            mpesaCode: mongoOrder.mpesaCode,
                            total: mongoOrder.total,
                            customer: mongoOrder.customer,
                            createdAt: mongoOrder.createdAt || new Date().toISOString()
                        });
                        localOrdersMap.set(code, mongoOrder);
                        updated = true;
                    }
                }
            });

            // Update used M-Pesa codes list
            const usedCodesJson = localStorage.getItem('usedMpesaCodes');
            let usedCodes = [];

            if (usedCodesJson) {
                try {
                    usedCodes = JSON.parse(usedCodesJson);
                } catch (parseError) {
                    usedCodes = [];
                }
            }

            // Add all M-Pesa codes from Database orders
            mongoOrders.forEach(order => {
                if (order.mpesaCode) {
                    const code = order.mpesaCode.toUpperCase().trim();
                    if (!usedCodes.includes(code)) {
                        usedCodes.push(code);
                        updated = true;
                    }
                }
            });

            if (updated) {
                // Save updated orders to localStorage
                localStorage.setItem('orders', JSON.stringify(localOrders));
                localStorage.setItem('usedMpesaCodes', JSON.stringify(usedCodes));
                console.log(`✅ Synced ${mongoOrders.length} orders from Database to localStorage`);
                console.log(`📊 Total orders in localStorage: ${localOrders.length}`);
                console.log(`📊 Total used M-Pesa codes: ${usedCodes.length}`);
            } else {
                console.log('ℹ️ Orders already synced - no updates needed');
            }
        } else {
            console.log('ℹ️ No orders in Database to sync');
        }
    } catch (error) {
        console.error('❌ Error syncing orders from Database:', error);
        // Don't throw - allow the app to continue even if sync fails
    }
}

// Verify M-Pesa code helper function
async function verifyMpesaCodeBeforePayment(mpesaCode, total, mpesaCodeInput) {
    const code = mpesaCode.toUpperCase().trim();

    // ALWAYS check localStorage for duplicates first (even if Database is available)
    const duplicateOrder = checkDuplicateMpesaCodeLocal(code);
    if (duplicateOrder) {
        const errorMessage = `⚠️ This M-Pesa code has already been used!\n\n` +
            `Order ID: ${duplicateOrder.orderId || 'N/A'}\n` +
            `Date: ${duplicateOrder.date || 'N/A'}\n` +
            `Amount: KSh ${duplicateOrder.total?.toLocaleString('en-KE') || 'N/A'}\n\n` +
            `Please enter the correct M-Pesa transaction code from your payment confirmation message.\n\n` +
            `If you believe this is an error, please contact us for assistance:\n` +
            `WhatsApp: +254 724 904 692`;
        alert(errorMessage);
        if (mpesaCodeInput) {
            mpesaCodeInput.focus();
            mpesaCodeInput.style.borderColor = '#f44336';
        }
        showNotification('M-Pesa code already used. Please check and try again.', 'error');
        return { valid: false, reason: 'duplicate', existingOrder: duplicateOrder };
    }

    // Also check Database if available
    const useDatabase = localStorage.getItem('useDatabase') === 'true';
    if (useDatabase) {
        try {
            showNotification('Verifying M-Pesa transaction code...', 'info');
            console.log('🔍 Verifying M-Pesa code:', { code: mpesaCode, total, useDatabase });

            const verification = await apiService.verifyMpesaCode(mpesaCode, total, new Date());
            console.log('📋 Verification response:', verification);

            // Only block if it's a confirmed duplicate
            if (verification.reason === 'duplicate') {
                // Also save this duplicate to localStorage for future checks
                if (verification.existingOrder) {
                    saveOrderToLocalStorage(verification.existingOrder);
                }

                const errorMessage = `⚠️ This M-Pesa code has already been used!\n\n` +
                    `Order ID: ${verification.existingOrder?.orderId || 'N/A'}\n` +
                    `Date: ${verification.existingOrder?.date || 'N/A'}\n` +
                    `Amount: KSh ${verification.existingOrder?.amount?.toLocaleString('en-KE') || 'N/A'}\n\n` +
                    `Please enter the correct M-Pesa transaction code from your payment confirmation message.\n\n` +
                    `If you believe this is an error, please contact us for assistance:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('M-Pesa code verification failed. Please check and try again.', 'error');
                return { valid: false, reason: 'duplicate', existingOrder: verification.existingOrder };
            }

            // Check for invalid format
            if (verification.reason === 'invalid_format') {
                const errorMessage = `⚠️ Invalid M-Pesa code format!\n\n` +
                    `${verification.message || 'M-Pesa code must be exactly 10 alphanumeric characters.'}\n\n` +
                    `Please check your M-Pesa transaction code and try again.\n\n` +
                    `If you continue to have issues, please contact us:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('Invalid M-Pesa code format. Please check and try again.', 'error');
                return { valid: false, reason: 'invalid_format' };
            }

            // CRITICAL SECURITY: Check if transaction is not found
            if (verification.reason === 'transaction_not_found') {
                const errorMessage = `❌ M-Pesa Transaction Not Verified!\n\n` +
                    `${verification.message || 'The M-Pesa transaction code was not found in our database.'}\n\n` +
                    `⚠️ SECURITY: Payment cannot be accepted until the transaction is verified through M-Pesa API.\n\n` +
                    `Please ensure:\n` +
                    `1. You completed the M-Pesa payment successfully\n` +
                    `2. You entered the correct M-Pesa transaction code\n` +
                    `3. You wait a few moments for the transaction to be received via webhook\n` +
                    `4. You try again after the transaction has been processed\n\n` +
                    `If you continue to have issues, please contact us:\n` +
                    `WhatsApp: +254 724 904 692\n\n` +
                    `This security measure prevents fake or guessed transaction codes from being accepted.`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('Transaction not verified. Payment blocked for security.', 'error');
                return { valid: false, reason: 'transaction_not_found', verification };
            }

            // Check for verification error
            if (verification.reason === 'verification_error') {
                const errorMessage = `❌ M-Pesa Verification Error!\n\n` +
                    `${verification.message || 'An error occurred while verifying the M-Pesa transaction.'}\n\n` +
                    `Payment cannot be accepted until verification is successful.\n\n` +
                    `Please try again or contact us:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('Verification error. Payment blocked. Please try again.', 'error');
                return { valid: false, reason: 'verification_error', verification };
            }

            // CRITICAL: Check verification result - Handle partial payments
            if (verification.reason === 'amount_mismatch') {
                // Allow partial payments - return the actual amount paid
                const actualAmount = verification.mpesaTransaction?.amount || 0;
                const expectedAmount = total;

                // If actual amount is less than expected, it's a partial payment
                if (actualAmount > 0 && actualAmount < expectedAmount) {
                    console.log(`💰 Partial payment detected: Paid KSh ${actualAmount.toLocaleString('en-KE')}, Expected KSh ${expectedAmount.toLocaleString('en-KE')}`);
                    return {
                        valid: true,
                        reason: 'partial_payment',
                        actualAmount: actualAmount,
                        expectedAmount: expectedAmount,
                        remainingBalance: expectedAmount - actualAmount,
                        verification
                    };
                } else if (actualAmount > expectedAmount) {
                    // Overpayment - still allow but warn
                    const errorMessage = `⚠️ M-Pesa Transaction Amount Exceeds Order Total!\n\n` +
                        `Expected Amount: KSh ${expectedAmount.toLocaleString('en-KE')}\n` +
                        `Transaction Amount: KSh ${actualAmount.toLocaleString('en-KE')}\n\n` +
                        `You paid more than the order total. The excess amount will not be refunded automatically.\n\n` +
                        `If you need assistance, please contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    if (mpesaCodeInput) {
                        mpesaCodeInput.focus();
                        mpesaCodeInput.style.borderColor = '#f44336';
                    }
                    showNotification('Payment amount exceeds order total.', 'warning');
                    return { valid: false, reason: 'amount_mismatch', verification };
                } else {
                    // Amount mismatch but not partial payment (could be wrong code)
                    const errorMessage = `❌ M-Pesa Transaction Amount Mismatch!\n\n` +
                        `Expected Amount: KSh ${expectedAmount.toLocaleString('en-KE')}\n` +
                        `Transaction Amount: KSh ${actualAmount.toLocaleString('en-KE') || 'N/A'}\n\n` +
                        `The M-Pesa transaction amount does not match your order total.\n\n` +
                        `Please verify:\n` +
                        `1. You entered the correct M-Pesa transaction code\n` +
                        `2. You paid the correct amount (KSh ${expectedAmount.toLocaleString('en-KE')})\n` +
                        `3. You selected the correct delivery option\n\n` +
                        `If you believe this is an error, please contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    if (mpesaCodeInput) {
                        mpesaCodeInput.focus();
                        mpesaCodeInput.style.borderColor = '#f44336';
                    }
                    showNotification('M-Pesa transaction amount mismatch. Payment blocked.', 'error');
                    return { valid: false, reason: 'amount_mismatch', verification };
                }
            }

            if (verification.reason === 'date_mismatch') {
                // STRICT: Block payment if date is outside valid range
                const errorMessage = `❌ M-Pesa Transaction Date Invalid!\n\n` +
                    `The M-Pesa transaction date is outside the valid range (24 hours).\n\n` +
                    `Transaction Date: ${verification.mpesaTransaction?.transactionDate ? new Date(verification.mpesaTransaction.transactionDate).toLocaleString('en-KE') : 'N/A'}\n\n` +
                    `Please ensure you are using a recent transaction code from your M-Pesa confirmation message.\n\n` +
                    `If you believe this is an error, please contact us:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('M-Pesa transaction date invalid. Payment blocked.', 'error');
                return { valid: false, reason: 'date_mismatch', verification };
            }

            if (verification.reason === 'amount_required') {
                // STRICT: Block payment if amount is required but not provided
                const errorMessage = `❌ Amount Required for Verification!\n\n` +
                    `Amount is required to verify the M-Pesa transaction.\n\n` +
                    `Please ensure your order total is correct and try again.\n\n` +
                    `If you continue to have issues, please contact us:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('Amount required for verification. Payment blocked.', 'error');
                return { valid: false, reason: 'amount_required', verification };
            }

            // Check if transaction was found in M-Pesa records
            if (verification.foundInMpesa) {
                const actualAmount = verification.mpesaTransaction?.amount || total;

                if (verification.verified) {
                    console.log('✅ M-Pesa transaction verified against M-Pesa records - Amount matches!');
                    showNotification('M-Pesa transaction verified successfully! Amount matches.', 'success');
                    return {
                        valid: true,
                        verification,
                        actualAmount: actualAmount,
                        expectedAmount: total
                    };
                } else if (verification.amountMatch && verification.dateValid) {
                    // Amount and date match but transaction not verified by M-Pesa
                    console.log('⚠️ M-Pesa transaction found with matching amount and date, but not verified by M-Pesa');
                    showNotification('M-Pesa transaction found with matching amount. Proceeding...', 'warning');
                    return {
                        valid: true,
                        verification,
                        actualAmount: actualAmount,
                        expectedAmount: total
                    };
                } else {
                    // This should not happen if amount/date mismatch was caught above
                    console.error('❌ Verification failed unexpectedly:', verification);
                    const errorMessage = `❌ M-Pesa Transaction Verification Failed!\n\n` +
                        `The M-Pesa transaction could not be verified.\n\n` +
                        `Please verify:\n` +
                        `1. You entered the correct M-Pesa transaction code\n` +
                        `2. You paid the correct amount\n` +
                        `3. The transaction was completed successfully\n\n` +
                        `If you continue to have issues, please contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    if (mpesaCodeInput) {
                        mpesaCodeInput.focus();
                        mpesaCodeInput.style.borderColor = '#f44336';
                    }
                    showNotification('M-Pesa transaction verification failed. Payment blocked.', 'error');
                    return { valid: false, reason: 'verification_failed', verification };
                }
            } else {
                // CRITICAL SECURITY: Transaction NOT FOUND - BLOCK PAYMENT
                console.error('❌ M-Pesa transaction NOT FOUND in database - BLOCKING payment');
                console.error('🔒 SECURITY: Transaction code must be verified through M-Pesa API before payment can be accepted');

                // STRICT: Block payment if transaction not found
                const expectedAmount = verification.expectedAmount || total;
                const errorMessage = `❌ M-Pesa Transaction Not Verified!\n\n` +
                    `Expected Amount: KSh ${expectedAmount.toLocaleString('en-KE')}\n\n` +
                    `The M-Pesa transaction code was not found in our database.\n\n` +
                    `This means the transaction has not been received via M-Pesa webhook yet, or the code is invalid.\n\n` +
                    `⚠️ SECURITY: Payment cannot be accepted until the transaction is verified through M-Pesa API.\n\n` +
                    `Please ensure:\n` +
                    `1. You completed the M-Pesa payment successfully\n` +
                    `2. You entered the correct M-Pesa transaction code\n` +
                    `3. You wait a few moments for the transaction to be received via webhook\n` +
                    `4. You try again after the transaction has been processed\n\n` +
                    `If you continue to have issues, please contact us:\n` +
                    `WhatsApp: +254 724 904 692\n\n` +
                    `This security measure prevents fake or guessed transaction codes from being accepted.`;

                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('Transaction not verified. Payment blocked for security. Please ensure payment was completed and try again.', 'error');
                return { valid: false, reason: 'transaction_not_found', verification };
            }

            // CRITICAL SECURITY: Block payment if date is invalid (outside 24 hours)
            if (verification.valid && verification.dateValid === false) {
                const errorMessage = `❌ M-Pesa Transaction Date Invalid!\n\n` +
                    `The M-Pesa transaction date is outside the valid range (24 hours).\n\n` +
                    `Transaction Date: ${verification.mpesaTransaction?.transactionDate ? new Date(verification.mpesaTransaction.transactionDate).toLocaleString('en-KE') : 'N/A'}\n\n` +
                    `For security reasons, we only accept payments made within the last 24 hours.\n\n` +
                    `Please ensure you are using a recent transaction code from your M-Pesa confirmation message.\n\n` +
                    `If you believe this is an error, please contact us:\n` +
                    `WhatsApp: +254 724 904 692`;
                alert(errorMessage);
                if (mpesaCodeInput) {
                    mpesaCodeInput.focus();
                    mpesaCodeInput.style.borderColor = '#f44336';
                }
                showNotification('M-Pesa transaction date invalid. Payment blocked for security.', 'error');
                return { valid: false, reason: 'date_mismatch', verification };
            }

            // CRITICAL SECURITY: Block payment if amount doesn't match and it's not a partial payment
            if (verification.valid && verification.amountMatch === false && !verification.reason) {
                const actualAmount = verification.mpesaTransaction?.amount || 0;
                const expectedAmount = total;

                // Only allow if it's a partial payment (less than expected)
                if (actualAmount > 0 && actualAmount < expectedAmount) {
                    // This will be handled by the amount_mismatch check above
                } else {
                    // Amount doesn't match and it's not a partial payment - BLOCK
                    const errorMessage = `❌ M-Pesa Transaction Amount Mismatch!\n\n` +
                        `Expected Amount: KSh ${expectedAmount.toLocaleString('en-KE')}\n` +
                        `Transaction Amount: KSh ${actualAmount.toLocaleString('en-KE') || 'N/A'}\n\n` +
                        `The M-Pesa transaction amount does not match your order total.\n\n` +
                        `Please verify:\n` +
                        `1. You entered the correct M-Pesa transaction code\n` +
                        `2. You paid the correct amount (KSh ${expectedAmount.toLocaleString('en-KE')})\n` +
                        `3. You selected the correct delivery option\n\n` +
                        `If you believe this is an error, please contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    if (mpesaCodeInput) {
                        mpesaCodeInput.focus();
                        mpesaCodeInput.style.borderColor = '#f44336';
                    }
                    showNotification('M-Pesa transaction amount mismatch. Payment blocked.', 'error');
                    return { valid: false, reason: 'amount_mismatch', verification };
                }
            }
        } catch (error) {
            console.error('❌ Error verifying M-Pesa code:', error);
            showNotification('Error verifying M-Pesa code. Please try again.', 'error');
            return { valid: false, reason: 'error', message: error.message };
        }
    }

    // If no database or verification passed without issues, allow by default for localStorage
    return { valid: true, reason: 'no_verification_needed' };
}

// Paybill payment functions removed - only Till Number is supported now

// Close Payment Modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    const overlay = document.getElementById('paymentOverlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.getElementById('paymentForm').reset();
    // Reset partial payment state
    resetPartialPaymentState();
}

// Show Payment Verification Loading Modal
function showPaymentVerificationModal() {
    const modal = document.getElementById('paymentVerificationModal');
    const overlay = document.getElementById('paymentVerificationOverlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        modal.classList.add('show');
        overlay.classList.add('show');
    }
}

// Hide Payment Verification Loading Modal
function hidePaymentVerificationModal() {
    const modal = document.getElementById('paymentVerificationModal');
    const overlay = document.getElementById('paymentVerificationOverlay');
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        modal.classList.remove('show');
        overlay.classList.remove('show');
    }
}

// Partial Payment State Management
let partialPaymentState = {
    totalAmount: 0,
    paidAmount: 0,
    remainingBalance: 0,
    paymentCodes: [] // Array of {code, amount} objects
};

function resetPartialPaymentState() {
    partialPaymentState = {
        totalAmount: 0,
        paidAmount: 0,
        remainingBalance: 0,
        paymentCodes: []
    };
    // Hide payment progress
    const progressDiv = document.getElementById('paymentProgress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
    // Clear additional M-Pesa code inputs
    const container = document.getElementById('additionalMpesaCodesContainer');
    if (container) {
        container.innerHTML = '';
    }
}

function updatePaymentProgress(totalAmount, paidAmount, remainingBalance) {
    partialPaymentState.totalAmount = totalAmount;
    partialPaymentState.paidAmount = paidAmount;
    partialPaymentState.remainingBalance = remainingBalance;

    const progressDiv = document.getElementById('paymentProgress');
    const totalAmountSpan = document.getElementById('paymentTotalAmount');
    const paidAmountSpan = document.getElementById('paymentPaidAmount');
    const remainingAmountSpan = document.getElementById('paymentRemainingAmount');
    const codesDiv = document.getElementById('partialPaymentCodes');

    if (progressDiv && totalAmountSpan && paidAmountSpan && remainingAmountSpan) {
        progressDiv.style.display = 'block';
        totalAmountSpan.textContent = totalAmount.toLocaleString('en-KE');
        paidAmountSpan.textContent = paidAmount.toLocaleString('en-KE');
        remainingAmountSpan.textContent = remainingBalance.toLocaleString('en-KE');

        // Update payment codes list
        if (codesDiv && partialPaymentState.paymentCodes.length > 0) {
            codesDiv.innerHTML = '<strong>Payment Codes:</strong><ul style="margin: 10px 0 0 20px; padding: 0;">';
            partialPaymentState.paymentCodes.forEach((payment, index) => {
                codesDiv.innerHTML += `<li style="margin: 5px 0;">Code ${index + 1}: ${payment.code} - KSh ${payment.amount.toLocaleString('en-KE')}</li>`;
            });
            codesDiv.innerHTML += '</ul>';
        }
    }
}

function addAdditionalMpesaCodeInput(remainingBalance, index) {
    const container = document.getElementById('additionalMpesaCodesContainer');
    if (!container) return;

    const inputId = `mpesaCodeAdditional${index}`;
    const errorId = `mpesaCodeErrorAdditional${index}`;

    const inputGroup = document.createElement('div');
    inputGroup.className = 'form-group';
    inputGroup.id = `mpesaCodeGroup${index}`;
    inputGroup.innerHTML = `
        <label for="${inputId}">Additional M-Pesa Transaction Code (Remaining Balance: KSh ${remainingBalance.toLocaleString('en-KE')}) *</label>
        <input type="text" id="${inputId}" required placeholder="Enter 10-character code (e.g., ABC1234XYZ)" 
               pattern="[A-Z0-9]{10}" maxlength="10"
               style="text-transform: uppercase;"
               oninput="this.value = this.value.toUpperCase(); validateMpesaCodeInput(this)"
               onblur="validateMpesaCodeInput(this)">
        <small id="${errorId}" style="color: #f44336; display: none; margin-top: 5px;"></small>
        <small style="color: #666; display: block; margin-top: 5px;">Enter the 10-character code from your M-Pesa confirmation message for the remaining balance</small>
    `;

    container.appendChild(inputGroup);

    // Scroll to the new input
    setTimeout(() => {
        const newInput = document.getElementById(inputId);
        if (newInput) {
            newInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

function getAllMpesaCodes() {
    const codes = [];

    // Get first M-Pesa code
    const firstCode = document.getElementById('mpesaCode')?.value?.trim().toUpperCase();
    if (firstCode) {
        codes.push({ inputId: 'mpesaCode', code: firstCode });
    }

    // Get additional M-Pesa codes
    let index = 1;
    while (true) {
        const inputId = `mpesaCodeAdditional${index}`;
        const input = document.getElementById(inputId);
        if (!input) break;

        const code = input.value?.trim().toUpperCase();
        if (code) {
            codes.push({ inputId, code });
        }
        index++;
    }

    return codes;
}

// Complete Till Payment
async function completeTillPayment() {
    const mpesaCodeInput = document.getElementById('tillMpesaCode');
    const mpesaCode = mpesaCodeInput?.value || '';

    // Validate M-Pesa code
    const validation = validateMpesaCode(mpesaCode);
    if (!validation.valid) {
        alert(validation.error);
        if (mpesaCodeInput) {
            mpesaCodeInput.focus();
            mpesaCodeInput.style.borderColor = '#f44336';
            setTimeout(() => {
                mpesaCodeInput.style.borderColor = '#ddd';
            }, 3000);
        }
        return;
    }

    const validMpesaCode = validation.code;

    // Check local duplicates first
    const duplicateOrder = checkDuplicateMpesaCodeLocal(validMpesaCode);
    if (duplicateOrder) {
        const errorMessage = `⚠️ This M-Pesa code has already been used!\n\n` +
            `Order ID: ${duplicateOrder.orderId || 'N/A'}\n` +
            `Date: ${duplicateOrder.date || 'N/A'}\n` +
            `Amount: KSh ${(duplicateOrder.total || 0).toLocaleString('en-KE')}\n\n` +
            `Please enter the correct M-Pesa transaction code from your payment confirmation message.`;
        alert(errorMessage);
        return;
    }

    const paymentInfo = window.tillPaymentInfo || {};
    const customerName = paymentInfo.customerName || document.getElementById('customerName')?.value || '';
    const customerPhone = paymentInfo.customerPhone || document.getElementById('customerPhone')?.value || '';
    const customerEmail = paymentInfo.customerEmail || document.getElementById('customerEmail')?.value || '';
    const subtotal = paymentInfo.subtotal || cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = paymentInfo.deliveryCost || getDeliveryCost();
    const total = paymentInfo.total || (subtotal + deliveryCost);

    // Get delivery information
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked');
    const deliveryAddress = document.getElementById('deliveryAddress')?.value || '';

    // Validate required fields
    if (!customerName || !customerPhone) {
        alert('Please fill in your name and phone number in the payment form first');
        closeTillPaymentModal();
        return;
    }

    // Validate delivery address if delivery is selected
    if (deliveryOption && (deliveryOption.value === 'nairobi-cbd' || deliveryOption.value === 'elsewhere')) {
        if (!deliveryAddress || deliveryAddress.trim() === '') {
            alert('Please provide delivery address/details for delivery option.');
            closeTillPaymentModal();
            return;
        }
    }

    // Get delivery option text
    let deliveryOptionText = 'Shop Pickup';
    if (deliveryOption) {
        switch (deliveryOption.value) {
            case 'pickup':
                deliveryOptionText = 'Shop Pickup';
                break;
            case 'nairobi-cbd':
                deliveryOptionText = 'Delivery within Nairobi CBD (KSh 250)';
                break;
            case 'elsewhere':
                deliveryOptionText = 'Delivery Elsewhere (within Kenya) (KSh 300)';
                break;
        }
    }

    // Generate Order ID early
    const orderId = 'ORD-' + Date.now();

    // Create order object
    const order = {
        orderId: orderId,
        date: new Date().toLocaleString('en-KE'),
        customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail
        },
        items: cart.map(item => {
            const product = products.find(p => p.id === item.id);
            return {
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
                productId: item.id || '',
                image: product?.image || item.image || ''
            };
        }),
        subtotal: subtotal,
        delivery: {
            option: deliveryOption ? deliveryOption.value : 'pickup',
            optionText: deliveryOptionText,
            cost: deliveryCost,
            address: deliveryAddress || ''
        },
        total: total,
        paymentMethod: 'M-Pesa Till (177104)',
        mpesaCode: validMpesaCode,
        skipTransactionCheck: true // CRITICAL: Skip strict check during creation
    };

    // Save order to Database if available
    const useDatabase = localStorage.getItem('useDatabase') === 'true';
    if (useDatabase) {
        try {
            console.log('💾 Saving order to Database before verification...');
            await apiService.createOrder(order);
            console.log('✅ Order saved to Database (pending verification)');
        } catch (orderError) {
            console.error('❌ Error saving order:', orderError);
            alert('Failed to initialize order. Please try again or contact support.');
            return;
        }
    }

    // Verify M-Pesa code (now checking against the saved order)
    const verificationResult = await verifyMpesaCodeBeforePayment(validMpesaCode, total, mpesaCodeInput, orderId);
    if (!verificationResult.valid) {
        // Verification failed
        return;
    }

    // Subtract quantity from products
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            const currentQuantity = product.quantity || 0;
            const purchasedQuantity = cartItem.quantity;
            product.quantity = Math.max(0, currentQuantity - purchasedQuantity);
        }
    });

    // Save updated products
    await saveProducts();

    // Refresh product display
    displayProducts(currentCategory);

    // Generate PDF receipt
    generateReceiptPDF(order);

    // Store order
    currentOrder = order;

    // Close modals
    closeTillPaymentModal();
    closePaymentModal();

    // Send receipt to WhatsApp
    try {
        if (!currentOrderPDF) {
            await generateReceiptPDF(order);
        }

        if (useDatabase) {
            try {
                await apiService.sendReceiptToWhatsApp(order);
                console.log('✅ Receipt sent to WhatsApp via backend');
            } catch (backendError) {
                console.error('❌ Backend WhatsApp send failed, trying frontend method:', backendError);
                sendReceiptViaWhatsAppSilent();
            }
        } else {
            sendReceiptViaWhatsAppSilent();
        }
    } catch (whatsappError) {
        console.error('❌ Error sending receipt to WhatsApp:', whatsappError);
    }

    // Clear cart
    cart = [];
    updateCartUI();
    saveCart();

    showNotification('Payment verified and order placed successfully!', 'success');
}
// Expose to window
window.completeTillPayment = completeTillPayment;

// Process Payment
async function processPayment(event) {
    try {
        event.preventDefault();

        // Check if cart is empty
        if (!cart || cart.length === 0) {
            alert('Your cart is empty. Please add items to cart before proceeding to payment.');
            closePaymentModal();
            return;
        }

        const customerName = document.getElementById('customerName')?.value?.trim();
        let customerPhone = document.getElementById('customerPhone')?.value?.trim() || '';
        const customerEmail = document.getElementById('customerEmail')?.value?.trim() || '';

        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'till';

        // Validate required fields
        if (!customerName || !customerPhone) {
            alert('Please fill in all required fields: Name and Phone Number.');
            if (!customerName) document.getElementById('customerName')?.focus();
            else if (!customerPhone) document.getElementById('customerPhone')?.focus();
            return;
        }
        const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked');
        const deliveryAddress = document.getElementById('deliveryAddress')?.value || '';

        // Validate delivery address if delivery is selected
        if (deliveryOption && (deliveryOption.value === 'nairobi-cbd' || deliveryOption.value === 'elsewhere')) {
            if (!deliveryAddress || deliveryAddress.trim() === '') {
                alert('Please provide delivery address/details for delivery option.');
                document.getElementById('deliveryAddress')?.focus();
                return;
            }
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCost = getDeliveryCost();
        const total = subtotal + deliveryCost;

        // Conditional logic based on payment method
        if (paymentMethod === 'stk-push') {
            await processSTKPushPayment(customerName, customerPhone, customerEmail, total, deliveryOption, deliveryAddress, subtotal, deliveryCost);
            // After STK push, close modal and return, as STK push will handle further steps
            closePaymentModal();
            return;
        } else {
            // Handle Till Number payment (existing flow)
            // Get all M-Pesa codes (first + additional)
            const allMpesaCodes = getAllMpesaCodes();

            // Validate that at least one M-Pesa code is provided
            if (allMpesaCodes.length === 0) {
                alert('Please enter at least one M-Pesa transaction code.');
                document.getElementById('mpesaCode')?.focus();
                return;
            }

            // Validate all M-Pesa codes
            for (const codeInfo of allMpesaCodes) {
                const validation = validateMpesaCode(codeInfo.code);
                if (!validation.valid) {
                    alert(`Invalid M-Pesa code: ${codeInfo.code}\n\n${validation.error}`);
                    const input = document.getElementById(codeInfo.inputId);
                    if (input) {
                        input.focus();
                        input.style.borderColor = '#f44336';
                        setTimeout(() => {
                            input.style.borderColor = '#ddd';
                        }, 3000);
                    }
                    return;
                }
            }

            // Show loading modal
            showPaymentVerificationModal();

            // Check if Database is available
            const useDatabase = localStorage.getItem('useDatabase') === 'true';

            // Track payment progress
            let totalPaid = 0;
            const paymentCodes = [];
            let remainingBalance = total;

            // Verify each M-Pesa code and track amounts
            for (let i = 0; i < allMpesaCodes.length; i++) {
                const codeInfo = allMpesaCodes[i];
                const validMpesaCode = codeInfo.code.toUpperCase().trim();
                const codeInput = document.getElementById(codeInfo.inputId);

                // Verify this M-Pesa code
                try {
                    // For additional codes, verify against remaining balance
                    const verifyAmount = (i === 0) ? total : remainingBalance;
                    const verificationResult = await verifyMpesaCodeBeforePayment(validMpesaCode, verifyAmount, codeInput);

                    if (!verificationResult.valid) {
                        hidePaymentVerificationModal(); // Hide loading modal
                        return; // Stop here - verification failed
                    }

                    // Get actual amount paid from this transaction
                    let actualAmount = verificationResult.actualAmount || verifyAmount;

                    // If it's a partial payment, use the actual amount
                    if (verificationResult.reason === 'partial_payment') {
                        actualAmount = verificationResult.actualAmount;
                    }

                    // Track this payment
                    totalPaid += actualAmount;
                    paymentCodes.push({ code: validMpesaCode, amount: actualAmount });
                    remainingBalance = total - totalPaid;

                    console.log(`💰 Payment ${i + 1}: Code ${validMpesaCode}, Amount: KSh ${actualAmount.toLocaleString('en-KE')}, Total Paid: KSh ${totalPaid.toLocaleString('en-KE')}, Remaining: KSh ${remainingBalance.toLocaleString('en-KE')}`);

                    // If partial payment detected and this is the first code, show additional input
                    if (verificationResult.reason === 'partial_payment' && i === 0 && remainingBalance > 0) {
                        hidePaymentVerificationModal(); // Hide loading modal
                        // Update payment progress
                        partialPaymentState.paymentCodes = paymentCodes;
                        updatePaymentProgress(total, totalPaid, remainingBalance);

                        // Show additional M-Pesa code input
                        const additionalIndex = allMpesaCodes.length; // Next index
                        addAdditionalMpesaCodeInput(remainingBalance, additionalIndex);

                        // Update payment amount in instructions
                        const paymentAmountSpan = document.getElementById('paymentAmount');
                        if (paymentAmountSpan) {
                            paymentAmountSpan.textContent = `KSh ${remainingBalance.toLocaleString('en-KE')}`;
                        }

                        showNotification(`Partial payment received: KSh ${actualAmount.toLocaleString('en-KE')}. Please enter M-Pesa code for remaining balance: KSh ${remainingBalance.toLocaleString('en-KE')}`, 'info');
                        return; // Stop here, wait for additional code
                    }

                } catch (verifyError) {
                    console.error('Error verifying M-Pesa code:', verifyError);

                    // Even if verification fails, check localStorage for duplicates
                    const duplicateOrder = checkDuplicateMpesaCodeLocal(validMpesaCode);
                    if (duplicateOrder) {
                        const errorMessage = `⚠️ This M-Pesa code has already been used!\n\n` +
                            `Order ID: ${duplicateOrder.orderId || 'N/A'}\n` +
                            `Date: ${duplicateOrder.date || 'N/A'}\n` +
                            `Amount: KSh ${duplicateOrder.total?.toLocaleString('en-KE') || 'N/A'}\n\n` +
                            `Please enter the correct M-Pesa transaction code from your payment confirmation message.\n\n` +
                            `If you believe this is an error, please contact us:\n` +
                            `WhatsApp: +254 724 904 692`;
                        hidePaymentVerificationModal(); // Hide loading modal
                        alert(errorMessage);
                        if (codeInput) {
                            codeInput.focus();
                            codeInput.style.borderColor = '#f44336';
                        }
                        showNotification('M-Pesa code already used. Please check and try again.', 'error');
                        return;
                    }

                    // CRITICAL SECURITY: Block payment if verification fails
                    // Never allow payment without proper verification
                    hidePaymentVerificationModal(); // Hide loading modal
                    const errorMessage = `❌ M-Pesa Verification Failed!\n\n` +
                        `Error: ${verifyError.message}\n\n` +
                        `⚠️ SECURITY: Payment cannot be accepted without proper verification.\n\n` +
                        `Please ensure:\n` +
                        `1. You have a stable internet connection\n` +
                        `2. You entered the correct M-Pesa transaction code\n` +
                        `3. The transaction was completed recently (within 24 hours)\n\n` +
                        `Please try again or contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    if (codeInput) {
                        codeInput.focus();
                        codeInput.style.borderColor = '#f44336';
                    }
                    showNotification('M-Pesa verification failed. Payment blocked for security.', 'error');
                    return;
                }
            }

            // Check if full payment has been made
            if (remainingBalance > 0) {
                hidePaymentVerificationModal(); // Hide loading modal
                // Still need more payment - show additional input
                partialPaymentState.paymentCodes = paymentCodes;
                updatePaymentProgress(total, totalPaid, remainingBalance);

                const additionalIndex = allMpesaCodes.length;
                addAdditionalMpesaCodeInput(remainingBalance, additionalIndex);

                // Update payment amount in instructions
                const paymentAmountSpan = document.getElementById('paymentAmount');
                if (paymentAmountSpan) {
                    paymentAmountSpan.textContent = `KSh ${remainingBalance.toLocaleString('en-KE')}`;
                }

                showNotification(`Payment incomplete. Amount paid: KSh ${totalPaid.toLocaleString('en-KE')}. Please enter M-Pesa code for remaining balance: KSh ${remainingBalance.toLocaleString('en-KE')}`, 'warning');
                return; // Stop here, wait for additional code
            }

            // Full payment received - proceed with order creation
            console.log('✅ Full payment received! Total paid: KSh', totalPaid.toLocaleString('en-KE'));
            hidePaymentVerificationModal(); // Hide loading modal - verification complete

            // Get delivery option text
            let deliveryOptionText = 'Shop Pickup';
            if (deliveryOption) {
                switch (deliveryOption.value) {
                    case 'pickup':
                        deliveryOptionText = 'Shop Pickup';
                        break;
                    case 'nairobi-cbd':
                        deliveryOptionText = 'Delivery within Nairobi CBD (KSh 250)';
                        break;
                    case 'elsewhere':
                        deliveryOptionText = 'Delivery Elsewhere (within Kenya) (KSh 300)';
                        break;
                }
            }

            // CRITICAL: Final duplicate check before creating order (race condition protection)
            // Check all payment codes for duplicates
            for (const payment of paymentCodes) {
                const finalDuplicateCheck = checkDuplicateMpesaCodeLocal(payment.code);
                if (finalDuplicateCheck) {
                    const errorMessage = `⚠️ M-Pesa code ${payment.code} has already been used!\n\n` +
                        `Order ID: ${finalDuplicateCheck.orderId || 'N/A'}\n` +
                        `Date: ${finalDuplicateCheck.date || 'N/A'}\n` +
                        `Amount: KSh ${finalDuplicateCheck.total?.toLocaleString('en-KE') || 'N/A'}\n\n` +
                        `Please enter the correct M-Pesa transaction code from your payment confirmation message.\n\n` +
                        `If you believe this is an error, please contact us:\n` +
                        `WhatsApp: +254 724 904 692`;
                    alert(errorMessage);
                    const codeInput = document.getElementById(allMpesaCodes.find(c => c.code === payment.code)?.inputId || 'mpesaCode');
                    if (codeInput) {
                        codeInput.focus();
                        codeInput.style.borderColor = '#f44336';
                    }
                    showNotification('M-Pesa code already used. Please check and try again.', 'error');
                    return; // Stop here - don't generate receipt
                }
            }

            // Combine all M-Pesa codes into a single string for the order
            const allMpesaCodesString = paymentCodes.map(p => `${p.code} (KSh ${p.amount.toLocaleString('en-KE')})`).join(', ');
            const primaryMpesaCode = paymentCodes[0]?.code || '';

            // Create order object
            const order = {
                orderId: 'ORD-' + Date.now(),
                date: new Date().toLocaleString('en-KE'),
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail
                },
                items: cart.map(item => {
                    // Find the product to get the image
                    const product = products.find(p => p.id === item.id);
                    return {
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.price * item.quantity,
                        productId: item.id || '',
                        image: product?.image || item.image || '' // Include image in order items
                    };
                }),
                subtotal: subtotal,
                delivery: {
                    option: deliveryOption ? deliveryOption.value : 'pickup',
                    optionText: deliveryOptionText,
                    cost: deliveryCost,
                    address: deliveryAddress || ''
                },
                total: total,
                totalPaid: totalPaid, // Track total paid (may differ from total if overpaid)
                paymentMethod: 'M-Pesa Till (177104)',
                mpesaCode: primaryMpesaCode, // Primary code for backward compatibility
                mpesaCodes: paymentCodes, // All payment codes with amounts
                mpesaCodesString: allMpesaCodesString // Human-readable string
            };

            // CRITICAL: Save order to localStorage FIRST (prevents duplicates immediately)
            saveOrderToLocalStorage(order);
            console.log('✅ Order saved to localStorage (prevents duplicate M-Pesa codes)');

            // Save order to Database if available
            if (useDatabase) {
                try {
                    await apiService.createOrder(order);
                    console.log('✅ Order saved to Database');
                } catch (orderError) {
                    console.error('❌ Error saving order:', orderError);

                    // Helper function to cleanup localStorage
                    const cleanupLocalStorage = () => {
                        try {
                            const ordersJson = localStorage.getItem('orders');
                            if (ordersJson) {
                                let orders = JSON.parse(ordersJson);
                                orders = orders.filter(o => o.orderId !== order.orderId);
                                localStorage.setItem('orders', JSON.stringify(orders));

                                // Remove all payment codes from used codes
                                const usedCodesJson = localStorage.getItem('usedMpesaCodes');
                                if (usedCodesJson) {
                                    let usedCodes = JSON.parse(usedCodesJson);
                                    paymentCodes.forEach(payment => {
                                        usedCodes = usedCodes.filter(c => c !== payment.code);
                                    });
                                    localStorage.setItem('usedMpesaCodes', JSON.stringify(usedCodes));
                                }
                            }
                        } catch (cleanupError) {
                            console.error('Error cleaning up localStorage:', cleanupError);
                        }
                    };

                    // CRITICAL: Check if it's an amount mismatch error
                    if (orderError.message && (orderError.message.includes('Amount mismatch') || orderError.message.includes('amount mismatch'))) {
                        cleanupLocalStorage();

                        // Parse error message to get amounts
                        let errorMessage = `❌ M-Pesa Transaction Amount Mismatch!\n\n`;
                        try {
                            // Try to extract amounts from error message
                            const amountMatch = orderError.message.match(/Expected: KSh ([\d,]+).*Found: KSh ([\d,]+)/);
                            if (amountMatch) {
                                errorMessage += `Expected Amount: KSh ${amountMatch[1]}\n`;
                                errorMessage += `Transaction Amount: KSh ${amountMatch[2]}\n\n`;
                            } else {
                                errorMessage += orderError.message + '\n\n';
                            }
                        } catch (parseError) {
                            errorMessage += orderError.message + '\n\n';
                        }

                        errorMessage += `The M-Pesa transaction amount does not match your order total.\n\n` +
                            `Please verify:\n` +
                            `1. You entered the correct M-Pesa transaction code\n` +
                            `2. You paid the correct amount (KSh ${total.toLocaleString('en-KE')})\n` +
                            `3. You selected the correct delivery option\n\n` +
                            `If you believe this is an error, please contact us:\n` +
                            `WhatsApp: +254 724 904 692`;
                        alert(errorMessage);
                        if (mpesaCodeInput) {
                            mpesaCodeInput.focus();
                            mpesaCodeInput.style.borderColor = '#f44336';
                        }
                        showNotification('M-Pesa transaction amount mismatch. Payment blocked.', 'error');
                        return; // Stop here - don't generate receipt
                    }

                    // Check if it's a date mismatch error
                    if (orderError.message && (orderError.message.includes('Date mismatch') || orderError.message.includes('date mismatch'))) {
                        cleanupLocalStorage();

                        const errorMessage = `❌ M-Pesa Transaction Date Invalid!\n\n` +
                            `The M-Pesa transaction date is outside the valid range (24 hours).\n\n` +
                            `${orderError.message}\n\n` +
                            `Please ensure you are using a recent transaction code from your M-Pesa confirmation message.\n\n` +
                            `If you believe this is an error, please contact us:\n` +
                            `WhatsApp: +254 724 904 692`;
                        alert(errorMessage);
                        if (mpesaCodeInput) {
                            mpesaCodeInput.focus();
                            mpesaCodeInput.style.borderColor = '#f44336';
                        }
                        showNotification('M-Pesa transaction date invalid. Payment blocked.', 'error');
                        return; // Stop here - don't generate receipt
                    }

                    // CRITICAL SECURITY: Check if transaction not found error
                    if (orderError.message && (orderError.message.includes('Transaction not found') || orderError.message.includes('transaction not found') || orderError.message.includes('not found in database'))) {
                        cleanupLocalStorage();

                        const errorMessage = `❌ M-Pesa Transaction Not Verified!\n\n` +
                            `${orderError.message}\n\n` +
                            `⚠️ SECURITY: Payment cannot be accepted until the transaction is verified through M-Pesa API.\n\n` +
                            `Please ensure:\n` +
                            `1. You completed the M-Pesa payment successfully\n` +
                            `2. You entered the correct M-Pesa transaction code\n` +
                            `3. You wait a few moments for the transaction to be received via webhook\n` +
                            `4. You try again after the transaction has been processed\n\n` +
                            `If you continue to have issues, please contact us:\n` +
                            `WhatsApp: +254 724 904 692\n\n` +
                            `This security measure prevents fake or guessed transaction codes from being accepted.`;
                        alert(errorMessage);
                        if (mpesaCodeInput) {
                            mpesaCodeInput.focus();
                            mpesaCodeInput.style.borderColor = '#f44336';
                        }
                        showNotification('Transaction not verified. Payment blocked for security.', 'error');
                        return; // Stop here - don't generate receipt
                    }

                    // Check if it's a duplicate code error
                    if (orderError.message && (orderError.message.includes('Duplicate') || orderError.message.includes('already been used'))) {
                        cleanupLocalStorage();

                        const errorMessage = `⚠️ This M-Pesa code has already been used in Database!\n\n` +
                            `Please enter the correct M-Pesa transaction code from your payment confirmation message.\n\n` +
                            `If you believe this is an error, please contact us:\n` +
                            `WhatsApp: +254 724 904 692`;
                        alert(errorMessage);
                        if (mpesaCodeInput) {
                            mpesaCodeInput.focus();
                            mpesaCodeInput.style.borderColor = '#f44336';
                        }
                        showNotification('M-Pesa code already used. Please check and try again.', 'error');
                        return; // Stop here - don't generate receipt
                    }

                    // Check if it's a verification error
                    if (orderError.message && (orderError.message.includes('Verification error') || orderError.message.includes('verification error'))) {
                        cleanupLocalStorage();

                        const errorMessage = `❌ M-Pesa Verification Error!\n\n` +
                            `${orderError.message}\n\n` +
                            `Payment cannot be accepted until verification is successful.\n\n` +
                            `Please try again or contact us:\n` +
                            `WhatsApp: +254 724 904 692`;
                        alert(errorMessage);
                        if (mpesaCodeInput) {
                            mpesaCodeInput.focus();
                            mpesaCodeInput.style.borderColor = '#f44336';
                        }
                        showNotification('Verification error. Payment blocked. Please try again.', 'error');
                        return; // Stop here - don't generate receipt
                    }

                    // For other errors, show warning but continue (order is already saved to localStorage)
                    console.warn('⚠️ Order save to Database failed, but order is saved to localStorage');
                    showNotification('Order saved locally. Database save failed. Please contact support if needed.', 'warning');
                }
            }

            // Subtract quantity from products when payment is completed
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    const currentQuantity = product.quantity || 0;
                    const purchasedQuantity = cartItem.quantity;
                    product.quantity = Math.max(0, currentQuantity - purchasedQuantity);
                }
            });

            // Save updated products and REFRESH from server to ensure authoritative sync
            try {
                await saveProducts();
                // REFRESH from server to sync with other devices immediately
                if (useDatabase) {
                    await loadProducts();
                }
            } catch (saveError) {
                console.error('❌ Error saving/refreshing products:', saveError);
            }

            // Refresh product display to show updated quantities
            try {
                displayProducts(currentCategory);
            } catch (displayError) {
                console.error('❌ Error displaying products:', displayError);
                // Continue even if display fails
            }

            // Store order
            currentOrder = order;

            // Close payment modal silently
            closePaymentModal();

            // Open success modal instead of just showing a notification
            const successMessage = `Payment for Order ${orderId} verified successfully! Your items are now reserved.`;
            openSuccessModal(successMessage);
            
            // Generate PDF in background (already stored in currentOrderPDF if generated)
            if (!currentOrderPDF) {
                generateReceiptPDF(order).catch(console.error);
            }
            
            // Still try the backend sync for logging, but don't wait for it
            const useDatabase = localStorage.getItem('useDatabase') === 'true';
            if (useDatabase) {
                apiService.sendReceiptToWhatsApp(order, currentOrderPDF).catch(err => {
                    console.warn('Backend sync log failed:', err);
                });
            }
            
            try {
                // Clear cart
                cart = [];
                updateCartUI();
                saveCart();
                toggleCart();
                // No notification shown - receipt is sent to WhatsApp automatically
            } catch (clearCartError) {
                console.error('❌ Error clearing cart:', clearCartError);
                // Continue execution even if cart clear fails, as payment was successful
            }
        } // This brace closes the 'else' block for the 'till' payment method.
    }
    catch (error) { // This is the correct catch block for the entire function
        hidePaymentVerificationModal();
        console.error('❌ Error processing payment:', error);
        alert('An error occurred while processing your payment. Please try again or contact support.\n\nError: ' + error.message);
        showNotification('Payment processing failed. Please try again.', 'error');
    }
}

// Process STK Push (M-Pesa Prompt) payment
async function processSTKPushPayment(customerName, customerPhone, customerEmail, total, deliveryOption, deliveryAddress, subtotal, deliveryCost) {
    try {
        // Show loading modal
        showPaymentVerificationModal();

        // Check if backend is available (STK Push needs backend API, not necessarily Database)
        console.log('🔍 Checking backend availability for STK Push...');
        let backendAvailable = false;
        try {
            backendAvailable = await apiService.checkBackend();
            console.log('📊 Backend available:', backendAvailable);
        } catch (backendError) {
            console.error('❌ Error checking backend:', backendError);
            backendAvailable = false;
        }

        if (!backendAvailable) {
            hidePaymentVerificationModal();

            // Provide helpful error message based on environment
            const isProduction = window.location.hostname === 'trendydresses.co.ke' ||
                window.location.hostname === 'www.trendydresses.co.ke';

            let errorMessage = 'STK Push payment requires the backend server to be running.\n\n';

            if (isProduction) {
                errorMessage += 'For Production Website:\n';
                errorMessage += '1. SSH into your production server\n';
                errorMessage += '2. Navigate to backend folder: cd /path/to/backend\n';
                errorMessage += '3. Install dependencies: npm install\n';
                errorMessage += '4. Start with PM2: pm2 start npm --name "trendy-dresses-api" -- start\n';
                errorMessage += '5. Save PM2: pm2 save && pm2 startup\n';
                errorMessage += '6. Configure Nginx/Apache reverse proxy (see PRODUCTION_BACKEND_SETUP.md)\n\n';
                errorMessage += 'Backend URL being checked: ' + apiService.baseURL + '\n\n';
                errorMessage += 'See PRODUCTION_BACKEND_SETUP.md for detailed instructions.';
            } else {
                errorMessage += 'For Local Development:\n';
                errorMessage += '1. Navigate to backend folder\n';
                errorMessage += '2. Run: npm start\n';
                errorMessage += '3. Wait for "✅ Connected to Database successfully"\n';
                errorMessage += '4. Refresh this page\n\n';
                errorMessage += 'Backend URL: ' + apiService.baseURL;
            }

            alert(errorMessage);
            console.error('❌ Backend not available at:', apiService.baseURL);
            console.error('📋 See PRODUCTION_BACKEND_SETUP.md or backend/QUICK_START.md for setup instructions');
            return;
        }

        console.log('✅ Backend is available - proceeding with STK Push');

        // Generate order ID first
        const orderId = 'ORD-' + Date.now();

        // Get delivery option text
        let deliveryOptionText = 'Shop Pickup';
        if (deliveryOption) {
            switch (deliveryOption.value) {
                case 'pickup':
                    deliveryOptionText = 'Shop Pickup';
                    break;
                case 'nairobi-cbd':
                    deliveryOptionText = 'Delivery within Nairobi CBD (KSh 250)';
                    break;
                case 'elsewhere':
                    deliveryOptionText = 'Delivery Elsewhere (within Kenya) (KSh 300)';
                    break;
            }
        }

        // Format phone number for STK Push API (ensure it's in 254 format)
        let formattedPhone = customerPhone.trim();
        if (!formattedPhone.startsWith('254')) {
            // Remove leading 0 and add 254
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (formattedPhone.length === 9) {
                // 7XX format - add 254 prefix
                formattedPhone = '254' + formattedPhone;
            }
        }

        // Validate phone number format
        if (!/^2547\d{8}$/.test(formattedPhone)) {
            hidePaymentVerificationModal();
            alert('Please enter a valid M-Pesa phone number.\n\nFormat: 0724904692 or 254724904692\n\nThe number must be registered with M-Pesa.');
            document.getElementById('customerPhone')?.focus();
            return;
        }

        // Create and save the order *before* initiating STK Push
        // This ensures the order exists in the database for the backend to retrieve the amount
        const order = {
            orderId: orderId,
            date: new Date().toLocaleString('en-KE'),
            customer: { name: customerName, phone: customerPhone, email: customerEmail },
            items: cart.map(item => {
                const product = products.find(p => p.id === item.id);
                return {
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity,
                    productId: item.id || '',
                    image: product?.image || item.image || ''
                };
            }),
            subtotal: subtotal,
            delivery: {
                option: deliveryOption ? deliveryOption.value : 'pickup',
                optionText: deliveryOptionText,
                cost: deliveryCost,
                address: deliveryAddress || ''
            },
            total: total,
            totalPaid: 0,
            paymentMethod: 'M-Pesa STK Push',
            mpesaCode: `PENDING_STK_${orderId}`,
            paymentStatus: 'pending', // Add paymentStatus
            skipTransactionCheck: true // Skip M-Pesa code verification for STK Push orders
        };

        try {
            console.log('💾 Saving order to database before initiating STK Push...');
            await apiService.createOrder(order);
            console.log(`✅ Order ${orderId} saved successfully.`);
        } catch (orderError) {
            hidePaymentVerificationModal();
            console.error('❌ Failed to create order before STK Push:', orderError);
            alert(`Failed to create your order in the system before payment.\n\nError: ${orderError.message}\n\nPlease try again.`);
            return;
        }

        // Initiate STK Push
        console.log('📱 Initiating STK Push payment...');
        console.log('📞 Phone number:', formattedPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1***$3')); // Mask middle digits for privacy
        console.log('💰 Amount: KSh', total.toLocaleString('en-KE'));
        console.log('📦 Order ID:', orderId);

        const stkResult = await apiService.initiateSTKPush(
            formattedPhone, // Use formatted phone number
            total,
            orderId,
            `Payment for order ${orderId}`
        );

        if (!stkResult.success) {
            hidePaymentVerificationModal();
            alert(`Failed to initiate M-Pesa payment prompt:\n\n${stkResult.responseDescription || 'Unknown error'}\n\nPlease ensure your phone number is correct and registered with M-Pesa.`);
            console.error('❌ STK Push initiation failed:', stkResult);
            return;
        }

        // Show waiting message with phone number
        const verificationModal = document.getElementById('paymentVerificationModal');
        const verificationText = verificationModal?.querySelector('p');
        if (verificationText) {
            const displayPhone = formattedPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1***$3'); // Mask for display
            verificationText.innerHTML = `A payment prompt has been sent to <strong>${displayPhone}</strong>.<br><br>Please check your phone and enter your M-Pesa PIN to complete the payment...`;
        }

        console.log('✅ STK Push initiated:', stkResult.checkoutRequestID);
        console.log('📱 Customer message:', stkResult.customerMessage);

        // Poll for payment completion
        const checkoutRequestID = stkResult.checkout_request_id || stkResult.checkoutRequestID;
        let attempts = 0;
        const maxAttempts = 60; // Poll for up to 2 minutes (60 * 2 seconds)

        const pollPaymentStatus = async () => {
            attempts++;

            try {
                // Query STK Push status
                const statusResult = await apiService.querySTKPushStatus(checkoutRequestID);

                if (statusResult.status === 'COMPLETED' || statusResult.resultCode === '0' || statusResult.success === true) {
                    // Payment successful! Check for transaction in database
                    console.log('✅ Payment completed via STK Push');
                    
                    // Immediately feedback to user
                    if (verificationText) {
                        verificationText.innerHTML = '<span style="color: #4caf50; font-weight: bold; font-size: 1.2rem;">✅ Payment Verified!</span><br><br>Processing your order, please wait...';
                        const spinner = verificationModal?.querySelector('.spinner');
                        if (spinner) spinner.style.borderTopColor = '#4caf50';
                    }

                    const receiptNumber = statusResult.mpesa_receipt || statusResult.mpesaReceiptNumber;
                    const transactionAmount = statusResult.amount;

                    // Create order with the receipt number
                    await createOrderFromSTKPush(
                        orderId,
                        customerName,
                        customerPhone,
                        customerEmail,
                        total,
                        deliveryOption,
                        deliveryAddress,
                        subtotal,
                        deliveryCost,
                        deliveryOptionText,
                        receiptNumber
                    );
                    
                    // Force hide modal just in case createOrderFromSTKPush didn't or had an internal error
                    hidePaymentVerificationModal();
                    return; // Exit polling
                } else if (statusResult.status === 'PENDING' || statusResult.resultCode === '1032' || statusResult.status === 'WAITING') {
                    // Payment still pending - keep polling
                    if (attempts < maxAttempts) {
                        setTimeout(pollPaymentStatus, 2000);
                    } else {
                        hidePaymentVerificationModal();
                        alert('Payment timeout. Please check your M-Pesa messages or use Till Number payment method.');
                    }
                } else {
                    // Payment failed or error
                    hidePaymentVerificationModal();
                    alert(`Payment failed:\n\n${statusResult.message || statusResult.resultDesc || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error polling STK Push status:', error);
                if (attempts < maxAttempts) {
                    setTimeout(pollPaymentStatus, 2000);
                } else {
                    hidePaymentVerificationModal();
                    alert('Error checking payment status. Please check your M-Pesa messages or use Till Number payment method.');
                }
            }
        };

        // Start polling
        setTimeout(pollPaymentStatus, 2000); // Start after 2 seconds

    } catch (error) {
        hidePaymentVerificationModal();
        console.error('❌ Error processing STK Push payment:', error);
        alert(`Failed to initiate M-Pesa payment:\n\n${error.message}\n\nPlease try again or use Till Number payment method.`);
    }
}

// Create order from STK Push payment
async function createOrderFromSTKPush(orderId, customerName, customerPhone, customerEmail, total, deliveryOption, deliveryAddress, subtotal, deliveryCost, deliveryOptionText, mpesaCode) {
    try {
        hidePaymentVerificationModal();

        // Create order object
        const order = {
            orderId: orderId,
            date: new Date().toLocaleString('en-KE'),
            customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail
            },
            items: cart.map(item => {
                const product = products.find(p => p.id === item.id);
                return {
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity,
                    productId: item.id || '',
                    image: product?.image || item.image || ''
                };
            }),
            subtotal: subtotal,
            delivery: {
                option: deliveryOption ? deliveryOption.value : 'pickup',
                optionText: deliveryOptionText,
                cost: deliveryCost,
                address: deliveryAddress || ''
            },
            total: total,
            totalPaid: total,
            paymentMethod: 'M-Pesa STK Push',
            mpesaCode: mpesaCode || `PENDING_${orderId}`,
            mpesaCodes: mpesaCode ? [{ code: mpesaCode, amount: total }] : [],
            mpesaCodesString: mpesaCode || 'Pending'
        };

        // Save order to localStorage first
        saveOrderToLocalStorage(order);
        console.log('✅ Order saved to localStorage');

        // Save order to Database if available
        const useDatabase = localStorage.getItem('useDatabase') === 'true';
        if (useDatabase) {
            try {
                await apiService.createOrder(order);
                console.log('✅ Order saved to Database');
            } catch (orderError) {
                console.error('❌ Error saving order:', orderError);
                // Continue even if Database save fails
            }
        }

        // Subtract quantity from products
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                const currentQuantity = product.quantity || 0;
                const purchasedQuantity = cartItem.quantity;
                product.quantity = Math.max(0, currentQuantity - purchasedQuantity);
            }
        });

        // Save updated products and REFRESH from server
        try {
            await saveProducts();
            if (useDatabase) {
                await loadProducts();
            }
        } catch (saveError) {
            console.error('❌ Error saving/refreshing products:', saveError);
        }

        // Refresh product display
        try {
            displayProducts(currentCategory);
        } catch (displayError) {
            console.error('❌ Error displaying products:', displayError);
        }

        // Generate PDF receipt
        try {
            await generateReceiptPDF(order);
        } catch (pdfError) {
            console.error('❌ Error generating PDF receipt:', pdfError);
        }

        // Store order
        currentOrder = order;

        // Close payment modal
        closePaymentModal();

        // Open success modal
        const successMessage = 'Success! Your order has been placed and payment confirmed.';
        openSuccessModal(successMessage);

        // Generate PDF in background
        if (!currentOrderPDF) {
            generateReceiptPDF(order).catch(console.error);
        }

        // Backend sync for logging
        if (useDatabase) {
            apiService.sendReceiptToWhatsApp(order, currentOrderPDF).catch(err => {
                console.warn('Backend sync log failed:', err);
            });
        }

        // Cart cleared above
        
        // Small delay before closing everything for visual feedback
        setTimeout(() => {
            if (typeof toggleCart === 'function') toggleCart();
            // If they are on cart page, redirect or stay
        }, 1500);

    } catch (error) {
        console.error('❌ Error creating order from STK Push:', error);
        alert('Error creating order. Please contact support.');
    }
}

// Current order for receipt
let currentOrder = null;

// Generate PDF Receipt
async function generateReceiptPDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Company Info
    doc.setFontSize(20);
    doc.text('TRENDY DRESSES', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Nairobi, Moi avenue, Imenti HSE Glory Exhibition Basement, Shop B4', 105, 28, { align: 'center' });
    doc.text('Phone: +254 724 904 692 | Email: Trendy dresses790@gmail.com', 105, 34, { align: 'center' });

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);

    // Receipt Title
    doc.setFontSize(16);
    doc.text('RECEIPT', 105, 50, { align: 'center' });

    // Payment Stamp will be added later in the center of the page

    // Order Details
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.orderId}`, 20, 60);
    doc.text(`Date: ${order.date}`, 20, 66);
    doc.text(`Payment Method: ${order.paymentMethod}`, 20, 72);
    doc.text(`M-Pesa Code: ${order.mpesaCode}`, 20, 78);

    // Customer Info
    doc.text(`Customer: ${order.customer.name}`, 20, 86);
    doc.text(`Phone: ${order.customer.phone}`, 20, 92);
    if (order.customer.email) {
        doc.text(`Email: ${order.customer.email}`, 20, 98);
    }

    // Payment Stamp - Round stamp next to customer details (right side)
    const stampX = 150; // X position (right side, next to customer details)
    const stampY = 92; // Y position (aligned with customer details)
    const stampRadius = 18; // Radius of the circle

    // Draw filled circle background (white)
    doc.setFillColor(255, 255, 255); // White fill
    doc.setDrawColor(0, 150, 0); // Dark green border
    doc.setLineWidth(2.5);
    doc.circle(stampX, stampY, stampRadius, 'FD'); // 'FD' for fill and draw

    // Draw inner circle border for depth
    doc.setDrawColor(0, 200, 0); // Medium green
    doc.setLineWidth(1);
    doc.circle(stampX, stampY, stampRadius - 3, 'S'); // Inner border

    // Add shop name at the top of the stamp
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 0); // Dark green text
    doc.text('TRENDY DRESSES', stampX, stampY - 7, { align: 'center' });

    // Add decorative line
    doc.setDrawColor(0, 150, 0);
    doc.setLineWidth(0.5);
    doc.line(stampX - 10, stampY - 4, stampX + 10, stampY - 4);

    // Add "PAID" text in the center (bold and prominent)
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 120, 0); // Dark green text
    doc.text('PAID', stampX, stampY + 1, { align: 'center' });

    // Add decorative line below PAID
    doc.setDrawColor(0, 150, 0);
    doc.setLineWidth(0.5);
    doc.line(stampX - 8, stampY + 4, stampX + 8, stampY + 4);

    // Add date below "PAID"
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    const stampDate = new Date().toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    doc.text(stampDate, stampX, stampY + 8, { align: 'center' });

    // Reset colors and styles
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.setDrawColor(200, 200, 200); // Reset to gray
    doc.setLineWidth(0.5); // Reset line width
    doc.setFillColor(255, 255, 255); // Reset fill to white

    // Line
    doc.line(20, 104, 190, 104);

    // Items Header
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, 112);
    doc.text('Qty', 120, 112);
    doc.text('Price', 150, 112);
    doc.text('Subtotal', 170, 112);
    doc.setFont(undefined, 'normal');

    // Items with images
    let yPos = 120;
    for (const item of order.items) {
        doc.setFontSize(10);

        // Find product to get image - try multiple ways
        let itemImage = item.image || '';
        if (!itemImage || itemImage.trim() === '') {
            const product = products.find(p =>
                p.id === item.productId ||
                p._id === item.productId ||
                (p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase())
            );
            itemImage = product?.image || '';
        }

        const hasImage = itemImage && itemImage.trim() !== '';

        // Add item image if available - ensure it's visible
        if (hasImage) {
            try {
                // Add image (35x35mm for better visibility, left side)
                const imgWidth = 35;
                const imgHeight = 35;
                const imgX = 20;
                const imgY = yPos - 30;

                // Convert base64 data URL to usable format
                let imageData = itemImage.trim();

                // Handle different image formats
                if (imageData.startsWith('data:image/')) {
                    // Already a data URL with format
                    const formatMatch = imageData.match(/data:image\/(\w+);base64,/);
                    const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                    // Extract base64 part
                    const base64Data = imageData.split(',')[1];
                    imageData = `data:image/${format.toLowerCase()};base64,${base64Data}`;

                    // Try to add image
                    try {
                        doc.addImage(imageData, format, imgX, imgY, imgWidth, imgHeight);
                    } catch (formatError) {
                        // If format fails, try JPEG
                        doc.addImage(imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                    }
                } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
                    // URL - log warning but don't skip, user can see it's an image URL
                    console.log('⚠️ Image URL not directly supported in PDF:', item.name);
                    // Still show item name
                    doc.text(item.name.substring(0, 40), imgX + imgWidth + 5, yPos);
                } else {
                    // Assume base64 without data URL prefix - try JPEG first
                    imageData = 'data:image/jpeg;base64,' + imageData;
                    try {
                        doc.addImage(imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                    } catch (jpegError) {
                        // Try PNG
                        imageData = 'data:image/png;base64,' + itemImage;
                        doc.addImage(imageData, 'PNG', imgX, imgY, imgWidth, imgHeight);
                    }
                }

                // Item name (moved to the right of image)
                doc.text(item.name.substring(0, 30), imgX + imgWidth + 8, yPos);
                yPos += 12; // Extra space for image
            } catch (imgError) {
                console.error('Error adding image to PDF for item:', item.name, imgError);
                console.error('Image data preview:', itemImage.substring(0, 50));
                // Fallback to text only
                doc.text(item.name.substring(0, 40), 20, yPos);
            }
        } else {
            // No image - just text
            doc.text(item.name.substring(0, 40), 20, yPos);
        }

        // Quantity, Price, Subtotal (shifted right if image exists)
        const textStartX = hasImage ? 60 : 120;
        doc.text(item.quantity.toString(), textStartX, yPos);
        doc.text(`KSh ${item.price.toLocaleString('en-KE')}`, textStartX + 30, yPos);
        doc.text(`KSh ${item.subtotal.toLocaleString('en-KE')}`, textStartX + 50, yPos);

        yPos += hasImage ? 40 : 6; // More space if image exists (increased for better visibility)

        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
    }

    // Line
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Subtotal and Delivery
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal: KSh ${(order.subtotal || order.total).toLocaleString('en-KE')}`, 150, yPos);

    // Delivery cost
    if (order.delivery && order.delivery.cost > 0) {
        yPos += 6;
        doc.text(`Delivery: KSh ${order.delivery.cost.toLocaleString('en-KE')}`, 150, yPos);
    }

    // Line before total
    doc.line(20, yPos + 4, 190, yPos + 4);

    // Total
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: KSh ${order.total.toLocaleString('en-KE')}`, 150, yPos);

    // Delivery Information
    if (order.delivery) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Delivery Information:', 20, yPos);

        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.text(`Option: ${order.delivery.optionText || 'Shop Pickup'}`, 20, yPos);

        if (order.delivery.address && order.delivery.address.trim() !== '') {
            yPos += 6;
            // Split address into multiple lines if it's too long
            const addressLines = doc.splitTextToSize(`Address: ${order.delivery.address}`, 170);
            doc.text(addressLines, 20, yPos);
            yPos += (addressLines.length - 1) * 6;
        }
    }

    // Delivery Message
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 100, 0); // Green color
    if (order.delivery && order.delivery.option !== 'pickup') {
        doc.text('Parcel will be delivered within 24hrs', 105, yPos, { align: 'center' });
    } else {
        doc.text('Ready for pickup at our shop', 105, yPos, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0); // Reset to black

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your purchase!', 105, 270, { align: 'center' });
    doc.text('For inquiries, contact us via WhatsApp: +254 724 904 692', 105, 276, { align: 'center' });

    // Save PDF
    const pdfBlob = doc.output('blob');
    currentOrderPDF = pdfBlob;

    // Auto download
    doc.save(`Receipt_${order.orderId}.pdf`);
}

let currentOrderPDF = null;

// Open Receipt Modal
function openReceiptModal() {
    const modal = document.getElementById('receiptModal');
    const overlay = document.getElementById('receiptOverlay');
    modal.classList.add('show');
    overlay.classList.add('show');
    overlay.style.display = 'block';
}

// Close Receipt Modal
function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    const overlay = document.getElementById('receiptOverlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
    overlay.style.display = 'none';
}

// Download Receipt
function downloadReceipt() {
    if (currentOrderPDF) {
        const url = URL.createObjectURL(currentOrderPDF);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${currentOrder.orderId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Send Receipt via WhatsApp (with notification)
function sendReceiptViaWhatsApp() {
    if (!currentOrder) return;

    // Create message with order details
    const message = `Hello! I've completed my purchase at Trendy Dresses.

Order ID: ${currentOrder.orderId}
Date: ${currentOrder.date}
Customer: ${currentOrder.customer.name}
Phone: ${currentOrder.customer.phone}
Total: KSh ${currentOrder.total.toLocaleString('en-KE')}
M-Pesa Code: ${currentOrder.mpesaCode}

Please find the receipt attached. Thank you!`;

    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = websiteContent.contactPhone;

    // Open WhatsApp with message
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Also download the PDF
    downloadReceipt();

    showNotification('Receipt sent via WhatsApp! Please attach the downloaded PDF.');
}

// Send Receipt via WhatsApp Silently (no notification on website)
// This is a fallback method that opens WhatsApp with pre-filled message
// The backend method is preferred for automatic sending
function sendReceiptViaWhatsAppSilent() {
    // Keep existing version but we'll use a user-triggered one mostly
    sendReceiptViaWhatsApp();
}

// User-triggered WhatsApp receipt
function sendReceiptViaWhatsApp() {
    if (!currentOrder) {
        showNotification('No order data found. Please try again or contact support.', 'error');
        return;
    }

    // Create message with order details
    const message = `*NEW ORDER RECEIVED* 📦

Order ID: ${currentOrder.orderId}
Date: ${currentOrder.date}
Customer: ${currentOrder.customer.name}
Phone: ${currentOrder.customer.phone}
Email: ${currentOrder.customer.email || 'N/A'}

*Items:*
${currentOrder.items.map(item => `• ${item.name} x${item.quantity} - KSh ${item.subtotal.toLocaleString('en-KE')}`).join('\n')}

Subtotal: KSh ${(currentOrder.subtotal || currentOrder.total).toLocaleString('en-KE')}
${currentOrder.delivery && currentOrder.delivery.cost > 0 ? `Delivery (${currentOrder.delivery.optionText}): KSh ${currentOrder.delivery.cost.toLocaleString('en-KE')}\n` : ''}Total: KSh ${currentOrder.total.toLocaleString('en-KE')}

Payment Method: ${currentOrder.paymentMethod}
M-Pesa Code: ${currentOrder.mpesaCode}

${currentOrder.delivery && currentOrder.delivery.option !== 'pickup' ? `*Delivery Address:*\n${currentOrder.delivery.address}\n\n` : ''}Receipt PDF attached. ✅`;

    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = websiteContent.contactPhone || '254702660144';

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Also auto-download the PDF
    downloadReceipt();
}

function openSuccessModal(message) {
    const modal = document.getElementById('successModal');
    const overlay = document.getElementById('successModalOverlay');
    const messageDiv = document.getElementById('successModalMessage');
    
    if (message && messageDiv) {
        messageDiv.textContent = message;
    }
    
    if (modal && overlay) {
        modal.classList.add('show');
        overlay.classList.add('show');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    const overlay = document.getElementById('successModalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
    }
    
    // Refresh products just in case
    loadProducts();
}

async function openMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    const overlay = document.getElementById('myOrdersModalOverlay');
    const ordersList = document.getElementById('myOrdersList');
    
    if (modal && overlay) {
        modal.classList.add('show');
        overlay.classList.add('show');
    }

    if (!ordersList) return;

    // Load orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (e) {
        console.error('Error parsing local orders:', e);
    }

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No past orders found on this device.</p>
            </div>
        `;
        return;
    }

    // Show loading state
    ordersList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.6;"></i>
            <p>Fetching latest status for your ${orders.length} order(s)...</p>
        </div>
    `;

    // Fetch latest status for each order from the backend concurrently
    let updatedOrders = [];
    const fetchPromises = orders.map(async (order) => {
        try {
            // Check if backend available
            const useDatabase = localStorage.getItem('useDatabase') === 'true';
            let latestOrderData = null;
            
            if (useDatabase && apiService) {
                latestOrderData = await apiService.getOrder(order.orderId);
            }
            
            // If backend returned latest data, merge it
            if (latestOrderData) {
                // Keep local items if backend doesn't have them in exact shape, but update status
                order.delivery = latestOrderData.delivery || order.delivery;
                order.paymentStatus = latestOrderData.paymentStatus || order.paymentStatus;
                if (latestOrderData.mpesaCode) order.mpesaCode = latestOrderData.mpesaCode;
            }
        } catch (error) {
            console.warn(`Could not fetch latest status for order ${order.orderId}:`, error);
        }
        return order;
    });

    updatedOrders = await Promise.all(fetchPromises);
    
    // Save updated orders back to local storage
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    // Render orders
    // Sort so newest are first
    updatedOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    ordersList.innerHTML = updatedOrders.map(order => {
        const isDelivered = order.delivery && order.delivery.status === 'delivered';
        const statusColor = isDelivered ? 'var(--success-color)' : '#ff9800';
        const statusIcon = isDelivered ? 'fa-check-circle' : 'fa-truck';
        const statusText = isDelivered ? 'Delivered' : 'Pending';

        return `
            <div style="background: var(--light-color); padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <strong style="display: block; font-size: 1.1rem;">${order.orderId}</strong>
                        <small style="color: #666;">${order.date}</small>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; background: ${statusColor}20; color: ${statusColor}; font-weight: bold; font-size: 0.85rem;">
                            <i class="fas ${statusIcon}"></i> ${statusText}
                        </span>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <strong style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Items:</strong>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #555;">
                        ${(order.items || []).map(item => `
                            <li style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #eee;">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>KSh ${item.subtotal.toLocaleString('en-KE')}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd; font-weight: bold;">
                        <span>Total:</span>
                        <span>KSh ${order.total.toLocaleString('en-KE')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function closeMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    const overlay = document.getElementById('myOrdersModalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// ============================================
// localStorage Usage:
// ONLY for UI-related temporary data:
// - Cart (temporary shopping cart)
// - Admin credentials (session data)
// - UI preferences (filters, theme, etc.)
// 
// NOT for core app data:
// - Products → Database API (permanent storage)
// - Orders → Database API (permanent storage)
// ============================================

// Save Cart to LocalStorage (UI-related data only)
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load Cart from LocalStorage (UI-related data only)
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (error) {
            console.error('❌ Error parsing cart from localStorage:', error);
            cart = [];
        }
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    let bgColor = 'var(--success-color)'; // Default green
    if (type === 'error') {
        bgColor = '#f44336'; // Red
    } else if (type === 'warning') {
        bgColor = '#ff9800'; // Orange
    } else if (type === 'info') {
        bgColor = '#2196F3'; // Blue
    }
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: var(--shadow);
        z-index: 3000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Show Cart Added Pop-up Modal
function showCartAddedModal(product) {
    const modal = document.getElementById('cartAddedModal');
    const overlay = document.getElementById('cartAddedOverlay');
    const messageDiv = document.getElementById('cartAddedMessage');

    if (!modal || !overlay || !messageDiv) {
        // Fallback to notification if modal elements not found
        showNotification(`${product.name} (Size: ${getSizeDisplay(product.size)}) added to cart!`);
        return;
    }

    // Set message
    const finalPrice = getFinalPrice(product);
    messageDiv.innerHTML = `
        <div style="font-weight: bold; color: var(--dark-color); margin-bottom: 8px;">${product.name}</div>
        <div style="color: #666;">Size: <strong>${getSizeDisplay(product.size)}</strong></div>
        <div style="color: var(--primary-color); font-weight: bold; margin-top: 8px; font-size: 1.2rem;">
            KSh ${finalPrice.toLocaleString('en-KE')}
        </div>
    `;

    // Show modal
    modal.classList.add('show');
    overlay.classList.add('show');
    overlay.style.display = 'block';

    // Auto-close after 3 seconds
    setTimeout(() => {
        closeCartAddedModal();
    }, 3000);
}

// Close Cart Added Modal
function closeCartAddedModal() {
    const modal = document.getElementById('cartAddedModal');
    const overlay = document.getElementById('cartAddedOverlay');

    if (modal) {
        modal.classList.remove('show');
    }
    if (overlay) {
        overlay.classList.remove('show');
        overlay.style.display = 'none';
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Admin Functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('show');
    overlay.classList.add('show');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
    document.getElementById('loginForm').reset();
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalBtnText = loginBtn.textContent;

    try {
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        const result = await apiService.login(username, password);

        if (result.success) {
            isAdmin = true;
            // No longer storing isAdmin in localStorage for security
            // Session cookie handles persistence
            await checkAdminStatus();
            closeLoginModal();
            showNotification('Login successful!');
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback: Allow demo login if backend is not available
        if (username === 'admin' && password === 'admin') {
            console.log('⚠️ Backend not available, allowing demo login');
            isAdmin = true;
            localStorage.setItem('wasAdmin', 'true');
            await checkAdminStatus();
            closeLoginModal();
            showNotification('Demo login successful! (Backend not available)');
        } else {
            alert('Login failed: ' + error.message + '\n\nFor demo: use admin/admin');
        }
    } finally {
        loginBtn.textContent = originalBtnText;
        loginBtn.disabled = false;
    }
}

async function checkAdminStatus() {
    try {
        const status = await apiService.checkAuth();
        isAdmin = status.authenticated;
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }

    const loginBtn = document.getElementById('loginBtn');
    const adminBtn = document.getElementById('adminBtn');

    if (isAdmin) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (adminBtn) adminBtn.style.display = 'none';
    }

    // Refresh product display to show/hide product count
    // Only if displayProducts is defined
    if (typeof displayProducts === 'function') {
        displayProducts(currentCategory);
    }
}

async function logout() {
    try {
        await apiService.logout();
        isAdmin = false;
        // localStorage.removeItem('isAdmin'); // No longer used
        await checkAdminStatus();
        closeAdminPanel();
        showNotification('Logged out successfully!');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out', 'error');
    }
}

function openAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    panel.classList.add('open');
    overlay.style.display = 'block';
    // Clear search bar when opening admin panel
    const searchInput = document.getElementById('adminProductSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    loadAdminProducts();
    loadAdminContent();
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    panel.classList.remove('open');
    overlay.style.display = 'none';
}

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    const clickedBtn = event.target.closest('.admin-tab');
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    // Load orders if orders tab is selected
    if (tabName === 'orders') {
        loadAdminOrders();
    } else if (tabName === 'completed') {
        loadCompletedOrders();
    }
}

// Product Management
function loadAdminProducts(searchQuery = '') {
    const productsList = document.getElementById('adminProductsList');
    const searchResults = document.getElementById('adminSearchResults');
    const totalCountElement = document.getElementById('adminTotalCount');

    console.log('📋 loadAdminProducts called - products count:', products.length);
    console.log('📋 Products array sample:', products.slice(0, 2));

    // Update total product count (always show all products count)
    if (totalCountElement) {
        totalCountElement.textContent = products.length;
    }

    // Filter products based on search query - shows ALL products if no search
    let filteredProducts = products; // Start with ALL products
    if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredProducts = products.filter(product => {
            const name = product.name.toLowerCase();
            const category = product.category.toLowerCase();
            const size = (product.size || '').toLowerCase();
            const price = product.price.toString();
            const discount = (product.discount || 0).toString();
            const quantity = (product.quantity || 0).toString();

            return name.includes(query) ||
                category.includes(query) ||
                size.includes(query) ||
                price.includes(query) ||
                discount.includes(query) ||
                quantity.includes(query);
        });

        // Show search results count
        if (searchResults) {
            if (filteredProducts.length === 0) {
                searchResults.innerHTML = `<i class="fas fa-info-circle"></i> No products found matching "${searchQuery}"`;
                searchResults.style.color = '#f44336';
            } else {
                searchResults.innerHTML = `<i class="fas fa-check-circle"></i> Found ${filteredProducts.length} product(s) matching "${searchQuery}" (out of ${products.length} total)`;
                searchResults.style.color = '#4caf50';
            }
        }
    } else {
        // Clear search results when no search query - show all products
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    // Display ALL filtered products - no limits, no pagination
    if (filteredProducts.length === 0) {
        if (productsList) {
            productsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No products found.</p>';
        }
        return;
    }

    // Display ALL products - no limits, no pagination, shows everything
    if (!productsList) {
        console.error('adminProductsList element not found in DOM');
        return;
    }
    productsList.innerHTML = filteredProducts.map(product => {
        const discount = product.discount || 0;
        const finalPrice = getFinalPrice(product);
        const hasDiscount = discount > 0;
        const quantity = product.quantity || 0;
        const isSoldOut = quantity <= 0;

        return `
        <div class="admin-product-item">
            <div class="admin-product-info">
                <div class="admin-product-name">${product.name}</div>
                <div class="admin-product-details">
                    ${product.category} - Size: ${getSizeDisplay(product.size)} - 
                    ${hasDiscount ? `
                        <span style="text-decoration: line-through; color: #999; margin-right: 5px;">
                            KSh ${product.price.toLocaleString('en-KE')}
                        </span>
                        <span style="color: var(--primary-color); font-weight: bold;">
                            KSh ${Math.round(finalPrice).toLocaleString('en-KE')}
                        </span>
                        <span style="color: #f44336; margin-left: 5px;">(${discount}% off)</span>
                    ` : `
                        KSh ${product.price.toLocaleString('en-KE')}
                    `}
                    ${isSoldOut ? `
                        <span style="color: #f44336; margin-left: 10px; font-weight: bold;">[SOLD OUT]</span>
                    ` : `
                        <span style="color: #666; margin-left: 10px;">- Stock: ${quantity}</span>
                    `}
                </div>
            </div>
            <div class="admin-product-actions">
                <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                    <div style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 5px;">
                        <span style="font-size: 0.85rem; color: #666; font-weight: 500;">Stock:</span>
                        <button onclick="adjustQuantity('${product.id}', -1)" style="background: #f44336; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;" title="Decrease by 1">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" id="qty-${product.id}" value="${quantity}" min="0" 
                               onchange="setQuantity('${product.id}', this.value)" 
                               style="width: 60px; text-align: center; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-weight: bold;">
                        <button onclick="adjustQuantity('${product.id}', 1)" style="background: #4caf50; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;" title="Increase by 1">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button onclick="adjustQuantity('${product.id}', 5)" style="background: #2196F3; color: white; border: none; width: 32px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; padding: 0 4px;" title="Add 5">
                            +5
                        </button>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-edit" type="button" onclick="console.log('🔴 EDIT CLICKED with ID:', '${product.id}'); editProduct('${product.id}')" style="font-size: 0.85rem; padding: 6px 12px;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')" style="font-size: 0.85rem; padding: 6px 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Search admin products
function searchAdminProducts(query) {
    loadAdminProducts(query);
}

function openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productId').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productDiscount').value = '0';
    document.getElementById('productQuantity').value = '1';
    const productImageFile = document.getElementById('productImageFile');
    if (productImageFile) {
        productImageFile.value = '';
    }
    document.getElementById('productForm').reset();
    // Reset form fields after reset
    document.getElementById('productImage').value = '';
    document.getElementById('productDiscount').value = '0';
    document.getElementById('productQuantity').value = '1';
    previewProductImage(''); // Clear preview

    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('show');
    overlay.classList.add('show');
}

// Save product (Create or Update)
async function saveProduct(event) {
    if (event) event.preventDefault();

    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Upload Item';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const size = document.getElementById('productSize').value;
        const image = document.getElementById('productImage').value;
        const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
        const discount = parseInt(document.getElementById('productDiscount').value) || 0;

        if (!name || !category || !price || !size || !image) {
            showNotification('Please fill in all required fields', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        const productData = {
            name,
            category,
            price,
            size,
            image,
            quantity,
            discount
        };

        let result;
        if (id) {
            // Update existing product
            console.log('📝 Updating product:', id);
            result = await apiService.updateProduct(id, productData);
            
            // CRITICAL FIX: Update local products array immediately
            // This prevents the subsequent saveProducts() sync from overwriting the DB with stale data
            const index = products.findIndex(p => p.id === id || p._id === id);
            if (index !== -1) {
                // Merge result into existing product to preserve any other fields
                products[index] = { ...products[index], ...productData };
                // Ensure ID is preserved/normalized
                if (result && (result.id || result._id)) products[index].id = result.id || result._id;
            }
            
            showNotification('Product updated successfully!', 'success');
        } else {
            // Create new product
            console.log('✨ Creating new product');
            result = await apiService.createProduct(productData);
            products.push(result); // Add the newly created product to the local array
            showNotification('Product created successfully!', 'success');
        }

        // Close modal
        closeModal();

        // Sync and refresh products list to ensure consistency
        await saveProducts(); // Explicitly sync current 'products' array to database
        await loadProducts(); // Reload from database to ensure local 'products' array is authoritative
        if (typeof loadAdminProducts === 'function') {
            await loadAdminProducts();
        }

    } catch (error) {
        console.error('❌ Error saving product:', error);
        showNotification(error.message || 'Failed to save product', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

function closeModal() {
    // Close product modal
    const productModal = document.getElementById('productModal');
    const loginModal = document.getElementById('loginModal');
    const overlay = document.getElementById('modalOverlay');

    if (productModal) {
        productModal.classList.remove('show');
    }
    if (loginModal) {
        loginModal.classList.remove('show');
    }
    if (overlay) {
        overlay.classList.remove('show');
    }

    // Reset product form if it exists
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.reset();
    }
    const productImageFile = document.getElementById('productImageFile');
    if (productImageFile) {
        productImageFile.value = '';
    }
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.value = '';
        previewProductImage('');
    }

    // Reset login form if it exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
}

function closeProductModal() {
    closeModal();
}

function closeLoginModal() {
    closeModal();
}

function editProduct(productId) {
    console.log('✏️ EDIT BUTTON CLICKED - editProduct called with ID:', productId, 'Type:', typeof productId);
    console.log('📦 Current products array:', JSON.stringify(products.slice(0, 2))); // Log first 2 products as sample
    
    try {
        console.log('✏️ editProduct called with ID:', productId, 'Type:', typeof productId);
        console.log('📦 Current products count:', products.length);
        console.log('📦 Product IDs:', products.map(p => ({ id: p.id, _id: p._id, name: p.name })));

        // Handle both Database ObjectId (24 char string), numeric IDs, and string IDs (e.g. prod_...)
        let id = productId;
        if (typeof productId === 'string' && (productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId) || productId.startsWith('prod_'))) {
            // Database ObjectId or prod_ ID - use as is
            id = productId;
            console.log('✅ Detected Database ObjectId or prod_ ID:', id);
        } else {
            // Try to parse as number
            const parsedId = typeof productId === 'string' ? parseInt(productId) : productId;
            if (!isNaN(parsedId) && parsedId.toString() === productId.toString()) {
                id = parsedId;
                console.log('✅ Parsed numeric ID:', id);
            } else if (typeof productId === 'string' && productId.length > 0) {
                // Fallback: treat as string ID if it's a non-empty string
                id = productId;
                console.log('✅ Detected string ID:', id);
            } else {
                console.error('❌ Invalid product ID for edit:', productId);
                showNotification('Error: Invalid product ID', 'error');
                return;
            }
        }

        // Find product - handle both Database ObjectId and numeric IDs
        const product = products.find(p => {
            // Check both id and _id fields
            const pId = p.id || p._id;
            const pIdStr = String(pId);

            if (typeof id === 'string' && (id.length === 24 || id.startsWith('prod_'))) {
                // Database ObjectId or prod_ ID comparison
                return (pIdStr === id) || (String(p._id) === id) || (String(p.id) === id);
            } else {
                // Numeric ID comparison
                const productIdNum = typeof pId === 'string' ? parseInt(pId) : pId;
                return productIdNum === id;
            }
        });

        if (!product) {
            console.error('❌ Product not found for edit. ID:', id);
            console.log('Available products:', products.map(p => ({
                id: p.id,
                _id: p._id,
                idType: typeof p.id,
                name: p.name
            })));
            showNotification('Product not found! Check console for details.', 'error');
            return;
        }

        console.log('✅ Product found:', product.name, 'ID:', product.id || product._id);

        // Get form elements
        const modalTitle = document.getElementById('productModalTitle');
        const productIdInput = document.getElementById('productId');
        const productNameInput = document.getElementById('productName');
        const productCategoryInput = document.getElementById('productCategory');
        const productPriceInput = document.getElementById('productPrice');
        const productDiscountInput = document.getElementById('productDiscount');
        const productQuantityInput = document.getElementById('productQuantity');
        const productSizeInput = document.getElementById('productSize');
        const imageInput = document.getElementById('productImage');
        const imageFileInput = document.getElementById('productImageFile');

        console.log('🔍 Form elements found:', {
            modalTitle: !!modalTitle,
            productIdInput: !!productIdInput,
            productNameInput: !!productNameInput,
            productCategoryInput: !!productCategoryInput,
            productPriceInput: !!productPriceInput,
            productDiscountInput: !!productDiscountInput,
            productQuantityInput: !!productQuantityInput,
            productSizeInput: !!productSizeInput,
            imageInput: !!imageInput,
            imageFileInput: !!imageFileInput
        });

        if (!modalTitle || !productIdInput || !productNameInput) {
            console.error('❌ Required form elements not found');
            showNotification('Error: Form elements not found', 'error');
            return;
        }

        // Populate form fields
        console.log('📝 Populating form fields with product data');
        modalTitle.textContent = 'Edit Product';
        productIdInput.value = product.id || product._id || '';
        productNameInput.value = product.name || '';
        productCategoryInput.value = product.category || 'dresses';
        productPriceInput.value = product.price || 0;
        productDiscountInput.value = product.discount || 0;
        productQuantityInput.value = product.quantity || 0;
        productSizeInput.value = product.size || '';

        const productImage = product.image || '';
        if (imageInput) {
            imageInput.value = productImage;
        }
        if (imageFileInput) {
            imageFileInput.value = ''; // Reset file input
        }
        previewProductImage(productImage);
        
        console.log('✅ Form fields populated with values:', {
            id: productIdInput.value,
            name: productNameInput.value,
            category: productCategoryInput.value,
            price: productPriceInput.value
        });

        // Show modal
        const modal = document.getElementById('productModal');
        const overlay = document.getElementById('modalOverlay');
        console.log('🔍 Modal elements:', { modal: !!modal, overlay: !!overlay });
        
        if (modal && overlay) {
            modal.classList.add('show');
            overlay.classList.add('show');
            console.log('✅ Modal opened successfully - show class added');
            console.log('📺 Modal classes:', modal.className);
        } else {
            console.error('❌ Modal elements not found:', { modal: !!modal, overlay: !!overlay });
            showNotification('Error: Modal not found', 'error');
        }
    } catch (error) {
        console.error('❌ Error in editProduct:', error);
        console.error('Error stack:', error.stack);
        showNotification('Error loading product for editing: ' + error.message, 'error');
    }
}

// Adjust product quantity (+ or -)
async function adjustQuantity(productId, change) {
    // Handle both Database ObjectId (24 char string), numeric IDs, and string IDs (e.g. prod_...)
    let id = productId;
    if (typeof productId === 'string' && (productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId) || productId.startsWith('prod_'))) {
        // Database ObjectId or prod_ ID - use as is
        id = productId;
    } else {
        // Try to parse as number
        const parsedId = typeof productId === 'string' ? parseInt(productId) : productId;
        if (!isNaN(parsedId) && parsedId.toString() === productId.toString()) {
            id = parsedId;
        } else if (typeof productId === 'string' && productId.length > 0) {
            // Fallback: treat as string ID if it's a non-empty string
            id = productId;
        } else {
            console.error('❌ Invalid product ID for quantity adjustment:', productId);
            showNotification('Error: Invalid product ID', 'error');
            return;
        }
    }

    // Find product - handle both Database ObjectId and numeric IDs
    const product = products.find(p => {
        // Check both id and _id fields
        const pId = p.id || p._id;
        const pIdStr = String(pId);

        if (typeof id === 'string' && (id.length === 24 || id.startsWith('prod_'))) {
            // Database ObjectId or prod_ ID comparison
            return (pIdStr === id) || (String(p._id) === id) || (String(p.id) === id);
        } else {
            // Numeric ID comparison
            const productIdNum = typeof pId === 'string' ? parseInt(pId) : pId;
            return productIdNum === id;
        }
    });

    if (!product) {
        console.error('❌ Product not found for adjustQuantity. ID:', id);
        showNotification('Product not found!', 'error');
        return;
    }

    const currentQty = parseInt(product.quantity) || 0;
    const newQty = Math.max(0, currentQty + change);
    const useDatabase = localStorage.getItem('useDatabase') === 'true';

    // Update via Database API if available
    if (useDatabase) {
        try {
            // Use the actual product ID (could be _id or id)
            const productIdForAPI = product._id || product.id || id;
            await apiService.updateQuantity(productIdForAPI, newQty);
            console.log('✅ Quantity updated via Database API');
        } catch (error) {
            console.error('❌ Error updating quantity via Database API:', error);
            showNotification('Error updating stock: ' + error.message, 'error');
            return;
        }
    }

    product.quantity = newQty;

    // Update the input field immediately (use original productId for input field ID)
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (qtyInput) {
        qtyInput.value = newQty;
    }

    // Save to localStorage as backup
    if (!useDatabase) {
        await saveProducts();
    } else {
        // Update local cache if needed
        saveProductsToLocalCache();
    }

    // After updating quantity, force a full reload from the database to ensure consistency
    await loadProducts();

    // Update displays
    displayProducts(currentCategory);
    const searchInput = document.getElementById('adminProductSearch');
    const searchQuery = searchInput ? searchInput.value : '';
    // Don't reload everything, just update the UI to prevent jumping
    // loadAdminProducts(searchQuery); 

    const action = change > 0 ? 'added' : 'removed';
    const amount = Math.abs(change);
    showNotification(`Stock updated: ${amount} item(s) ${action}. New stock: ${newQty}`, 'success');

    console.log(`✅ Quantity adjusted for product ${id}: ${currentQty} → ${newQty}`);
}

async function setQuantity(productId, qtyValue) {
    const qty = parseInt(qtyValue);
    if (isNaN(qty) || qty < 0) return;

    console.log('🔄 setQuantity called with ID:', productId, 'Qty:', qty);

    // Handle both Database ObjectId (24 char string), numeric IDs, and string IDs (e.g. prod_...)
    let id = productId;
    if (typeof productId === 'string' && (productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId) || productId.startsWith('prod_'))) {
        // Database ObjectId or prod_ ID - use as is
        id = productId;
    } else {
        // Try to parse as number
        const parsedId = typeof productId === 'string' ? parseInt(productId) : productId;
        if (!isNaN(parsedId) && parsedId.toString() === productId.toString()) {
            id = parsedId;
        } else if (typeof productId === 'string' && productId.length > 0) {
            // Fallback: treat as string ID if it's a non-empty string
            id = productId;
        } else {
            console.error('❌ Invalid product ID for set quantity:', productId);
            return;
        }
    }

    // Find product - handle both Database ObjectId and numeric IDs
    const product = products.find(p => {
        // Check both id and _id fields
        const pId = p.id || p._id;
        const pIdStr = String(pId);

        if (typeof id === 'string' && (id.length === 24 || id.startsWith('prod_'))) {
            // Database ObjectId or prod_ ID comparison
            return (pIdStr === id) || (String(p._id) === id) || (String(p.id) === id);
        } else {
            // Numeric ID comparison
            const productIdNum = typeof pId === 'string' ? parseInt(pId) : pId;
            return productIdNum === id;
        }
    });

    if (!product) {
        console.error('❌ Product not found for setQuantity. ID:', id);
        return;
    }

    const oldQty = parseInt(product.quantity) || 0;
    if (oldQty === qty) return; // No change

    const useDatabase = localStorage.getItem('useDatabase') === 'true';

    // Update via Database API if available
    if (useDatabase) {
        try {
            // Use the actual product ID (could be _id or id)
            const productIdForAPI = product._id || product.id || id;
            await apiService.updateQuantity(productIdForAPI, qty);
            console.log('✅ Quantity updated via Database API');
        } catch (error) {
            console.error('❌ Error updating quantity via Database API:', error);
            showNotification('Error updating stock: ' + error.message, 'error');
            // Revert input value
            const qtyInput = document.getElementById(`qty-${productId}`);
            if (qtyInput) {
                qtyInput.value = oldQty;
            }
            return;
        }
    }

    product.quantity = qty;

    // Save to localStorage as backup
    if (!useDatabase) {
        await saveProducts();
    } else {
        saveProductsToLocalCache();
    }

    // Update displays
    displayProducts(currentCategory);

    const change = qty - oldQty;
    showNotification(`Stock set to ${qty} (${change > 0 ? '+' : ''}${change} from previous)`, 'success');
    console.log(`✅ Quantity set for product ${id}: ${oldQty} → ${qty}`);
}

function saveProductsToLocalCache() {
    try {
        // When using Database, save lightweight version to avoid quota issues
        const lightweightProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            discount: p.discount || 0,
            quantity: p.quantity || 0,
            size: p.size || 'M',
            image: '' // Don't save images to localStorage
        }));
        localStorage.setItem('products', JSON.stringify(lightweightProducts));
    } catch (error) {
        console.warn('Could not update localStorage cache:', error);
    }
}

function deleteProduct(productId, event) {
    // Prevent any event propagation issues
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('🗑️ deleteProduct function called with:', productId, typeof productId);

    // Handle async operation properly when called from onclick
    (async () => {
        try {
            // Handle both Database ObjectId (24 char string), numeric IDs, and string IDs (e.g. prod_...)
            let id = productId;
            if (typeof productId === 'string' && (productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId) || productId.startsWith('prod_'))) {
                // Database ObjectId or prod_ ID - use as is
                id = productId;
            } else {
                // Try to parse as number
                const parsedId = typeof productId === 'string' ? parseInt(productId) : productId;
                if (!isNaN(parsedId) && parsedId.toString() === productId.toString()) {
                    id = parsedId;
                } else if (typeof productId === 'string' && productId.length > 0) {
                    // Fallback: treat as string ID if it's a non-empty string
                    id = productId;
                } else {
                    console.error('❌ Invalid product ID:', productId);
                    alert('Error: Invalid product ID: ' + productId);
                    showNotification('Error: Invalid product ID', 'error');
                    return;
                }
            }

            console.log('🗑️ Using ID:', id);

            // Find product first to show its name in confirmation and get index
            const index = products.findIndex(p => {
                // Handle both Database ObjectId and numeric IDs
                if (typeof id === 'string' && (id.length === 24 || id.startsWith('prod_'))) {
                    // Database ObjectId or prod_ ID comparison
                    return (p.id === id) || (p._id === id);
                } else {
                    // Numeric ID comparison
                    const productIdNum = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return productIdNum === id;
                }
            });

            if (index === -1) {
                showNotification('Product not found!', 'error');
                console.error('❌ Product not found with ID:', id);
                console.log('Available products:', products.map(p => ({ id: p.id, name: p.name })));
                return;
            }

            // Get product name and full product for confirmation and restore
            const productName = products[index].name;
            const productToDelete = { ...products[index] }; // Copy for potential restore

            console.log('🗑️ Product found at index:', index, 'Name:', productName);
            console.log('Current products count:', products.length);

            // Store deletion info globally for the confirmation modal
            window.pendingDelete = {
                id: id,
                index: index,
                name: productName,
                product: productToDelete
            };

            // Show custom confirmation modal instead of browser confirm
            showDeleteConfirmationModal(productName);

            // Don't proceed with deletion yet - wait for user to confirm in modal
            return;
        } catch (error) {
            console.error('❌ Error in deleteProduct:', error);
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    })();
}

// Show custom delete confirmation modal
function showDeleteConfirmationModal(productName) {
    const modal = document.getElementById('deleteConfirmModal');
    const overlay = document.getElementById('deleteConfirmOverlay');
    const message = document.getElementById('deleteConfirmMessage');

    if (modal && overlay && message) {
        message.textContent = `Are you sure you want to delete "${productName}"?`;

        // Show overlay
        overlay.style.display = 'block';

        // Show modal with proper animation
        modal.style.display = 'block';
        // Add show class for animation (opacity and scale)
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        document.body.style.overflow = 'hidden';
        console.log('✅ Delete confirmation modal shown');
    } else {
        console.error('❌ Delete confirmation modal elements not found');
        // Fallback to browser confirm
        if (confirm(`Delete "${productName}"? This cannot be undone.`)) {
            confirmDelete();
        }
    }
}

// Close delete confirmation modal
function cancelDelete() {
    const modal = document.getElementById('deleteConfirmModal');
    const overlay = document.getElementById('deleteConfirmOverlay');

    // Remove show class first for animation
    if (modal) {
        modal.classList.remove('show');
        // Hide after animation
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';

    // Clear pending delete
    window.pendingDelete = null;
    console.log('❌ Delete cancelled by user');
    showNotification('Delete cancelled - product kept', 'info');
}

// Confirm and proceed with deletion
async function confirmDelete() {
    if (!window.pendingDelete) {
        console.error('❌ No pending delete found');
        showNotification('Error: No product selected for deletion', 'error');
        cancelDelete();
        return;
    }

    const { id, index, name: productName, product: productToDelete } = window.pendingDelete;

    // Close modal first
    cancelDelete();

    console.log('✅ User confirmed deletion - proceeding with delete');
    console.log('🗑️ Deleting product:', productName, productToDelete);

    try {
        // Remove product from array immediately (optimistic update)
        products.splice(index, 1);
        console.log('✅ Product removed from array. New count:', products.length);

        // Delete from ALL storage locations (Database, localStorage, IndexedDB)
        const deleteResult = await deleteProductFromAllStorage(id);

        if (deleteResult.success) {
            console.log('✅ Product deleted from storage locations');

            // Check if Database is connected before syncing
            let shouldSyncToDatabase = false;
            try {
                const backendAvailable = await apiService.checkBackend();
                if (backendAvailable) {
                    const dbStatus = await apiService.checkDatabaseStatus();
                    shouldSyncToDatabase = (dbStatus.readyState === 1);
                }
            } catch (error) {
                console.log('ℹ️ Could not check Database status - will skip Database sync');
            }

            // Sync remaining products to all storage locations to ensure consistency
            // This saves remaining products to localStorage/IndexedDB (and Database if connected)
            console.log('🔄 Syncing remaining products to all storage locations...');
            const syncResult = await syncProductsToAllStorage(products, {
                preserveImages: true,
                skipDatabase: !shouldSyncToDatabase // Skip Database if not connected
            });

            if (syncResult.success) {
                console.log('✅ Remaining products synced to storage locations');

                // Update products array with synced products (in case Database IDs changed)
                if (syncResult.products && syncResult.products.length > 0) {
                    // Update products array with synced products (preserve order and add Database IDs)
                    syncResult.products.forEach((syncedProduct, idx) => {
                        if (idx < products.length) {
                            // Update existing product with synced data (especially Database ID)
                            const currentProduct = products[idx];
                            products[idx] = {
                                ...currentProduct,
                                id: syncedProduct.id || currentProduct.id,
                                _id: syncedProduct.id || currentProduct._id || currentProduct.id
                            };
                        }
                    });
                }

                // CRITICAL: Ensure products are saved to localStorage/IndexedDB after sync
                // (Sync should have done this, but we verify to ensure persistence)
                try {
                    const productsJson = JSON.stringify(products);
                    localStorage.setItem('products', productsJson);
                    console.log(`✅ Verified ${products.length} products saved to localStorage (after deletion)`);

                    // Also save to IndexedDB
                    await storageManager.init();
                    if (storageManager.useIndexedDB && storageManager.db) {
                        await storageManager.saveProducts(products);
                        console.log(`✅ Verified ${products.length} products saved to IndexedDB (after deletion)`);
                    }
                } catch (error) {
                    console.error('❌ Error verifying products after deletion:', error);
                }
            } else {
                console.warn('⚠️ Failed to sync remaining products to some storage locations');
                // Still save to localStorage/IndexedDB directly as backup
                try {
                    const productsJson = JSON.stringify(products);
                    localStorage.setItem('products', productsJson);
                    console.log(`✅ Saved ${products.length} products directly to localStorage (backup after deletion)`);
                } catch (error) {
                    console.error('❌ Error saving products to localStorage:', error);
                }
            }

            // Reload products from Database if available (to get latest state and ensure sync)
            let productsReloaded = false;
            try {
                const backendAvailable = await apiService.checkBackend();
                if (backendAvailable) {
                    console.log('🔄 Reloading products from Database after deletion...');
                    await loadProducts();
                    productsReloaded = true;
                    console.log('✅ Products reloaded from Database. Product count:', products.length);
                } else {
                    console.log('ℹ️ Backend not available - using local products array');
                }
            } catch (reloadError) {
                console.warn('⚠️ Could not reload from Database (using local data):', reloadError.message);
                // Continue with local products
            }

            // Update UI with remaining products immediately (no delay needed)
            console.log(`✅ Products array has ${products.length} products (after deletion)`);
            console.log('🔄 Refreshing product display...');
            currentCategory = 'all';
            displayProducts('all');
            console.log('✅ Product display refreshed');

            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-category') === 'all') {
                    btn.classList.add('active');
                }
            });

            // Preserve search query if there is one and refresh admin products list
            const searchInput = document.getElementById('adminProductSearch');
            const searchQuery = searchInput ? searchInput.value : '';
            console.log('🔄 Refreshing admin products list...');
            loadAdminProducts(searchQuery);
            console.log('✅ Admin products list refreshed');

            console.log('✅ Product deleted successfully from all storage locations');
            showNotification('Product deleted successfully from all storage locations!', 'success');

            // Note: We intentionally don't reload from Database here because:
            // 1. Database wasn't synced during deletion (database wasn't connected)
            // 2. Database still has the deleted products
            // 3. When Database connects and we sync remaining products, deleted products will be removed automatically
        } else {
            console.error('❌ Failed to delete product from any storage location');
            showNotification('Error: Failed to delete product from any storage location', 'error');

            // Restore product to array if deletion failed
            products.splice(index, 0, productToDelete);
            console.log('⚠️ Product restored to array due to deletion failure');
        }

        // Clear pending delete
        window.pendingDelete = null;
    } catch (error) {
        console.error('❌ Error in confirmDelete:', error);
        showNotification('Error deleting product: ' + error.message, 'error');

        // Restore product to array if deletion failed
        if (window.pendingDelete) {
            const { index, product: productToDelete } = window.pendingDelete;
            products.splice(index, 0, productToDelete);
            console.log('⚠️ Product restored to array due to error');
        }

        // Clear pending delete on error
        window.pendingDelete = null;
    }
}

async function saveProducts() {
    try {
        const productsToSave = [...products];
        console.log('💾 [saveProducts] Saving to local storage only... Products count:', productsToSave.length);

        // Save to IndexedDB (as cache)
        let indexedResult = false;
        try {
            await storageManager.init();
            if (storageManager.useIndexedDB && storageManager.db) {
                indexedResult = await storageManager.saveProducts(productsToSave);
            }
        } catch (idbErr) {
            console.warn('⚠️ IndexedDB sync failed:', idbErr.message);
        }

        // Save to localStorage (as backup)
        try {
            localStorage.setItem('products', JSON.stringify(productsToSave));
            return true;
        } catch (lsErr) {
            console.error('❌ localStorage save failed:', lsErr);
            return indexedResult; // Return true if IndexedDB succeeded
        }
    } catch (error) {
        console.error('❌ [saveProducts] Unexpected error:', error);
        return false;
    }
}

async function loadProducts() {
    // Show loading spinner
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #666;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="font-size: 1.1rem;">Loading products...</p>
            </div>
        `;
    }

    try {
        let loadedProducts = [];
        let loadSource = 'none';

        // Check if Database backend is available AND database is actually connected
        let useDatabase = false;
        let databaseConnected = false;

        try {
            console.log('🔍 Checking Database backend availability...');
            const backendAvailable = await apiService.checkBackend();

            if (backendAvailable) {
                console.log('🔍 Backend is available - checking Database connection...');
                try {
                    const dbStatus = await apiService.checkDatabaseStatus();
                    databaseConnected = dbStatus && dbStatus.readyState === 1;

                    if (databaseConnected) {
                        useDatabase = true;
                        localStorage.setItem('useDatabase', 'true');
                        console.log('✅ Database is connected - will use Database');
                        console.log(`   Database: ${dbStatus.name || 'trendy-dresses'}`);
                        console.log(`   Host: ${dbStatus.host || 'connected'}`);
                    } else {
                        const statusText = dbStatus?.readyStateText || 'unknown';
                        const readyState = dbStatus?.readyState || 0;
                        console.warn(`⚠️ Database backend available but database not connected`);
                        console.warn(`   Status: ${statusText} (ReadyState: ${readyState})`);
                        console.warn(`   Will use fallback storage (localStorage/IndexedDB)`);
                        useDatabase = false;
                        localStorage.setItem('useDatabase', 'false');
                    }
                } catch (dbError) {
                    console.warn('⚠️ Error checking Database connection status:', dbError.message);
                    useDatabase = false;
                    localStorage.setItem('useDatabase', 'false');
                }
            } else {
                console.log('ℹ️ Backend not available - will use fallback storage');
                useDatabase = false;
                localStorage.setItem('useDatabase', 'false');
            }
        } catch (checkError) {
            console.warn('⚠️ Error during Database availability check:', checkError.message);
            useDatabase = false;
            localStorage.setItem('useDatabase', 'false');
        }

        // Check localStorage/IndexedDB first to see what we have locally
        let localProducts = [];
        let localProductCount = 0;
        try {
            // Check localStorage
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                try {
                    localProducts = JSON.parse(savedProducts);
                    localProductCount = localProducts.length;
                    console.log(`📦 Found ${localProductCount} products in localStorage`);
                } catch (error) {
                    console.error('❌ Error parsing localStorage products:', error);
                }
            }

            // Check IndexedDB
            await storageManager.init();
            if (storageManager.useIndexedDB && storageManager.db) {
                const indexedProducts = await storageManager.loadProducts();
                if (indexedProducts && indexedProducts.length > 0) {
                    if (indexedProducts.length > localProductCount) {
                        localProducts = indexedProducts;
                        localProductCount = indexedProducts.length;
                        console.log(`📦 Found ${localProductCount} products in IndexedDB (using IndexedDB)`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error checking local storage:', error);
        }

        // PRIORITY: Database is PERMANENT, CENTRALIZED storage - primary source of truth
        if (useDatabase && databaseConnected) {
            // Update localStorage preference to Database
            localStorage.setItem('useDatabase', 'true');
            localStorage.setItem('preferredStorage', 'database');

            try {
                // Step 1: Load products from Database (PERMANENT, CENTRALIZED storage) - WITHOUT images for speed
                const dbProducts = await apiService.getProducts('all', false);
                console.log(`📦 Loaded ${dbProducts.length} product records from Database (metadata only)`);

                // Step 1.5: Cache Database data to IndexedDB for offline access
                try {
                    await storageManager.init();
                    if (storageManager.useIndexedDB && storageManager.db) {
                        await storageManager.syncFromDatabase(dbProducts);
                        console.log(`✅ Cached Database data to IndexedDB for offline access`);
                    }
                } catch (cacheError) {
                    console.warn('⚠️ Could not cache to IndexedDB:', cacheError.message);
                    // Continue - caching is optional
                }

                // Step 1.6: Load images for products that have them (lazy load)
                // This is done asynchronously after initial display
                if (dbProducts.length > 0) {
                    console.log('🖼️ Loading product images in background...');
                    loadProductImagesLazy(dbProducts).catch(err => {
                        console.warn('⚠️ Some product images failed to load:', err.message);
                    });
                }

                // Step 2: Use Database products as authoritative
                loadedProducts = dbProducts.map(p => ({
                    ...p,
                    id: p._id || p.id,
                    image: p.image || '' // Will be empty, loaded lazily
                }));
                loadSource = 'Database (permanent, centralized)';
                console.log(`📦 Using ${loadedProducts.length} products from Database (authoritative source)`);

                // Step 3: Update local cache (IndexedDB/localStorage) to match Database
                try {
                    await storageManager.init();
                    if (storageManager.useIndexedDB && storageManager.db) {
                        await storageManager.syncFromDatabase(dbProducts);
                        console.log('✅ Updated local IndexedDB cache from Database');
                    }
                    // Also update localStorage as a backup
                    localStorage.setItem('products', JSON.stringify(loadedProducts));
                } catch (cacheError) {
                    console.warn('⚠️ Could not update local cache:', cacheError.message);
                }

                // Step 4: Load images in background
                loadProductImagesLazy(loadedProducts).catch(err => {
                    console.warn('⚠️ Some product images failed to load:', err.message);
                });

            } catch (error) {
                // Database failed - check if it's a transient error or permanent failure
                const errorMsg = error.message || error.toString() || '';
                const errorName = error.name || '';

                const isExpectedError =
                    errorName === 'AbortError' ||
                    errorName === 'TypeError' ||
                    errorMsg.includes('aborted') ||
                    errorMsg.includes('Aborted') ||
                    errorMsg.includes('fetch') ||
                    errorMsg.includes('network') ||
                    errorMsg.includes('Network') ||
                    errorMsg.includes('Database not connected') ||
                    errorMsg.includes('Database connection') ||
                    errorMsg.includes('backend not available') ||
                    errorMsg.includes('Failed to fetch');

                if (!isExpectedError) {
                    console.error('❌ Database API load error:', errorMsg);
                    console.error('❌ Error details:', error);
                } else {
                    // Expected error (timeout, network issue) - don't log as error
                    if (errorName === 'AbortError' || errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
                        console.warn(`⚠️ Database request timed out (15s) - this may be due to slow network or backend response`);
                        console.warn(`   The request will fall back to localStorage/IndexedDB for now`);
                        console.warn(`   If this persists, check: 1) Backend is running, 2) Network connection, 3) Database Atlas connection`);
                    } else {
                        console.warn(`⚠️ Database request failed: ${errorMsg}`);
                    }
                }

                // Log fallback message
                console.log('ℹ️ Failed to load from Database - will load from localStorage/IndexedDB');

                // Mark Database as unavailable for this session
                useDatabase = false;
                localStorage.setItem('useDatabase', 'false');

                // Will fall through to localStorage/IndexedDB fallback below
            }
        }

        // FALLBACK: Use IndexedDB cache ONLY if Database is not available (OFFLINE mode)
        // NOTE: localStorage is NOT used for products - only for UI data (cart, preferences)
        // Database is the ONLY source of truth for core app data
        if (loadedProducts.length === 0) {
            if (useDatabase && databaseConnected) {
                // Database was available but failed to load products - show error
                console.error('❌ Database was connected but failed to load products');
                console.error('   This is an error - products should load from Database');
                console.error('   Check backend logs and Database connection');
            } else {
                // Database not available - use IndexedDB cache for offline mode ONLY
                console.warn('⚠️ Database not available - using IndexedDB cache (OFFLINE MODE)');
                console.warn('   Note: Database (MariaDB) is permanent, centralized storage.');
                console.warn('   localStorage is NOT used for products - only for UI data (cart, preferences)');

                // Use IndexedDB cache if available (offline mode)
                try {
                    await storageManager.init();
                    if (storageManager.useIndexedDB && storageManager.db) {
                        const indexedProducts = await storageManager.loadProducts();
                        if (indexedProducts && indexedProducts.length > 0) {
                            loadedProducts = indexedProducts.map(p => ({
                                ...p,
                                id: p.id || p._id,
                                image: p.image || ''
                            }));
                            loadSource = 'IndexedDB cache (offline mode)';
                            console.log(`📦 Using ${loadedProducts.length} products from IndexedDB cache (offline mode)`);
                            console.log(`   ⚠️ This is cached data. Reconnect to Database for latest data.`);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading from IndexedDB cache:', error);
                }

                // DO NOT use localStorage for products - it's only for UI data
                if (loadedProducts.length === 0) {
                    console.error('❌ No products available - Database is not connected and no cache found');
                    console.error('   Please ensure backend server is running and Database is connected');
                }
            }
        }

        if (loadedProducts.length > 0) {
            // Clear the default products array completely
            products.length = 0;
            console.log('🧹 Cleared default products array');

            // Ensure all products have required fields for backward compatibility
            loadedProducts.forEach(product => {
                // Preserve existing image if it exists, don't overwrite with empty string
                if (!product.hasOwnProperty('image') || product.image === null || product.image === undefined) {
                    product.image = '';
                }
                // Don't overwrite existing image with empty string - preserve what's there
                if (!product.hasOwnProperty('size')) {
                    product.size = 'M'; // Default size
                }
                if (!product.hasOwnProperty('discount')) {
                    product.discount = 0; // Default discount
                }
                if (!product.hasOwnProperty('quantity')) {
                    product.quantity = 1; // Default quantity
                }
            });

            // Log image statistics
            const productsWithImages = loadedProducts.filter(p => {
                const img = p.image || '';
                return img && img.trim().length > 0 &&
                    (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
            }).length;
            if (productsWithImages === 0 && loadedProducts.length > 0) {
                console.log(`ℹ️ Image status: ${productsWithImages}/${loadedProducts.length} products have images. Products without images will show a gradient background with icon.`);
                console.log(`💡 To add images: Login as admin → Edit product → Upload image`);
            } else {
                console.log(`📊 Image statistics: ${productsWithImages}/${loadedProducts.length} products have images`);
            }

            // Replace products array with loaded products
            products.push(...loadedProducts);
            console.log(`✅ Total products loaded: ${products.length} (from ${loadSource})`);
            console.log(`✅ Products array now contains:`, products.map(p => ({ id: p.id, name: p.name })));

            // Verify the products array was properly replaced
            if (products.length !== loadedProducts.length) {
                console.error('❌ CRITICAL: Products array length mismatch!', products.length, 'vs', loadedProducts.length);
            }

            // Note: IndexedDB recovery disabled - Database is preferred storage method
            // If Database backend is available, products should be loaded from Database, not IndexedDB
        } else {
            // No products found in storage
            console.log('⚠️ No products found in storage');
            console.log('⚠️ Current products array has', products.length, 'items');

            // Products array is empty — show empty state, do NOT reinitialize fake products
            if (products.length === 0) {
                console.log('ℹ️ No products in storage. Admin can add products via the admin panel.');
            }

            // Check if this is truly the first load by checking for a flag
            const hasBeenInitialized = localStorage.getItem('productsInitialized');
            console.log('⚠️ Has been initialized?', hasBeenInitialized);

            // If products exist in memory but not in storage, save them
            if (products.length > 0) {
                // Check if we have the default 12 products (initial state - dresses and tracksuits only)
                const isFirstLoad = products.length === 12 &&
                    products[0]?.id === 13 &&
                    products[0]?.name === 'Floral Summer Dress' &&
                    products[11]?.id === 24;

                if (isFirstLoad && hasBeenInitialized !== 'true') {
                    console.log('✅ First time load detected - saving initial default products...');
                    await saveProducts();
                    // Mark as initialized so we don't overwrite user products on future loads
                    localStorage.setItem('productsInitialized', 'true');
                    console.log('✅ Initial products saved. You can now add your own products.');
                } else if (hasBeenInitialized === 'true') {
                    // Storage was cleared but products exist in memory - keep them
                    console.warn('⚠️ Storage was cleared but products exist in memory. Keeping current products.');
                    // Optionally save them back to storage
                    await saveProducts();
                } else {
                    // Products array has been modified (user added products) but storage is empty
                    // This shouldn't happen normally, but save what we have
                    console.warn('⚠️ Products in memory (', products.length, ') but storage is empty. Saving current products...');
                    await saveProducts();
                    localStorage.setItem('productsInitialized', 'true');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Keep existing products array if load fails
    }
}

// Helper function to clear localStorage if needed (can be called from console)
function clearStorage() {
    if (confirm('This will clear all stored data including products, cart, and settings. Are you sure?')) {
        localStorage.clear();
        location.reload();
    }
}

// Helper function to remove images from all products to free up space
async function removeAllProductImages() {
    if (confirm('This will remove all product images to free up storage space. Product data will be kept. Continue?')) {
        products.forEach(product => {
            product.image = '';
        });
        const saved = await saveProducts();
        if (saved) {
            showNotification('All product images removed. Storage space freed!', 'success');
            displayProducts(currentCategory);
        } else {
            showNotification('Failed to save. Storage may be completely full.', 'error');
        }
    }
}

// Debug function to check image status
function checkImageStatus() {
    console.log('📊 IMAGE STATUS REPORT');
    console.log('====================');
    console.log(`Total products: ${products.length}`);

    const productsWithImages = products.filter(p => {
        const img = p.image || '';
        return img && img.trim().length > 0 &&
            (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'));
    });

    const productsWithoutImages = products.filter(p => {
        const img = p.image || '';
        return !img || img.trim().length === 0 ||
            (!img.startsWith('data:image/') && !img.startsWith('http://') && !img.startsWith('https://'));
    });

    console.log(`✅ Products WITH valid images: ${productsWithImages.length}`);
    productsWithImages.forEach(p => {
        const imgLen = (p.image || '').length;
        console.log(`  - "${p.name}" (ID: ${p.id}): ${imgLen} chars, starts with: ${(p.image || '').substring(0, 20)}...`);
    });

    console.log(`❌ Products WITHOUT images: ${productsWithoutImages.length}`);
    productsWithoutImages.forEach(p => {
        const img = p.image || '';
        console.log(`  - "${p.name}" (ID: ${p.id}): ${img.length > 0 ? `Invalid format: ${img.substring(0, 30)}...` : 'No image field'}`);
    });

    console.log('====================');
    console.log('💡 To reload products from Database, run: loadProducts()');
    console.log('💡 To refresh display, run: displayProducts("all")');

    return {
        total: products.length,
        withImages: productsWithImages.length,
        withoutImages: productsWithoutImages.length,
        productsWithImages: productsWithImages,
        productsWithoutImages: productsWithoutImages
    };
}

// Make checkImageStatus available globally
window.checkImageStatus = checkImageStatus;

// Compress existing product images that are already in base64 format
function compressExistingProductImages() {
    if (!confirm('This will compress all existing product images to reduce storage size. This may take a moment. Continue?')) {
        return;
    }

    showNotification('Compressing images... This may take a moment.', 'success');

    let compressedCount = 0;
    let skippedCount = 0;
    const compressionPromises = [];

    products.forEach((product, index) => {
        if (product.image && product.image.trim() && product.image.startsWith('data:image')) {
            // Check if image is already compressed (small size)
            const sizeInKB = (product.image.length * 3) / 4 / 1024;

            // Only compress if image is larger than 200KB
            if (sizeInKB > 200) {
                const promise = new Promise((resolve) => {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 800;

                        // Calculate new dimensions
                        if (width > height) {
                            if (width > maxSize) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = (width * maxSize) / height;
                                height = maxSize;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to compressed base64
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        const newSizeInKB = (compressedDataUrl.length * 3) / 4 / 1024;

                        // Only update if compression actually reduced size
                        if (newSizeInKB < sizeInKB) {
                            product.image = compressedDataUrl;
                            compressedCount++;
                            console.log(`Compressed product "${product.name}": ${sizeInKB.toFixed(2)}KB -> ${newSizeInKB.toFixed(2)}KB`);
                        } else {
                            skippedCount++;
                        }
                        resolve();
                    };
                    img.onerror = function () {
                        skippedCount++;
                        resolve();
                    };
                    img.src = product.image;
                });
                compressionPromises.push(promise);
            } else {
                skippedCount++;
            }
        } else {
            skippedCount++;
        }
    });

    // Wait for all compressions to complete
    Promise.all(compressionPromises).then(async () => {
        if (compressedCount > 0) {
            const saved = await saveProducts();
            if (saved) {
                const oldSize = new Blob([JSON.stringify(products)]).size / (1024 * 1024);
                showNotification(`Compressed ${compressedCount} images! Storage now: ${oldSize.toFixed(2)}MB`, 'success');
                displayProducts(currentCategory);
            } else {
                showNotification('Compression completed but failed to save. Storage may be full.', 'error');
            }
        } else {
            showNotification('No images needed compression or all images are already optimized.', 'success');
        }
    });
}

// Check storage usage and show warning if needed
async function checkStorageUsage() {
    try {
        // Skip storage check if using Database
        const useDatabase = localStorage.getItem('useDatabase') === 'true';
        if (useDatabase) {
            return { size: 0, quota: Infinity, warning: false, type: 'Database' };
        }

        const storageInfo = await storageManager.getStorageInfo();
        const productsJson = JSON.stringify(products);
        const sizeInMB = new Blob([productsJson]).size / (1024 * 1024);

        // Check if we're using localStorage and approaching limit
        if (!storageManager.useIndexedDB && sizeInMB > 3.5) {
            console.warn(`⚠️ Storage Warning: Products data is ${sizeInMB.toFixed(2)}MB (close to 5MB localStorage limit)`);
            console.log('💡 Tip: IndexedDB is not available. Run compressExistingProductImages() to compress images');
            return { size: sizeInMB, quota: 5, warning: true, type: 'localStorage' };
        }

        return {
            size: storageInfo.used,
            quota: storageInfo.quota,
            available: storageInfo.available,
            percentUsed: storageInfo.percentUsed,
            warning: storageInfo.percentUsed > 80,
            type: storageInfo.type
        };
    } catch (error) {
        console.error('Error checking storage:', error);
        return { size: 0, quota: 0, warning: false, type: 'unknown' };
    }
}

// Content Management
function loadAdminContent() {
    document.getElementById('heroTitle').value = websiteContent.heroTitle;
    document.getElementById('heroDescription').value = websiteContent.heroDescription;
    const heroImageInput = document.getElementById('heroImage');
    const heroImageFile = document.getElementById('heroImageFile');
    if (heroImageInput) {
        heroImageInput.value = websiteContent.heroImage || '';
        previewHeroImage(websiteContent.heroImage || '');
    }
    if (heroImageFile) {
        heroImageFile.value = ''; // Reset file input
    }
    document.getElementById('aboutText').value = websiteContent.aboutText;
    document.getElementById('contactPhone').value = websiteContent.contactPhone;
    document.getElementById('contactEmail').value = websiteContent.contactEmail;
    document.getElementById('contactAddress').value = websiteContent.contactAddress;

    // Load current username display
    const currentUsernameDisplay = document.getElementById('currentUsernameDisplay');
    if (currentUsernameDisplay) {
        // Admin credentials are now handled by the backend
        const adminUsername = localStorage.getItem('adminUsername') || 'admin';
        currentUsernameDisplay.textContent = adminUsername;
    }

    // Load website icon preview
    const websiteIconPreview = document.getElementById('websiteIconPreview');
    const websiteIconPreviewImg = document.getElementById('websiteIconPreviewImg');
    if (websiteContent.websiteIcon && websiteContent.websiteIcon.trim()) {
        if (websiteIconPreview && websiteIconPreviewImg) {
            websiteIconPreviewImg.src = websiteContent.websiteIcon;
            websiteIconPreview.style.display = 'block';
        }
    } else {
        if (websiteIconPreview) {
            websiteIconPreview.style.display = 'none';
        }
    }
}

async function saveContent() {
    // Update websiteContent object from form
    websiteContent.heroTitle = document.getElementById('heroTitle').value;
    websiteContent.heroDescription = document.getElementById('heroDescription').value;
    const heroImageInput = document.getElementById('heroImage');
    if (heroImageInput) {
        websiteContent.heroImage = heroImageInput.value.trim();
    }
    websiteContent.aboutText = document.getElementById('aboutText').value;

    try {
        // Save to backend - required
        await apiService.saveWebsiteContent(websiteContent);
        console.log('✅ Content saved to backend');
    } catch (error) {
        console.error('❌ Failed to save to backend:', error.message);
        showNotification('Error: Could not save content - backend unavailable', 'error');
        return;
    }

    updateWebsiteContent();
    showNotification('✅ Content saved successfully!', 'success');
}

async function saveSettings() {
    websiteContent.contactPhone = document.getElementById('contactPhone').value;
    websiteContent.contactEmail = document.getElementById('contactEmail').value;
    websiteContent.contactAddress = document.getElementById('contactAddress').value;

    // Website icon is saved when uploaded, not here

    try {
        // Save to backend - required
        await apiService.saveWebsiteContent(websiteContent);
        console.log('✅ Settings saved to backend');
    } catch (error) {
        console.error('❌ Failed to save to backend:', error.message);
        showNotification('Error: Could not save settings - backend unavailable', 'error');
        return;
    }

    updateContactDisplay();
    updateWebsiteIcon();
    showNotification('✅ Settings saved successfully!', 'success');
}

async function loadWebsiteContent() {
    let loadedContent = null;
    let loadedFromBackend = false;

    // Load from backend - required
    if (apiService) {
        try {
            const backendContent = await apiService.getWebsiteContent();
            if (backendContent) {
                loadedContent = backendContent;
                loadedFromBackend = true;
                console.log('✅ Loaded website content from backend');
            }
        } catch (error) {
            console.error('❌ Could not load from backend:', error.message);
            showNotification('Error: Could not load content - backend unavailable', 'error');
            return;
        }
    }

    // Apply loaded content
    if (loadedContent) {
        // Validate heroImage - only accept valid URLs
        if (loadedContent.heroImage) {
            // Accept: http://, https://, or data: URIs
            if (!loadedContent.heroImage.startsWith('http') && !loadedContent.heroImage.startsWith('data:')) {
                console.warn('⚠️ Invalid image URL format, removing:', loadedContent.heroImage);
                delete loadedContent.heroImage;
            }
        }
        websiteContent = { ...websiteContent, ...loadedContent };
        console.log('✅ Website content loaded successfully', loadedFromBackend ? '(from backend)' : '(from local storage)');
    } else {
        console.log('ℹ️ No saved website content found, using defaults');
    }

    updateWebsiteContent();
}

function updateWebsiteContent() {
    const heroTitle = document.querySelector('.hero-content h1');
    const heroDescription = document.querySelector('.hero-content p');
    const aboutText = document.querySelector('.about-text');
    const heroSection = document.getElementById('home');

    if (heroTitle) heroTitle.textContent = websiteContent.heroTitle;
    if (heroDescription) heroDescription.textContent = websiteContent.heroDescription;
    if (aboutText) aboutText.textContent = websiteContent.aboutText;

    // Update hero background image
    if (heroSection && websiteContent.heroImage && websiteContent.heroImage.trim()) {
        heroSection.style.backgroundImage = `url('${websiteContent.heroImage}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundRepeat = 'no-repeat';
    } else if (heroSection) {
        // Reset to gradient if no image
        heroSection.style.backgroundImage = '';
    }
}

function updateContactDisplay() {
    const phoneDisplay = document.getElementById('contactPhoneDisplay');
    const emailDisplay = document.getElementById('contactEmailDisplay');
    const addressDisplay = document.getElementById('contactAddressDisplay');

    // Format phone number for display
    const phone = websiteContent.contactPhone;
    const formattedPhone = phone.startsWith('254')
        ? `+${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 9)} ${phone.substring(9)}`
        : phone;

    // Update phone link
    if (phoneDisplay) {
        const phoneLink = phoneDisplay.querySelector('a');
        if (phoneLink) {
            phoneLink.href = `tel:${phone}`;
            phoneLink.textContent = formattedPhone;
        } else {
            phoneDisplay.innerHTML = `<a href="tel:${phone}" class="contact-link">${formattedPhone}</a>`;
        }
    }

    // Update email link
    if (emailDisplay) {
        const emailLink = emailDisplay.querySelector('a');
        if (emailLink) {
            emailLink.href = `mailto:${websiteContent.contactEmail}`;
            emailLink.textContent = websiteContent.contactEmail;
        } else {
            emailDisplay.innerHTML = `<a href="mailto:${websiteContent.contactEmail}" class="contact-link">${websiteContent.contactEmail}</a>`;
        }
    }

    // Update address link (Google Maps)
    if (addressDisplay) {
        const addressLink = addressDisplay.querySelector('a');
        const encodedAddress = encodeURIComponent(websiteContent.contactAddress);
        if (addressLink) {
            addressLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            addressLink.textContent = websiteContent.contactAddress;
        } else {
            addressDisplay.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}" target="_blank" class="contact-link">${websiteContent.contactAddress}</a>`;
        }
    }

    // Update WhatsApp link
    const whatsappLinks = document.querySelectorAll('.whatsapp-link');
    whatsappLinks.forEach(link => {
        link.href = `https://wa.me/${websiteContent.contactPhone}`;
        if (link.textContent.includes('+')) {
            link.textContent = formattedPhone;
        }
    });
}

// Handle image loading errors
function handleImageError(img) {
    img.style.display = 'none';
    // Show placeholder if image fails to load
    const placeholder = document.createElement('div');
    placeholder.className = 'no-image-placeholder';
    placeholder.innerHTML = '';
    img.parentElement.appendChild(placeholder);
}

// Compress image to reduce file size
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        // Handle both File and Blob objects
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;

        // Handle both File and Blob
        if (file instanceof Blob) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
}

// Global cropper instance
let imageCropper = null;
let currentImageFile = null;
let currentCropRatio = NaN; // Default to Free (Original Size)

// Handle product image file upload
function handleProductImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error('No file selected');
        return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
        event.target.value = ''; // Reset file input
        return;
    }

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB. Please compress your image or choose a smaller file.');
        event.target.value = ''; // Reset file input
        return;
    }

    // Store file for cropping
    currentImageFile = file;

    // Show loading indicator
    const uploadLabel = document.querySelector('label[for="productImageFile"]');
    if (uploadLabel) {
        uploadLabel.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        uploadLabel.style.pointerEvents = 'none';
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = function (e) {
        const imageDataUrl = e.target.result;

        // Show cropper modal
        openImageCropper(imageDataUrl);

        // Reset upload label
        if (uploadLabel) {
            uploadLabel.innerHTML = '<i class="fas fa-upload"></i> Browse & Upload Image';
            uploadLabel.style.pointerEvents = 'auto';
        }
    };
    reader.onerror = function () {
        alert('Error reading image file. Please try again.');
        event.target.value = '';
        if (uploadLabel) {
            uploadLabel.innerHTML = '<i class="fas fa-upload"></i> Browse & Upload Image';
            uploadLabel.style.pointerEvents = 'auto';
        }
    };
    reader.readAsDataURL(file);
}

// Open image cropper modal
function openImageCropper(imageSrc) {
    const cropperModal = document.getElementById('imageCropperModal');
    const cropperImage = document.getElementById('cropperImage');

    if (!cropperModal || !cropperImage) {
        console.error('Cropper elements not found');
        alert('Error: Cropper modal not found. Please refresh the page and try again.');
        return;
    }

    // Check if Cropper library is loaded
    if (typeof Cropper === 'undefined') {
        console.error('Cropper library not loaded');
        alert('Error: Image cropper library not loaded. Please refresh the page and try again.');
        // Fallback: use direct upload without cropping
        const productImageInput = document.getElementById('productImage');
        if (productImageInput) {
            productImageInput.value = imageSrc;
            previewProductImage(imageSrc);
            showNotification('Image uploaded (cropper not available, using direct upload)');
        }
        return;
    }

    // Set image source
    cropperImage.src = imageSrc;

    // Show modal and overlay
    const cropperOverlay = document.getElementById('cropperModalOverlay');
    if (cropperOverlay) {
        cropperOverlay.style.display = 'block';
    }
    cropperModal.style.display = 'block';
    cropperModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Initialize cropper after image loads
    cropperImage.onload = function () {
        try {
            // Destroy existing cropper if any
            if (imageCropper) {
                imageCropper.destroy();
                imageCropper = null;
            }

            // Initialize cropper with aspect ratio for consistent product cards
            // Default to 4:3, but user can change it
            imageCropper = new Cropper(cropperImage, {
                aspectRatio: currentCropRatio,
                viewMode: 1, // Restrict crop box within canvas
                dragMode: 'move',
                autoCropArea: 1, // Set to 1 to auto-select the ENTIRE image by default
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                responsive: true,
                minCanvasWidth: 300,
                minCanvasHeight: 200,
                minCropBoxWidth: 200,
                minCropBoxHeight: 150
            });
        } catch (error) {
            console.error('Error initializing cropper:', error);
            alert('Error initializing image cropper. Using direct upload instead.');
            // Fallback: use direct upload
            const productImageInput = document.getElementById('productImage');
            if (productImageInput) {
                productImageInput.value = imageSrc;
                previewProductImage(imageSrc);
                showNotification('Image uploaded (cropper error, using direct upload)');
            }
            closeImageCropper();
        }
    };

    // Handle image load error
    cropperImage.onerror = function () {
        console.error('Error loading image in cropper');
        alert('Error loading image. Please try again with a different image.');
        closeImageCropper();
    };
}

// Update crop ratio
function updateCropRatio(ratio) {
    currentCropRatio = ratio;
    if (imageCropper) {
        try {
            imageCropper.setAspectRatio(ratio);
            console.log('Crop ratio updated to:', ratio === 4 / 3 ? '4:3' : '3:4');
        } catch (error) {
            console.error('Error updating crop ratio:', error);
        }
    }
}

// Close image cropper
function closeImageCropper() {
    const cropperModal = document.getElementById('imageCropperModal');
    const cropperOverlay = document.getElementById('cropperModalOverlay');

    if (cropperOverlay) {
        cropperOverlay.style.display = 'none';
    }

    if (cropperModal) {
        cropperModal.style.display = 'none';
        cropperModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Destroy cropper
    if (imageCropper) {
        try {
            imageCropper.destroy();
        } catch (error) {
            console.error('Error destroying cropper:', error);
        }
        imageCropper = null;
    }

    // Reset file input
    const productImageFile = document.getElementById('productImageFile');
    if (productImageFile) {
        productImageFile.value = '';
    }
    currentImageFile = null;

    // Reset ratio to default
    currentCropRatio = NaN;
    const ratioFree = document.getElementById('ratioFree');
    if (ratioFree) {
        ratioFree.checked = true;
    }
}

// Apply image crop
function applyImageCrop() {
    if (!imageCropper) {
        alert('No image to crop. Please upload an image first.');
        return;
    }

    // Show loading
    const uploadLabel = document.querySelector('label[for="productImageFile"]');
    if (uploadLabel) {
        uploadLabel.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        uploadLabel.style.pointerEvents = 'none';
    }

    // 1. Resize: Limit width to 800px to prevent huge files
    const canvas = imageCropper.getCroppedCanvas({
        width: 800,
        imageSmoothingQuality: 'high'
    });

    if (!canvas) {
        alert('Error cropping image. Please try again.');
        if (uploadLabel) {
            uploadLabel.innerHTML = '<i class="fas fa-upload"></i> Browse & Upload Image';
            uploadLabel.style.pointerEvents = 'auto';
        }
        return;
    }

    // 2. Compress: Convert to WebP at 70% quality
    // This creates a much smaller string for your database
    const compressedDataUrl = canvas.toDataURL('image/webp', 0.7);

    // 3. Update the preview and hidden input
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.value = compressedDataUrl;
        previewProductImage(compressedDataUrl);
        showNotification('Image processed and compressed successfully!');
    }

    // 4. Close the cropper modal
    closeImageCropper();

    if (uploadLabel) {
        uploadLabel.innerHTML = '<i class="fas fa-upload"></i> Browse & Upload Image';
        uploadLabel.style.pointerEvents = 'auto';
    }
}

// Remove product image
function removeProductImage() {
    if (confirm('Are you sure you want to remove this product image?')) {
        document.getElementById('productImage').value = '';
        document.getElementById('productImageFile').value = '';
        previewProductImage('');
        showNotification('Product image removed');
    }
}

// Preview product image in admin panel
function previewProductImage(imageUrl) {
    const previewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (previewDiv && previewImg) {
        if (imageUrl && imageUrl.trim()) {
            previewImg.src = imageUrl;
            previewDiv.style.display = 'block';
            previewImg.onerror = function () {
                previewDiv.style.display = 'none';
            };
        } else {
            previewDiv.style.display = 'none';
        }
    }
}

// Handle hero image file upload
function handleHeroImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Check file size (max 10MB - we will compress it)
    if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
    }

    showNotification('Processing hero image...', 'info');

    // Compress image (1920x1080 max for hero)
    compressImage(file, 1920, 1080, 0.8)
        .then(compressedDataUrl => {
            // Store as base64 data URL
            websiteContent.heroImage = compressedDataUrl;
            document.getElementById('heroImage').value = compressedDataUrl;
            previewHeroImage(compressedDataUrl);
            updateWebsiteContent(); // Update view immediately
            showNotification('Hero image uploaded successfully!');
        })
        .catch(error => {
            console.error('Error compressing hero image:', error);
            alert('Error processing image. Please try another file.');
        });
}

// Preview hero image in admin panel
function previewHeroImage(imageUrl) {
    const previewDiv = document.getElementById('heroImagePreview');
    const previewImg = document.getElementById('heroPreviewImg');

    if (previewDiv && previewImg) {
        if (imageUrl && imageUrl.trim()) {
            previewImg.src = imageUrl;
            previewDiv.style.display = 'block';
            previewImg.onerror = function () {
                previewDiv.style.display = 'none';
            };
        } else {
            previewDiv.style.display = 'none';
        }
    }
}

// Remove hero image
function removeHeroImage() {
    if (confirm('Are you sure you want to remove the hero background image?')) {
        websiteContent.heroImage = '';
        document.getElementById('heroImage').value = '';
        document.getElementById('heroImageFile').value = '';
        previewHeroImage('');
        updateWebsiteContent();
        showNotification('Hero image removed');
    }
}

// Handle website icon file upload
function handleWebsiteIconUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
    }

    // Check file size (max 2MB for icons)
    if (file.size > 2 * 1024 * 1024) {
        alert('Icon size should be less than 2MB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageDataUrl = e.target.result;
        // Store as base64 data URL
        websiteContent.websiteIcon = imageDataUrl;

        // Update preview
        const websiteIconPreview = document.getElementById('websiteIconPreview');
        const websiteIconPreviewImg = document.getElementById('websiteIconPreviewImg');
        if (websiteIconPreview && websiteIconPreviewImg) {
            websiteIconPreviewImg.src = imageDataUrl;
            websiteIconPreview.style.display = 'block';
        }

        // Update favicon immediately
        updateWebsiteIcon();

        // Save to localStorage
        localStorage.setItem('websiteContent', JSON.stringify(websiteContent));

        showNotification('Website icon uploaded successfully!');
    };
    reader.onerror = function () {
        alert('Error reading icon file');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

// Remove website icon
function removeWebsiteIcon() {
    if (confirm('Are you sure you want to remove the website icon?')) {
        websiteContent.websiteIcon = '';
        const websiteIconFile = document.getElementById('websiteIconFile');
        if (websiteIconFile) {
            websiteIconFile.value = '';
        }

        const websiteIconPreview = document.getElementById('websiteIconPreview');
        if (websiteIconPreview) {
            websiteIconPreview.style.display = 'none';
        }

        // Update favicon
        updateWebsiteIcon();

        // Save to localStorage
        localStorage.setItem('websiteContent', JSON.stringify(websiteContent));

        showNotification('Website icon removed');
    }
}

// Update website icon/favicon
function updateWebsiteIcon() {
    const favicon = document.getElementById('websiteFavicon');
    if (favicon && websiteContent.websiteIcon && websiteContent.websiteIcon.trim()) {
        favicon.href = websiteContent.websiteIcon;
        favicon.type = 'image/png';
    } else if (favicon) {
        // Set default favicon or remove
        favicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👗</text></svg>';
        favicon.type = 'image/svg+xml';
    }
}

// Change Admin Credentials
// Change Admin Credentials
async function changeAdminCredentials(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Basic validation
    if (!currentPassword) {
        alert('Please enter your current password');
        document.getElementById('currentPassword').focus();
        return;
    }

    // Check if username is being changed
    if (newUsername && newUsername.length > 0) {
        if (newUsername.length < 3) {
            alert('Username must be at least 3 characters long');
            document.getElementById('newUsername').focus();
            return;
        }
    }

    // Check if password is being changed
    if (newPassword && newPassword.length > 0) {
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            document.getElementById('newPassword').focus();
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match!');
            document.getElementById('confirmNewPassword').focus();
            return;
        }
    }

    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Updating...';
        submitBtn.disabled = true;

        // Call API to change credentials
        const result = await apiService.changeCredentials(currentPassword, newUsername, newPassword);

        // Update username display if changed
        if (result.username) {
            const currentUsernameDisplay = document.getElementById('currentUsernameDisplay');
            if (currentUsernameDisplay) {
                currentUsernameDisplay.textContent = result.username;
            }
        }

        // Reset form
        document.getElementById('changeCredentialsForm').reset();
        showNotification('Admin credentials updated successfully!');

    } catch (error) {
        console.error('Error updating credentials:', error);
        alert(error.message || 'Failed to update credentials');
    } finally {
        // Restore button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Credentials';
            submitBtn.disabled = false;
        }
    }
}

// Ensure functions are globally accessible (for onclick handlers)
// Functions are already in global scope, but this ensures they're available
if (typeof window !== 'undefined') {
    window.saveProduct = saveProduct;
    window.deleteProduct = deleteProduct;
    window.editProduct = editProduct;
    window.openAddProductModal = openAddProductModal;
    window.closeProductModal = closeProductModal;
    window.handleProductImageUpload = handleProductImageUpload;
    window.removeProductImage = removeProductImage;
    window.openImageCropper = openImageCropper;
    window.closeImageCropper = closeImageCropper;
    window.applyImageCrop = applyImageCrop;
    window.updateCropRatio = updateCropRatio;
    window.showDeleteConfirmationModal = showDeleteConfirmationModal;
    window.cancelDelete = cancelDelete;
    window.confirmDelete = confirmDelete;
    window.validateMpesaCode = validateMpesaCode;
    window.validateMpesaCodeInput = validateMpesaCodeInput;
    window.loadAdminOrders = loadAdminOrders;
    window.loadCompletedOrders = loadCompletedOrders;
    window.searchAdminOrders = searchAdminOrders;
    window.searchCompletedOrders = searchCompletedOrders;
    window.viewOrderDetails = viewOrderDetails;
    window.downloadOrderReceipt = downloadOrderReceipt;
    window.toggleDeliveryStatus = toggleDeliveryStatus;
    // Initialize pending delete storage
    window.pendingDelete = null;
}

// Admin Orders Management
let allAdminOrders = [];
let filteredAdminOrders = [];
let allCompletedOrders = [];
let filteredCompletedOrders = [];

async function loadAdminOrders(searchQuery = '') {
    // Load only non-delivered orders (active orders)
    await loadAdminOrdersInternal(searchQuery, false);
}

async function loadCompletedOrders(searchQuery = '') {
    // Load only delivered orders (completed orders)
    await loadAdminOrdersInternal(searchQuery, true);
}

async function loadAdminOrdersInternal(searchQuery = '', completedOnly = false) {
    const ordersList = completedOnly ? document.getElementById('adminCompletedList') : document.getElementById('adminOrdersList');
    const searchResults = completedOnly ? document.getElementById('adminCompletedSearchResults') : document.getElementById('adminOrderSearchResults');
    const totalCountElement = completedOnly ? document.getElementById('adminTotalCompletedCount') : document.getElementById('adminTotalOrdersCount');

    if (!ordersList) return;

    try {
        // Show loading
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Loading orders...</p>
            </div>
        `;

        const useDatabase = localStorage.getItem('useDatabase') === 'true';

        if (useDatabase) {
            try {
                // Load orders from Database
                const orders = await apiService.getOrders();
                allAdminOrders = orders || [];
                console.log(`✅ Loaded ${allAdminOrders.length} orders from Database`);
            } catch (apiError) {
                console.error('❌ Error loading orders from Database:', apiError);
                allAdminOrders = [];
            }
        }

        // Also load from localStorage as backup
        try {
            const localOrdersJson = localStorage.getItem('orders');
            if (localOrdersJson) {
                const localOrders = JSON.parse(localOrdersJson);
                // Merge with Database orders (avoid duplicates)
                localOrders.forEach(localOrder => {
                    const exists = allAdminOrders.find(o => o.orderId === localOrder.orderId);
                    if (!exists) {
                        allAdminOrders.push(localOrder);
                    }
                });
            }
        } catch (localError) {
            console.error('Error loading orders from localStorage:', localError);
        }

        // Separate delivered and non-delivered orders
        const deliveredOrders = allAdminOrders.filter(order => {
            const deliveryStatus = order.delivery?.status || 'pending';
            return deliveryStatus === 'delivered';
        });

        const activeOrders = allAdminOrders.filter(order => {
            const deliveryStatus = order.delivery?.status || 'pending';
            return deliveryStatus !== 'delivered';
        });

        // Update global arrays for tracking
        allCompletedOrders = deliveredOrders;

        // Use appropriate list based on completedOnly flag
        let ordersToDisplay = completedOnly ? deliveredOrders : activeOrders;

        // Sort orders by date (newest first)
        ordersToDisplay.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });

        // Filter orders if search query provided
        let filteredList = ordersToDisplay;
        if (searchQuery && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filteredList = ordersToDisplay.filter(order => {
                const orderId = (order.orderId || '').toLowerCase();
                const customerName = (order.customer?.name || '').toLowerCase();
                const customerPhone = (order.customer?.phone || '').toLowerCase();
                const mpesaCode = (order.mpesaCode || '').toLowerCase();
                return orderId.includes(query) ||
                    customerName.includes(query) ||
                    customerPhone.includes(query) ||
                    mpesaCode.includes(query);
            });
        }

        // Update filtered arrays
        if (completedOnly) {
            filteredCompletedOrders = filteredList;
        } else {
            filteredAdminOrders = filteredList;
        }

        // Update count
        if (totalCountElement) {
            totalCountElement.textContent = filteredList.length;
        }

        // Update badge counts
        updateOrderBadges();

        // Update search results message
        if (searchResults) {
            if (searchQuery && searchQuery.trim() !== '') {
                if (filteredList.length === 0) {
                    searchResults.textContent = `No ${completedOnly ? 'completed ' : ''}orders found matching "${searchQuery}"`;
                    searchResults.style.color = '#f44336';
                } else {
                    searchResults.textContent = `Found ${filteredList.length} ${completedOnly ? 'completed ' : ''}order(s) matching "${searchQuery}"`;
                    searchResults.style.color = '#4caf50';
                }
            } else {
                searchResults.textContent = '';
            }
        }

        // Display orders
        if (filteredList.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p style="font-size: 1.1rem; margin-bottom: 10px;">No orders found</p>
                    <p style="font-size: 0.9rem;">Orders will appear here once customers make payments.</p>
                </div>
            `;
        } else {
            // Store completedOnly flag for use in template
            const isCompletedTab = completedOnly;

            ordersList.innerHTML = filteredList.map(order => {
                const orderDate = order.date || order.createdAt || new Date().toLocaleString('en-KE');
                const customerName = order.customer?.name || 'N/A';
                const customerPhone = order.customer?.phone || 'N/A';
                const total = order.total || 0;
                const paymentMethod = order.paymentMethod || 'N/A';
                const mpesaCode = order.mpesaCode || 'N/A';
                const verified = order.verified ? '✅ Verified' : '⚠️ Pending';
                const deliveryStatus = order.delivery?.status || 'pending';
                const deliveryStatusColor = deliveryStatus === 'delivered' ? '#4caf50' :
                    deliveryStatus === 'shipped' ? '#2196F3' :
                        deliveryStatus === 'processing' ? '#ff9800' : '#666';
                const deliveryStatusIcon = deliveryStatus === 'delivered' ? '✅' :
                    deliveryStatus === 'shipped' ? '🚚' :
                        deliveryStatus === 'processing' ? '⏳' : '📦';

                const deliveryInfo = order.delivery?.option !== 'pickup'
                    ? `<div style="margin-top: 8px; padding: 10px; background: #f0f7ff; border-radius: 5px; border-left: 3px solid ${deliveryStatusColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong>Delivery:</strong>
                            <span style="color: ${deliveryStatusColor}; font-weight: bold; font-size: 0.9rem;">
                                ${deliveryStatusIcon} ${deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
                            </span>
                        </div>
                        <div style="font-size: 0.9rem; margin-bottom: 5px;">${order.delivery?.optionText || 'N/A'}</div>
                        <div style="font-size: 0.85rem; color: #666;">📍 ${order.delivery?.address || 'N/A'}</div>
                    </div>`
                    : `<div style="margin-top: 8px; padding: 10px; background: #f0f7ff; border-radius: 5px; border-left: 3px solid ${deliveryStatusColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>Delivery:</strong>
                            <span style="color: ${deliveryStatusColor}; font-weight: bold; font-size: 0.9rem;">
                                ${deliveryStatusIcon} ${deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
                            </span>
                        </div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">Shop Pickup</div>
                    </div>`;

                return `
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 8px 0; color: var(--primary-color); font-size: 1.1rem;">
                                    <i class="fas fa-receipt"></i> ${order.orderId}
                                </h4>
                                <div style="font-size: 0.9rem; color: #666;">
                                    <i class="far fa-clock"></i> ${orderDate}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.3rem; font-weight: bold; color: var(--success-color);">
                                    KSh ${total.toLocaleString('en-KE')}
                                </div>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                                    ${verified}
                                </div>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <strong style="color: #666; font-size: 0.85rem;">Customer:</strong>
                                    <div style="margin-top: 4px; font-size: 0.95rem;">${customerName}</div>
                                    <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">
                                        <i class="fas fa-phone"></i> ${customerPhone}
                                    </div>
                                </div>
                                <div>
                                    <strong style="color: #666; font-size: 0.85rem;">Payment:</strong>
                                    <div style="margin-top: 4px; font-size: 0.95rem;">${paymentMethod}</div>
                                    <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">
                                        <i class="fas fa-qrcode"></i> ${mpesaCode}
                                    </div>
                                </div>
                            </div>
                            
                            ${deliveryInfo}
                            
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                                <strong style="color: #666; font-size: 0.85rem;">Items (${order.items?.length || 0}):</strong>
                                <div style="margin-top: 8px; max-height: 150px; overflow-y: auto;">
                                    ${(order.items || []).map(item => `
                                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                                            <span style="font-size: 0.9rem;">${item.name} x${item.quantity}</span>
                                            <span style="font-weight: bold; color: var(--primary-color);">KSh ${item.subtotal?.toLocaleString('en-KE') || '0'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #eee; font-weight: bold;">
                                    <span>Total:</span>
                                    <span style="color: var(--success-color); font-size: 1.1rem;">KSh ${total.toLocaleString('en-KE')}</span>
                                </div>
                            </div>
                            
                            ${!isCompletedTab ? `
                            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f9f9f9; border-radius: 5px; flex: 1; min-width: 200px;">
                                    <input type="checkbox" id="deliveryCheck_${order.orderId}" 
                                           ${deliveryStatus === 'delivered' ? 'checked' : ''}
                                           onchange="toggleDeliveryStatus('${order.orderId}', this.checked)"
                                           style="width: 18px; height: 18px; cursor: pointer;">
                                    <label for="deliveryCheck_${order.orderId}" style="cursor: pointer; font-weight: 500; font-size: 0.9rem; margin: 0; user-select: none;">
                                        Mark as Delivered
                                    </label>
                                </div>
                            </div>
                            ` : `
                            <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px; border-left: 3px solid #4caf50;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-check-circle" style="color: #4caf50; font-size: 1.2rem;"></i>
                                    <span style="color: #4caf50; font-weight: bold; font-size: 0.9rem;">
                                        ✅ Order Completed${order.delivery?.deliveredAt ? ` - ${new Date(order.delivery.deliveredAt).toLocaleDateString('en-KE')}` : ''}
                                    </span>
                                </div>
                            </div>
                            `}
                            <div style="margin-top: 10px; display: flex; gap: 10px;">
                                <button onclick="viewOrderDetails('${order.orderId}')" class="btn-primary" style="flex: 1; padding: 10px;">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                                <button onclick="downloadOrderReceipt('${order.orderId}')" class="btn-secondary" style="flex: 1; padding: 10px;">
                                    <i class="fas fa-download"></i> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('❌ Error loading admin orders:', error);
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #f44336;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p style="font-size: 1.1rem; margin-bottom: 10px;">Error loading orders</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
    }
}

function searchAdminOrders(query) {
    loadAdminOrders(query);
}

function searchCompletedOrders(query) {
    loadCompletedOrders(query);
}

function updateOrderBadges() {
    // Update badges for active and completed orders
    const activeOrders = allAdminOrders.filter(order => {
        const deliveryStatus = order.delivery?.status || 'pending';
        return deliveryStatus !== 'delivered';
    }).length;

    const completedOrders = allCompletedOrders.length;

    const ordersBadge = document.getElementById('ordersBadge');
    const completedBadge = document.getElementById('completedBadge');

    if (ordersBadge) {
        if (activeOrders > 0) {
            ordersBadge.textContent = activeOrders;
            ordersBadge.style.display = 'inline-block';
        } else {
            ordersBadge.style.display = 'none';
        }
    }

    if (completedBadge) {
        if (completedOrders > 0) {
            completedBadge.textContent = completedOrders;
            completedBadge.style.display = 'inline-block';
        } else {
            completedBadge.style.display = 'none';
        }
    }
}

function viewOrderDetails(orderId) {
    const order = allAdminOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found');
        return;
    }

    // Create detailed view modal
    const details = `
Order ID: ${order.orderId}
Date: ${order.date || order.createdAt || 'N/A'}
Customer: ${order.customer?.name || 'N/A'}
Phone: ${order.customer?.phone || 'N/A'}
Email: ${order.customer?.email || 'N/A'}

Items:
${(order.items || []).map(item => `• ${item.name} x${item.quantity} - KSh ${item.subtotal?.toLocaleString('en-KE') || '0'}`).join('\n')}

Subtotal: KSh ${(order.subtotal || order.total || 0).toLocaleString('en-KE')}
${order.delivery?.cost > 0 ? `Delivery: KSh ${order.delivery.cost.toLocaleString('en-KE')}\n` : ''}
Total: KSh ${order.total?.toLocaleString('en-KE') || '0'}

Payment Method: ${order.paymentMethod || 'N/A'}
M-Pesa Code: ${order.mpesaCode || 'N/A'}
Verified: ${order.verified ? 'Yes' : 'Pending'}

${order.delivery?.option !== 'pickup' ? `Delivery Address:\n${order.delivery?.address || 'N/A'}\n` : ''}
    `;

    alert(details);
}

async function downloadOrderReceipt(orderId) {
    const order = allAdminOrders.find(o => o.orderId === orderId);
    if (!order) {
        alert('Order not found');
        return;
    }

    try {
        // Generate PDF for this order
        await generateReceiptPDF(order);
        showNotification('Receipt downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating receipt:', error);
        alert('Error generating receipt. Please try again.');
    }
}

async function toggleDeliveryStatus(orderId, isDelivered) {
    try {
        const order = allAdminOrders.find(o => o.orderId === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        const deliveryStatus = isDelivered ? 'delivered' : 'pending';

        // Show loading
        const checkbox = document.getElementById(`deliveryCheck_${orderId}`);
        if (checkbox) {
            checkbox.disabled = true;
        }

        const useDatabase = localStorage.getItem('useDatabase') === 'true';

        if (useDatabase) {
            try {
                // Update in Database
                await apiService.updateDeliveryStatus(orderId, deliveryStatus);
                console.log(`✅ Delivery status updated for order ${orderId}: ${deliveryStatus}`);
            } catch (apiError) {
                console.error('Error updating delivery status:', apiError);
                // Revert checkbox
                if (checkbox) {
                    checkbox.checked = !isDelivered;
                }
                alert(`Failed to update delivery status: ${apiError.message}`);
                return;
            }
        }

        // Update local order
        if (order.delivery) {
            order.delivery.status = deliveryStatus;
            if (isDelivered) {
                order.delivery.deliveredAt = new Date();
                order.delivery.deliveredBy = 'admin';
            }
        } else {
            order.delivery = {
                status: deliveryStatus,
                deliveredAt: isDelivered ? new Date() : null,
                deliveredBy: isDelivered ? 'admin' : ''
            };
        }

        // Update in allAdminOrders array
        const orderIndex = allAdminOrders.findIndex(o => o.orderId === orderId);
        if (orderIndex !== -1) {
            allAdminOrders[orderIndex] = order;
        }

        // Save to localStorage
        try {
            const ordersJson = localStorage.getItem('orders');
            if (ordersJson) {
                let localOrders = JSON.parse(ordersJson);
                const localOrderIndex = localOrders.findIndex(o => o.orderId === orderId);
                if (localOrderIndex !== -1) {
                    localOrders[localOrderIndex] = order;
                    localStorage.setItem('orders', JSON.stringify(localOrders));
                }
            }
        } catch (localError) {
            console.error('Error updating order in localStorage:', localError);
        }

        // Reload orders display (both active and completed)
        const searchQuery = document.getElementById('adminOrderSearch')?.value || '';
        const completedSearchQuery = document.getElementById('adminCompletedSearch')?.value || '';

        await loadAdminOrders(searchQuery);
        await loadCompletedOrders(completedSearchQuery);

        // Show notification
        showNotification(
            isDelivered ? '✅ Delivery marked as completed!' : '📦 Delivery status reset to pending',
            isDelivered ? 'success' : 'info'
        );

    } catch (error) {
        console.error('Error toggling delivery status:', error);
        alert(`Error updating delivery status: ${error.message}`);

        // Revert checkbox
        const checkbox = document.getElementById(`deliveryCheck_${orderId}`);
        if (checkbox) {
            checkbox.checked = !isDelivered;
            checkbox.disabled = false;
        }
    }
}

// Function to manually refresh products from the server
async function refreshProducts() {
    if (typeof isAdmin !== 'undefined' && !isAdmin) {
        showNotification('You must be an admin to perform this action', 'error');
        return;
    }

    const refreshBtn = document.querySelector('button[onclick="refreshProducts()"]');
    const originalContent = refreshBtn ? refreshBtn.innerHTML : '';

    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    }

    showNotification('Refreshing products from server...', 'info');

    try {
        // Force reload
        if (typeof loadProducts === 'function') {
            await loadProducts();
            showNotification('Products refreshed successfully!', 'success');
        } else {
            console.error('loadProducts function not found');
        }
    } catch (error) {
        console.error('Error refreshing products:', error);
        showNotification('Failed to refresh products. Please try again.', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalContent;
        }
    }
} // Closing brace for refreshProducts function
// Expose to global scope
window.refreshProducts = refreshProducts;
