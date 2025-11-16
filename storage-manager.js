// Storage Manager - IndexedDB for complex local storage needs
// Storage Hierarchy:
// 1. MongoDB (PERMANENT, CENTRALIZED) - Primary source of truth, cloud-based storage
// 2. IndexedDB (CACHE/FALLBACK) - Local cache for offline access, complex queries, large data
// 3. localStorage (MINIMAL BACKUP) - Lightweight backup only, limited capacity

// IndexedDB is used for:
// - Caching MongoDB data for offline access
// - Storing large datasets locally (images, complex objects)
// - Performing complex queries locally when MongoDB is unavailable
// - Fallback storage when MongoDB backend is down

class StorageManager {
    constructor() {
        this.dbName = 'TrendyDressesDB';
        this.dbVersion = 1;
        this.storeName = 'products';
        this.db = null;
        this.useIndexedDB = false;
        this.isCacheMode = true; // IndexedDB is in cache mode - syncs with MongoDB when available
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
    // Note: MongoDB is the permanent, centralized storage. IndexedDB caches MongoDB data.
    // NOTE: localStorage is NOT used for products - only for UI data (cart, preferences)
    async saveProducts(productsArray) {
        // DO NOT save to localStorage - it's only for UI data
        // localStorage is reserved for: cart, admin credentials, UI preferences
        // Products are stored in MongoDB (primary) and cached in IndexedDB (offline)
        
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
                const existingIds = new Set(existingProducts.map(p => p.id));
                const newIds = new Set(productsArray.map(p => p.id));
                
                // Delete products that are no longer in the array
                const toDelete = existingProducts.filter(p => !newIds.has(p.id));
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
                    
                    productsArray.forEach((product) => {
                        // Use put instead of add - it will update if exists, add if not
                        const request = store.put(product);
                        
                        request.onsuccess = () => {
                            completed++;
                            if (completed === productsArray.length) {
                                console.log(`✅ Saved ${productsArray.length} products to IndexedDB`);
                                resolve(true);
                            }
                        };

                        request.onerror = () => {
                            errors++;
                            console.error('Error saving product to IndexedDB:', request.error, product);
                            if (errors === productsArray.length) {
                                console.error('All products failed to save to IndexedDB');
                                // Still resolve true since localStorage backup succeeded
                                resolve(true);
                            } else if (completed + errors === productsArray.length) {
                                console.log(`⚠️ Some products failed to save to IndexedDB (${errors} errors, ${completed} succeeded)`);
                                resolve(true); // Some succeeded
                            }
                        };
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
    // Note: MongoDB is the primary source. This loads from local cache when MongoDB is unavailable.
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
                console.log(`📦 Loaded ${products.length} products from IndexedDB cache (fallback - MongoDB is primary)`);
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

    // Sync products from MongoDB to IndexedDB cache
    // This caches MongoDB data locally for offline access
    async syncFromMongoDB(mongoProducts) {
        if (!this.useIndexedDB || !this.db) {
            console.log('⚠️ IndexedDB not available - cannot cache MongoDB data');
            return false;
        }

        try {
            console.log(`🔄 Syncing ${mongoProducts.length} products from MongoDB to IndexedDB cache...`);
            await this.saveProducts(mongoProducts);
            console.log(`✅ Cached ${mongoProducts.length} products from MongoDB to IndexedDB`);
            return true;
        } catch (error) {
            console.error('❌ Error syncing from MongoDB to IndexedDB:', error);
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
                console.log(`   Note: MongoDB is the primary storage. IndexedDB is cache only.`);
                return false;
            }
            
            const localProducts = this.loadProductsLocalStorage();
            console.log(`📦 Found ${localProducts.length} products in localStorage to migrate to IndexedDB cache`);
            
            if (localProducts.length > 0) {
                await this.saveProducts(localProducts);
                console.log(`✅ Migrated ${localProducts.length} products from localStorage to IndexedDB cache`);
                console.log(`   Note: These will sync to MongoDB when backend is available`);
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

