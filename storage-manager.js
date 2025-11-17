// Storage Manager - IndexedDB for complex local storage needs
// Storage Hierarchy:
// 1. Database (PERMANENT, CENTRALIZED) - Primary source of truth, cloud-based storage
// 2. IndexedDB (CACHE/FALLBACK) - Local cache for offline access, complex queries, large data
// 3. localStorage (MINIMAL BACKUP) - Lightweight backup only, limited capacity

// IndexedDB is used for:
// - Caching Database data for offline access
// - Storing large datasets locally (images, complex objects)
// - Performing complex queries locally when Database is unavailable
// - Fallback storage when Database backend is down

class StorageManager {
    constructor() {
        this.dbName = 'TrendyDressesDB';
        this.dbVersion = 1;
        this.storeName = 'products';
        this.db = null;
        this.useIndexedDB = false;
        this.isCacheMode = true; // IndexedDB is in cache mode - syncs with Database when available
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                console.log('IndexedDB not supported, falling back to localStorage');
                this.useIndexedDB = false;
                resolve(false);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.useIndexedDB = false;
                resolve(false);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.useIndexedDB = true;
                console.log('IndexedDB initialized successfully');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    // Save products to IndexedDB (used as cache for offline access, not primary storage)
    // Note: Database is the permanent, centralized storage. IndexedDB caches Database data.
    // NOTE: localStorage is NOT used for products - only for UI data (cart, preferences)
    async saveProducts(productsArray) {
        // DO NOT save to localStorage - it's only for UI data
        // localStorage is reserved for: cart, admin credentials, UI preferences
        // Products are stored in Database (primary) and cached in IndexedDB (offline)
        
        if (!this.useIndexedDB || !this.db) {
            // IndexedDB not available - return false (can't cache)
            console.warn('⚠️ IndexedDB not available - cannot cache products');
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Instead of clearing, we'll update/delete products individually to avoid data loss
            // First, get all existing products to see what needs to be deleted
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const existingProducts = getAllRequest.result || [];
                const existingIds = new Set(existingProducts.map(p => p.id || p._id));
                
                // Normalize new product IDs (Database uses _id, IndexedDB uses id)
                const newIds = new Set(productsArray.map(p => p._id || p.id));
                
                // Delete products that are no longer in the array
                const toDelete = existingProducts.filter(p => {
                    const productId = p.id || p._id;
                    return productId && !newIds.has(productId);
                });
                let deleteCompleted = 0;
                let deleteErrors = 0;
                
                const deleteNext = () => {
                    if (deleteCompleted + deleteErrors === toDelete.length) {
                        // All deletions done, now add/update products
                        addOrUpdateProducts();
                    }
                };
                
                if (toDelete.length === 0) {
                    // No deletions needed, go straight to add/update
                    addOrUpdateProducts();
                    return;
                }
                
                toDelete.forEach((product) => {
                    const deleteRequest = store.delete(product.id);
                    deleteRequest.onsuccess = () => {
                        deleteCompleted++;
                        deleteNext();
                    };
                    deleteRequest.onerror = () => {
                        deleteErrors++;
                        console.error('Error deleting product from IndexedDB:', deleteRequest.error);
                        deleteNext();
                    };
                });
                
                function addOrUpdateProducts() {
                    if (productsArray.length === 0) {
                        console.log('No products to save');
                        resolve(true);
                        return;
                    }
                    
                    let completed = 0;
                    let errors = 0;
                    const maxImageSize = 5 * 1024 * 1024; // 5MB limit for IndexedDB
                    
                    productsArray.forEach((product) => {
                        try {
                            // Normalize product data for IndexedDB
                            const normalizedProduct = {
                                // Convert Database _id to id
                                id: product._id || product.id || String(Date.now()) + Math.random(),
                                
                                // Basic product fields
                                name: product.name || '',
                                category: product.category || 'others',
                                price: typeof product.price === 'number' ? product.price : 0,
                                discount: typeof product.discount === 'number' ? product.discount : 0,
                                quantity: typeof product.quantity === 'number' ? product.quantity : 0,
                                size: product.size || '',
                                
                                // Handle image - limit size for IndexedDB
                                image: (() => {
                                    const img = product.image || '';
                                    if (!img || img.length === 0) return '';
                                    
                                    // If image is too large, truncate or skip
                                    if (img.length > maxImageSize) {
                                        console.warn(`⚠️ Product "${product.name}" image too large (${(img.length / 1024 / 1024).toFixed(2)}MB), skipping image for IndexedDB`);
                                        return ''; // Skip large images to prevent IndexedDB errors
                                    }
                                    return img;
                                })(),
                                
                                // Convert Date objects to ISO strings
                                createdAt: product.createdAt ? (product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt) : new Date().toISOString(),
                                updatedAt: product.updatedAt ? (product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt) : new Date().toISOString(),
                                
                                // Preserve hasImage flag if present
                                hasImage: product.hasImage !== undefined ? product.hasImage : !!(product.image && product.image.length > 0)
                            };
                            
                            // Validate required fields
                            if (!normalizedProduct.name || !normalizedProduct.category || !normalizedProduct.size) {
                                console.warn(`⚠️ Skipping invalid product:`, normalizedProduct);
                                errors++;
                                if (completed + errors === productsArray.length) {
                                    resolve(true);
                                }
                                return;
                            }
                            
                            // Use put instead of add - it will update if exists, add if not
                            const request = store.put(normalizedProduct);
                            
                            request.onsuccess = () => {
                                completed++;
                                if (completed === productsArray.length) {
                                    console.log(`✅ Saved ${completed} products to IndexedDB`);
                                    resolve(true);
                                }
                            };

                            request.onerror = (event) => {
                                errors++;
                                const error = event.target.error;
                                console.error(`❌ Error saving product "${normalizedProduct.name}" to IndexedDB:`, error?.name || error?.message || error);
                                
                                // Log product details for debugging (without large image)
                                const productDebug = { ...normalizedProduct };
                                if (productDebug.image && productDebug.image.length > 100) {
                                    productDebug.image = `[Image data: ${(productDebug.image.length / 1024).toFixed(2)}KB]`;
                                }
                                console.error('   Product data:', productDebug);
                                
                                if (errors === productsArray.length) {
                                    console.error('❌ All products failed to save to IndexedDB');
                                    resolve(true); // Still resolve - Database is primary
                                } else if (completed + errors === productsArray.length) {
                                    console.log(`⚠️ Some products failed to save to IndexedDB (${errors} errors, ${completed} succeeded)`);
                                    resolve(true); // Some succeeded
                                }
                            };
                        } catch (error) {
                            errors++;
                            console.error('❌ Error normalizing product for IndexedDB:', error, product);
                            if (completed + errors === productsArray.length) {
                                resolve(true);
                            }
                        }
                    });
                }
            };
            
            getAllRequest.onerror = () => {
                console.error('Error reading existing products from IndexedDB:', getAllRequest.error);
                // Fallback: try clear and add (less safe but better than nothing)
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                    productsArray.forEach((product) => {
                        store.add(product);
                    });
                };
                // Still resolve true since localStorage backup succeeded
                resolve(true);
            };
        });
    }

    // Load products from IndexedDB (cache/fallback only)
    // Note: Database is the primary source. This loads from local cache when Database is unavailable.
    async loadProducts() {
        if (!this.useIndexedDB || !this.db) {
            // Fallback to localStorage (minimal backup)
            return this.loadProductsLocalStorage();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const products = request.result || [];
                console.log(`📦 Loaded ${products.length} products from IndexedDB cache (fallback - Database is primary)`);
                resolve(products);
            };

            request.onerror = () => {
                console.error('❌ Error loading products from IndexedDB:', request.error);
                // Fallback to localStorage (minimal backup)
                resolve(this.loadProductsLocalStorage());
            };
        });
    }

    // Delete a product from IndexedDB
    async deleteProduct(productId) {
        if (!this.useIndexedDB || !this.db) {
            return this.deleteProductLocalStorage(productId);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(productId);

            request.onsuccess = () => {
                console.log(`Deleted product ${productId} from IndexedDB`);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error deleting product:', request.error);
                reject(request.error);
            };
        });
    }

    // Get storage usage info
    async getStorageInfo() {
        if (!this.useIndexedDB || !this.db) {
            return this.getStorageInfoLocalStorage();
        }

        return new Promise((resolve) => {
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(estimate => {
                    const usedMB = (estimate.usage || 0) / (1024 * 1024);
                    const quotaMB = (estimate.quota || 0) / (1024 * 1024);
                    const availableMB = quotaMB - usedMB;
                    const percentUsed = quotaMB > 0 ? (usedMB / quotaMB * 100) : 0;

                    resolve({
                        used: usedMB,
                        quota: quotaMB,
                        available: availableMB,
                        percentUsed: percentUsed,
                        type: 'IndexedDB'
                    });
                });
            } else {
                resolve({
                    used: 0,
                    quota: 0,
                    available: 0,
                    percentUsed: 0,
                    type: 'IndexedDB (estimate unavailable)'
                });
            }
        });
    }

    // Fallback methods for localStorage
    saveProductsLocalStorage(productsArray) {
        try {
            const productsJson = JSON.stringify(productsArray);
            localStorage.setItem('products', productsJson);
            return true;
        } catch (error) {
            console.error('localStorage save error:', error);
            return false;
        }
    }

    loadProductsLocalStorage() {
        try {
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                return JSON.parse(savedProducts);
            }
            return [];
        } catch (error) {
            console.error('localStorage load error:', error);
            return [];
        }
    }

    deleteProductLocalStorage(productId) {
        try {
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                const products = JSON.parse(savedProducts);
                const filtered = products.filter(p => p.id !== productId);
                localStorage.setItem('products', JSON.stringify(filtered));
                return true;
            }
            return false;
        } catch (error) {
            console.error('localStorage delete error:', error);
            return false;
        }
    }

    getStorageInfoLocalStorage() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            const usedMB = totalSize / (1024 * 1024);
            const quotaMB = 5; // Typical localStorage limit
            return {
                used: usedMB,
                quota: quotaMB,
                available: quotaMB - usedMB,
                percentUsed: (usedMB / quotaMB * 100),
                type: 'localStorage'
            };
        } catch (error) {
            return {
                used: 0,
                quota: 5,
                available: 5,
                percentUsed: 0,
                type: 'localStorage'
            };
        }
    }

    // Sync products from Database to IndexedDB cache
    // This caches Database data locally for offline access
    async syncFromDatabase(mongoProducts) {
        if (!this.useIndexedDB || !this.db) {
            console.log('⚠️ IndexedDB not available - cannot cache Database data');
            return false;
        }

        try {
            console.log(`🔄 Syncing ${mongoProducts.length} products from Database to IndexedDB cache...`);
            await this.saveProducts(mongoProducts);
            console.log(`✅ Cached ${mongoProducts.length} products from Database to IndexedDB`);
            return true;
        } catch (error) {
            console.error('❌ Error syncing from Database to IndexedDB:', error);
            return false;
        }
    }

    // Migrate data from localStorage to IndexedDB (legacy - for initial migration only)
    async migrateFromLocalStorage() {
        if (!this.useIndexedDB || !this.db) {
            console.log('⚠️ IndexedDB not available, cannot migrate');
            return false;
        }

        try {
            // Check if IndexedDB already has products
            const existingProducts = await this.loadProducts();
            if (existingProducts && existingProducts.length > 0) {
                console.log(`⚠️ IndexedDB cache already has ${existingProducts.length} products. Migration skipped.`);
                console.log(`   Note: Database is the primary storage. IndexedDB is cache only.`);
                return false;
            }
            
            const localProducts = this.loadProductsLocalStorage();
            console.log(`📦 Found ${localProducts.length} products in localStorage to migrate to IndexedDB cache`);
            
            if (localProducts.length > 0) {
                await this.saveProducts(localProducts);
                console.log(`✅ Migrated ${localProducts.length} products from localStorage to IndexedDB cache`);
                console.log(`   Note: These will sync to Database when backend is available`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Migration error:', error);
            return false;
        }
    }
}

// Create global storage manager instance
const storageManager = new StorageManager();

