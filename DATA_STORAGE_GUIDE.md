# Data Storage Guide

## Storage Architecture

### ✅ MongoDB Atlas (PRIMARY - Permanent, Centralized Storage)

**Purpose:** All core app data (products, orders)

**When Used:**
- ✅ **Always** when backend is available and MongoDB is connected
- ✅ **Primary source of truth** for all core app data
- ✅ **On page load** - frontend fetches data from MongoDB API using `fetch()`

**Data Flow:**
1. Page loads → Frontend checks MongoDB connection
2. If connected → Fetch products/orders from MongoDB API using `fetch()`
3. Display data from MongoDB

**API Endpoints:**
- `GET /api/products` - Fetch all products
- `GET /api/products/:id` - Fetch single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Fetch all orders
- `POST /api/orders` - Create order

---

### 🔄 IndexedDB (CACHE - Offline Access)

**Purpose:** Cache MongoDB data for offline access

**When Used:**
- 🔄 **Caches** data from MongoDB when available
- 🔄 **Offline mode** - used when MongoDB is unavailable
- 🔄 **NOT primary storage** - just a cache

**Data Flow:**
1. Data loaded from MongoDB → Cache to IndexedDB
2. MongoDB unavailable → Load from IndexedDB cache (offline mode)
3. MongoDB available again → Sync cache back to MongoDB

---

### 💾 localStorage (UI Data ONLY)

**Purpose:** Temporary UI-related data ONLY

**Used For:**
- ✅ **Cart** (temporary shopping cart)
- ✅ **Admin credentials** (session data)
- ✅ **UI preferences** (filters, theme, etc.)
- ✅ **Current category** (UI state)

**NOT Used For:**
- ❌ **Products** - Stored in MongoDB (permanent storage)
- ❌ **Orders** - Stored in MongoDB (permanent storage)
- ❌ **Core app data** - All in MongoDB

---

## Page Load Data Flow

### Step 1: Page Load
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check MongoDB backend availability
    const backendAvailable = await apiService.checkBackend();
    
    // 2. If available, check MongoDB connection
    if (backendAvailable) {
        const dbStatus = await apiService.checkMongoDBStatus();
        if (dbStatus.readyState === 1) {
            // MongoDB connected - fetch from API
            await loadProducts(); // Fetches from MongoDB API
        }
    }
});
```

### Step 2: Load Products from MongoDB API
```javascript
async function loadProducts() {
    // 1. Check MongoDB connection
    const backendAvailable = await apiService.checkBackend();
    const dbStatus = await apiService.checkMongoDBStatus();
    
    // 2. Fetch products from MongoDB API using fetch()
    if (backendAvailable && dbStatus.readyState === 1) {
        const products = await apiService.getProducts('all', false);
        // products = fetched from MongoDB via API
        
        // 3. Cache to IndexedDB for offline access
        await storageManager.syncFromMongoDB(products);
        
        // 4. Display products
        displayProducts(currentCategory);
    }
}
```

### Step 3: API Service (uses fetch())
```javascript
async getProducts(category = 'all', includeImages = false) {
    // Uses fetch() to get data from MongoDB API
    const response = await fetch(`${this.baseURL}/products?category=${category}`);
    const products = await response.json();
    return products;
}
```

---

## localStorage Usage

### ✅ ALLOWED (UI-related data only):

```javascript
// Cart (temporary shopping cart)
localStorage.setItem('cart', JSON.stringify(cart));

// Admin credentials (session data)
localStorage.setItem('adminCredentials', JSON.stringify(ADMIN_CREDENTIALS));

// UI preferences
localStorage.setItem('preferredStorage', 'mongodb');
localStorage.setItem('currentCategory', 'all');
localStorage.setItem('useMongoDB', 'true');
```

### ❌ NOT ALLOWED (core app data):

```javascript
// ❌ DO NOT save products to localStorage
// localStorage.setItem('products', JSON.stringify(products)); // WRONG!

// ❌ DO NOT save orders to localStorage
// localStorage.setItem('orders', JSON.stringify(orders)); // WRONG!

// ✅ Products are stored in MongoDB via API
await apiService.createProduct(productData); // Correct!

// ✅ Orders are stored in MongoDB via API
await apiService.createOrder(orderData); // Correct!
```

---

## Summary

### Storage Hierarchy:

1. **MongoDB Atlas** (PRIMARY)
   - ✅ All products
   - ✅ All orders
   - ✅ Core app data
   - ✅ Permanent, centralized storage
   - ✅ Accessed via API using `fetch()`

2. **IndexedDB** (CACHE)
   - 🔄 Caches MongoDB data
   - 🔄 Used for offline access
   - 🔄 NOT primary storage

3. **localStorage** (UI DATA ONLY)
   - 💾 Cart (temporary)
   - 💾 Admin credentials (session)
   - 💾 UI preferences
   - ❌ NOT for products/orders

---

## Implementation

### Frontend Code:

```javascript
// ✅ CORRECT: Fetch from MongoDB API on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts(); // Fetches from MongoDB API using fetch()
    loadCart(); // Loads UI data (cart) from localStorage
});

// ✅ CORRECT: Save product to MongoDB via API
async function saveProduct(productData) {
    const saved = await apiService.createProduct(productData); // Saves to MongoDB
    await storageManager.syncFromMongoDB([saved]); // Cache to IndexedDB
    // DO NOT save to localStorage - it's not for products!
}

// ✅ CORRECT: Save cart to localStorage (UI data)
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart)); // OK - UI data
}

// ❌ WRONG: Don't save products to localStorage
// localStorage.setItem('products', JSON.stringify(products)); // WRONG!
```

---

## Benefits

### ✅ MongoDB as Primary Storage:
- Permanent data storage
- Accessible from anywhere
- Single source of truth
- No data loss risk
- Scalable

### ✅ localStorage for UI Data Only:
- Fast access for UI state
- Temporary data (cart)
- Session data (admin credentials)
- Not critical data

---

**All core app data (products, orders) is stored in MongoDB Atlas and fetched via API on page load!** ✅

