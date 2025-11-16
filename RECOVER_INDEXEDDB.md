# Recover Products from IndexedDB

## Quick Recovery Guide

If you have products stored in IndexedDB but can't see them, follow these steps:

## Method 1: Automatic Recovery (Recommended)

1. **Refresh your website** (Press F5)
2. The system will **automatically check IndexedDB** and recover products
3. Products should appear automatically

## Method 2: Manual Recovery (Browser Console)

1. **Open your website**
2. **Press F12** to open Developer Tools
3. **Click the Console tab**
4. **Type and press Enter:**
   ```javascript
   recoverFromIndexedDB()
   ```
5. This will show you what's in IndexedDB

## Method 3: Migrate to MongoDB (When Backend is Running)

1. **Start the backend server:**
   ```powershell
   cd backend
   npm start
   ```
2. **Wait for:** `✅ Connected to MongoDB successfully`
3. **Open your website**
4. **Press F12** to open Developer Tools
5. **Click the Console tab**
6. **Type and press Enter:**
   ```javascript
   migrateFromIndexedDBToMongoDB()
   ```
7. **Wait for migration to complete**

## What These Functions Do

### `recoverFromIndexedDB()`
- Checks IndexedDB for products
- Shows how many products are found
- Shows how many have images
- Lists all products
- **Does NOT migrate** - just shows what's there

### `migrateFromIndexedDBToMongoDB()`
- Checks if backend server is running
- Recovers all products from IndexedDB
- Migrates them to MongoDB
- Preserves ALL data including images
- Updates existing products, creates new ones
- Reloads products from MongoDB after migration

## Expected Output

When you run `recoverFromIndexedDB()`, you'll see:
```
🔍 Checking IndexedDB for products...
📦 Found 30 products in IndexedDB
📷 30/30 products have images in IndexedDB
📦 Products: [
  { id: 13, name: "Product Name", size: "M", hasImage: true },
  ...
]
```

When you run `migrateFromIndexedDBToMongoDB()`, you'll see:
```
🚀 Starting migration from IndexedDB to MongoDB...
📦 Found 30 products in IndexedDB
📷 30/30 products have images in IndexedDB
🔄 Starting migration to MongoDB...

📤 Migrating 30 products from IndexedDB to MongoDB...

➕ Creating: Product Name (Size: M) [with image]...
✅ Created: Product Name (1/30)
...

📊 Migration Summary:
   ✅ Total migrated: 30/30
   ➕ Created: 30
   🔄 Updated: 0
   ❌ Failed: 0
   📷 Products with images: 30

✅ Migration complete! Reloading products from MongoDB...
```

## Troubleshooting

### "IndexedDB not available"
- **Cause:** IndexedDB might not be supported or initialized
- **Fix:** Refresh the page and try again

### "No products found in IndexedDB"
- **Cause:** Products might have been cleared
- **Fix:** Check if products are in localStorage instead

### "MongoDB backend is not available"
- **Cause:** Backend server is not running
- **Fix:** Start the backend server first (see Method 3)

### Products not showing after recovery
- **Fix:** Refresh the page (F5)
- **Check:** Browser console for error messages
- **Verify:** Products were loaded from IndexedDB

## Important Notes

- **IndexedDB is checked automatically** when the page loads
- **Products are recovered automatically** if IndexedDB has more products than localStorage
- **Images are preserved** when migrating to MongoDB
- **All product data is preserved** (names, prices, sizes, images, etc.)

## Quick Commands

```javascript
// Check what's in IndexedDB
recoverFromIndexedDB()

// Migrate from IndexedDB to MongoDB (when backend is running)
migrateFromIndexedDBToMongoDB()

// Migrate from localStorage to MongoDB (when backend is running)
migrateProductsToMongoDB()

// Check current products
console.log(products.length)
console.log(products)
```





