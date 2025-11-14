# MongoDB Setup Guide

## Prerequisites
- Node.js installed
- MongoDB installed locally OR MongoDB Atlas account

## Installation

1. **Install MongoDB dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB connection:**
   
   **Option A: Local MongoDB**
   - Install MongoDB locally: https://www.mongodb.com/try/download/community
   - Start MongoDB service
   - Create `.env` file in `backend/` folder:
     ```
     MONGODB_URI=mongodb://localhost:27017/trendy-dresses
     PORT=3000
     ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string from MongoDB Atlas
   - Create `.env` file in `backend/` folder:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trendy-dresses?retryWrites=true&w=majority&appName=Cluster0
     PORT=3000
     ```
   
   **Note:** Replace `username`, `password`, and `cluster0.xxxxx` with your actual MongoDB Atlas credentials.

3. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/quantity` - Update product quantity

## Frontend Integration

The frontend will automatically use the MongoDB API instead of IndexedDB when the backend is running.

Make sure the backend is running on `http://localhost:3000` before using the website.

