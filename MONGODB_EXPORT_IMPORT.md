# Export Local MongoDB Data and Import to MongoDB Atlas

This guide will help you export your local MongoDB data and import it into MongoDB Atlas.

## Prerequisites

1. **MongoDB Tools Installed**:
   - **Windows**: Download from https://www.mongodb.com/try/download/database-tools
   - **Mac**: `brew install mongodb-database-tools`
   - **Linux**: `sudo apt-get install mongodb-database-tools` (or use package manager)

2. **Local MongoDB Running** (if you have local data):
   - Make sure your local MongoDB is running
   - Default connection: `mongodb://localhost:27017/trendy-dresses`

3. **MongoDB Atlas Connection String**:
   - You should have this from the MongoDB Atlas setup guide
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses`

## Method 1: Export/Import Using MongoDB Tools (Recommended)

### Step 1: Export from Local MongoDB

1. **Export All Collections** (Full Database Backup):
   ```bash
   # Navigate to your project folder
   cd "C:\Users\user\TRENDY DRESSES"
   
   # Create export directory
   mkdir mongodb-export
   cd mongodb-export
   
   # Export entire database
   mongodump --uri="mongodb://localhost:27017/trendy-dresses" --out=./backup
   ```

2. **Export Specific Collections** (if you only need certain data):
   ```bash
   # Export products collection
   mongoexport --uri="mongodb://localhost:27017/trendy-dresses" --collection=products --out=products.json --pretty
   
   # Export orders collection
   mongoexport --uri="mongodb://localhost:27017/trendy-dresses" --collection=orders --out=orders.json --pretty
   ```

3. **Verify Export**:
   - Check that files were created in the `mongodb-export` folder
   - For `mongodump`: You should see a `backup/trendy-dresses/` folder with `.bson` files
   - For `mongoexport`: You should see `.json` files

### Step 2: Import to MongoDB Atlas

#### Option A: Import Full Database (mongorestore)

1. **Import Entire Database**:
   ```bash
   # Replace with your MongoDB Atlas connection string
   mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses" ./backup/trendy-dresses
   ```

2. **Verify Import**:
   - Go to MongoDB Atlas → Database → Browse Collections
   - You should see all your collections (products, orders, etc.)

#### Option B: Import Specific Collections (mongoimport)

1. **Import Products**:
   ```bash
   mongoimport --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses" --collection=products --file=products.json --jsonArray
   ```

2. **Import Orders**:
   ```bash
   mongoimport --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses" --collection=orders --file=orders.json --jsonArray
   ```

## Method 2: Export from IndexedDB/localStorage (If Using Frontend Storage)

If your data is in IndexedDB or localStorage (not local MongoDB), use this method:

### Step 1: Export from Browser

1. **Open Browser Console** on your website:
   - Press `F12` or right-click → Inspect → Console

2. **Run Export Script**:
   ```javascript
   // Export products from IndexedDB
   async function exportProducts() {
       const storageManager = new StorageManager();
       await storageManager.init();
       const products = await storageManager.loadProducts();
       
       // Create download link
       const dataStr = JSON.stringify(products, null, 2);
       const dataBlob = new Blob([dataStr], {type: 'application/json'});
       const url = URL.createObjectURL(dataBlob);
       const link = document.createElement('a');
       link.href = url;
       link.download = 'products-export.json';
       link.click();
       
       console.log(`✅ Exported ${products.length} products`);
       return products;
   }
   
   exportProducts();
   ```

3. **Download the JSON file** (it will download automatically)

### Step 2: Import to MongoDB Atlas

1. **Use MongoDB Compass** (GUI Tool - Recommended):
   - Download: https://www.mongodb.com/products/compass
   - Connect to MongoDB Atlas using your connection string
   - Select `trendy-dresses` database
   - Click "Add Data" → "Import File"
   - Select your exported JSON file
   - Choose collection name: `products`
   - Click "Import"

2. **Or Use Command Line**:
   ```bash
   mongoimport --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses" --collection=products --file=products-export.json --jsonArray
   ```

## Method 3: Using MongoDB Compass (Easiest - GUI Method)

### Step 1: Download MongoDB Compass

1. Download from: https://www.mongodb.com/products/compass
2. Install and open MongoDB Compass

### Step 2: Connect to Local MongoDB

1. **Connect to Local Database**:
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"
   - Navigate to `trendy-dresses` database

2. **Export Collections**:
   - Right-click on a collection (e.g., `products`)
   - Select "Export Collection"
   - Choose format: JSON or CSV
   - Save the file

### Step 3: Connect to MongoDB Atlas

1. **Connect to Atlas**:
   - Use your MongoDB Atlas connection string:
     `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses`
   - Click "Connect"
   - Navigate to `trendy-dresses` database

2. **Import Collections**:
   - Click "Add Data" → "Import File"
   - Select your exported file
   - Choose collection name
   - Click "Import"

## Method 4: Using Migration Script (Automated)

If you have a large amount of data, you can use the built-in migration function:

1. **On Your Website**:
   - Open browser console
   - Run: `migrateFromIndexedDBToMongoDB()`
   - This will automatically migrate all products from IndexedDB to MongoDB Atlas

2. **Verify Migration**:
   - Check MongoDB Atlas → Browse Collections
   - You should see all your products

## Verification Steps

After importing, verify your data:

1. **Check Collection Counts**:
   ```bash
   # Connect to MongoDB Atlas
   mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses"
   
   # Count documents
   db.products.countDocuments()
   db.orders.countDocuments()
   ```

2. **Check Sample Data**:
   ```bash
   # View sample products
   db.products.find().limit(5).pretty()
   
   # View sample orders
   db.orders.find().limit(5).pretty()
   ```

3. **Verify in MongoDB Atlas UI**:
   - Go to: Database → Browse Collections
   - Check that all collections exist
   - Verify data looks correct

## Troubleshooting

### Export Errors

**"mongodump: command not found"**:
- Install MongoDB Database Tools
- Add to PATH environment variable

**"Connection refused"**:
- Make sure local MongoDB is running
- Check connection string is correct

### Import Errors

**"Authentication failed"**:
- Verify username and password in connection string
- Check database user has write permissions

**"Network timeout"**:
- Check IP whitelist in MongoDB Atlas
- Verify internet connection
- Try again after a few minutes

**"Duplicate key error"**:
- Data already exists in Atlas
- Use `--drop` flag to replace existing data:
  ```bash
  mongorestore --uri="..." --drop ./backup/trendy-dresses
  ```

## Quick Reference Commands

### Export
```bash
# Full database
mongodump --uri="mongodb://localhost:27017/trendy-dresses" --out=./backup

# Single collection
mongoexport --uri="mongodb://localhost:27017/trendy-dresses" --collection=products --out=products.json
```

### Import
```bash
# Full database
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/trendy-dresses" ./backup/trendy-dresses

# Single collection
mongoimport --uri="mongodb+srv://user:pass@cluster.mongodb.net/trendy-dresses" --collection=products --file=products.json --jsonArray
```

## Next Steps

After importing your data:
1. Update your `.env` file with MongoDB Atlas connection string
2. Restart your backend server
3. Test your website to ensure data loads correctly
4. Set up automated backups in MongoDB Atlas

## Security Notes

- **Never commit** `.env` files or connection strings to Git
- **Use strong passwords** for database users
- **Limit IP access** in MongoDB Atlas Network Access
- **Regular backups** - Set up automated backups in MongoDB Atlas

