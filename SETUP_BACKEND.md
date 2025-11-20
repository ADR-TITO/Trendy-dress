# Backend Database Setup Guide

## Quick Start

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- Express (web server)
- SQLite3 (database)
- CORS (cross-origin resource sharing)
- bcryptjs (password hashing)
- body-parser (request parsing)

### Step 3: Initialize Database
```bash
npm run init-db
```

This creates:
- Database file: `backend/database/database.db`
- All required tables
- Default admin user (username: `admin`, password: `admin123`)

### Step 4: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The API will be available at: `http://localhost:3000`

## Testing the API

### Check if server is running:
```bash
curl http://localhost:3000/api/health
```

### Get all products:
```bash
curl http://localhost:3000/api/products
```

### Get products by category:
```bash
curl http://localhost:3000/api/products?category=shirts
```

### Admin login:
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Next Steps

After the backend is running, you'll need to:

1. **Update the frontend** (`script.js`) to use the API endpoints instead of localStorage
2. **Change the default admin password** through the admin panel
3. **Migrate existing data** from localStorage to the database (if needed)

## API Base URL

When updating the frontend, use:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Database Location

The database file is stored at:
```
backend/database/database.db
```

**Note**: This file is automatically created. You can backup this file to save all your data.

## Default Admin Credentials

⚠️ **Security Warning**: Change these immediately after setup!

- **Username**: `admin`
- **Password**: `admin123`

## Troubleshooting

**Port 3000 already in use?**
- Change the PORT in `backend/server.js` or set environment variable: `PORT=3001 npm start`

**Database errors?**
- Delete `backend/database/database.db` and run `npm run init-db` again

**Module not found?**
- Make sure you ran `npm install` in the `backend` directory









