# Quick Setup - MongoDB Atlas for Production

## 🚀 5-Minute Setup

### 1. Get MongoDB Atlas Connection String

1. Go to: https://cloud.mongodb.com/
2. Create free cluster (M0 FREE)
3. Database Access → Add User (save username/password)
4. Network Access → Allow Access from Anywhere (or add your server IP)
5. Database → Connect → Connect your application
6. Copy connection string

### 2. Create .env File

In `backend/` folder, create `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
PORT=3000
```

Replace:
- `username` → Your MongoDB username
- `password` → Your MongoDB password  
- `cluster0.xxxxx` → Your cluster name

### 3. Start Backend

```bash
cd backend
npm start
```

Look for: `✅ Connected to MongoDB successfully`

### 4. Migrate Data (If Needed)

Open browser console on your website, run:
```javascript
migrateFromIndexedDBToMongoDB()
```

### 5. Test

Visit: `https://trendydresses.co.ke/api/health`

Should return: `{"status":"ok","message":"Trendy Dresses API is running"}`

## 📚 Full Guides

- **Complete Setup**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **MongoDB Atlas Setup**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- **Export/Import Data**: [MONGODB_EXPORT_IMPORT.md](./MONGODB_EXPORT_IMPORT.md)

## ✅ Verification

Your setup is working if:
- ✅ Backend shows: `Connected to MongoDB successfully`
- ✅ API health check returns OK
- ✅ Products load on website
- ✅ Admin panel can add/edit products
- ✅ Products appear in MongoDB Atlas → Browse Collections

## 🔧 Troubleshooting

**Can't connect?**
- Check IP whitelist in MongoDB Atlas
- Wait 2-3 minutes after adding IP
- Verify connection string in .env

**Data not showing?**
- Check backend server is running
- Verify MongoDB connection in logs
- Check browser console for errors

