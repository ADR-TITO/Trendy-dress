# Migrate All Data to MongoDB

This guide will help you transfer ALL your products from localStorage to MongoDB.

## Prerequisites

1. **Backend server must be running**
   - Navigate to `backend` folder
   - Run: `npm start`
   - Wait for: `✅ Connected to MongoDB successfully`
   - **Keep the server window open**

2. **Backend server must be accessible**
   - Open: http://localhost:3000/api/health
   - Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`

## Step 1: Start Backend Server

1. Open PowerShell or Command Prompt
2. Navigate to backend folder:
   ```powershell
   cd "C:\Users\user\TRENDY DRESSES\backend"
   ```
3. Start the server:
   ```powershell
   npm start
   ```
4. Wait for: `✅ Connected to MongoDB successfully`

## Step 2: Open Your Website

1. Open `index.html` in your browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab

## Step 3: Run Migration

In the browser console, type:
```javascript
migrateProductsToMongoDB()
```

Press **Enter** and wait for the migration to complete.

## What the Migration Does

✅ **Checks backend availability** - Verifies MongoDB server is running
✅ **Preserves ALL data** - Transfers all product properties including:
   - Product names
   - Categories
   - Prices
   - Discounts
   - Quantities
   - Sizes (normalized)
   - **Images (full base64 data)**
✅ **Handles duplicates** - Updates existing products, creates new ones
✅ **Shows progress** - Displays each product being migrated
✅ **Provides summary** - Shows how many were created/updated/failed

## Migration Process

1. **Checks localStorage** - Finds all products stored locally
2. **Checks MongoDB** - Sees what's already in MongoDB
3. **Compares products** - Identifies duplicates by name + size
4. **Updates existing** - Updates products that already exist
5. **Creates new** - Adds products that don't exist
6. **Preserves images** - Transfers all image data (if available)
7. **Reloads products** - Refreshes from MongoDB after migration

## Expected Output

You'll see progress like this:
```
🚀 Starting migration to MongoDB...
📦 Found 31 products in localStorage
🔄 Starting migration to MongoDB...

📤 Migrating 31 products...

➕ Creating new: Floral Summer Dress (Size: M)...
✅ Created: Floral Summer Dress (1/31)
➕ Creating new: Little Black Dress (Size: S)...
✅ Created: Little Black Dress (2/31)
...

📊 Migration Summary:
   ✅ Total migrated: 31/31
   ➕ Created: 28
   🔄 Updated: 3
   ❌ Failed: 0

✅ Migration complete! Reloading products from MongoDB...
```

## After Migration

1. **Products will reload** - Automatically loaded from MongoDB
2. **localStorage preference updated** - Set to use MongoDB
3. **Products display** - Should see all your products
4. **Images preserved** - All product images should be visible

## Verify Migration

After migration, check:
1. **Browser console** - Should see: `📦 Loaded X products from MongoDB API`
2. **Products display** - All products should be visible
3. **MongoDB database** - Products stored in MongoDB Atlas

## Troubleshooting

### "MongoDB backend is not available"
- **Fix:** Start the backend server first (see Step 1)
- Verify server is running at: http://localhost:3000/api/health

### "MongoDB is not connected"
- **Fix:** Check backend server console for connection errors
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Wait 2-3 minutes after updating IP whitelist
- Restart the backend server

### "Migration failed: [error]"
- **Check:** Backend server console for detailed error messages
- **Verify:** MongoDB connection is working
- **Retry:** Run `migrateProductsToMongoDB()` again

### Products not showing after migration
- **Refresh page** - Press F5 to reload
- **Check console** - Look for error messages
- **Verify MongoDB** - Check if products were saved

## Important Notes

- **Keep server running** - Don't close the backend server window
- **Images preserved** - All product images are transferred
- **No data loss** - Original localStorage data is kept as backup
- **Duplicate handling** - Existing products are updated, new ones are created
- **Size normalization** - Sizes are normalized during migration (e.g., "38" → "M")

## Success Indicators

✅ Migration summary shows all products migrated
✅ Products reload from MongoDB
✅ Console shows: `📦 Loaded X products from MongoDB API`
✅ All products display correctly
✅ Product images are visible (if they had images)

## Next Steps

After successful migration:
1. **Verify products** - Check that all products are visible
2. **Test adding** - Add a new product to verify MongoDB is working
3. **Test deleting** - Delete a product to verify MongoDB is working
4. **Optional: Clear localStorage** - You can clear localStorage if you want (backup is in MongoDB)

## Backup

Your original localStorage data is preserved as a backup. You can:
- **Keep it** - Acts as backup if MongoDB has issues
- **Clear it** - Run `localStorage.removeItem('products')` in console (optional)




