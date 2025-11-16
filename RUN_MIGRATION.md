# How to Run Migration

## Quick Steps

1. **Open your website** in the browser
2. **Press F12** to open Developer Tools
3. **Click the Console tab**
4. **Type this command:**
   ```javascript
   migrateProductsToMongoDB()
   ```
5. **Press Enter**

## What You'll See

The migration will:
- Show progress for each product: `✅ Migrated: Product Name (1/16)`
- Display final summary: `📊 Migration complete: ✅ Success: 16, ❌ Failed: 0`
- Show a success notification on the page
- Automatically reload products from MongoDB

## Expected Output

```
🔄 Starting migration of 16 products to MongoDB...
✅ Migrated: Pink Chiffon (1/16)
✅ Migrated: Purple Overlap Flowered (2/16)
✅ Migrated: 2 Piece Purple Suit (3/16)
...
📊 Migration complete:
   ✅ Success: 16
   ❌ Failed: 0
```

## If Migration Fails

### Error: "MongoDB not enabled"
- Make sure backend server is running
- Refresh the page and try again

### Error: "Database not connected"
- MongoDB is not connected
- Go to MongoDB Atlas → Network Access → Allow Access from Anywhere
- Restart backend server
- Try migration again

### Some products fail to migrate
- Check server console for specific errors
- Failed products will be logged with error messages
- You can try migrating again - it will skip products that already exist

## After Successful Migration

1. **Refresh the page**
2. **Check console** - should see: `📦 Loaded 16 products from MongoDB API`
3. **No more localStorage warnings** - all data is now in MongoDB!









