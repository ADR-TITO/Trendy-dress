const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized');
} catch (e) {
  console.log('Firebase Admin not initialized: Missing serviceAccountKey.json');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Node.js Backend Microservice' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);

// Real-time Socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('admin_product_updated', (data) => {
      // Broadcast to all clients (including sender config) that products need refresh
      io.emit('product_edited', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routers
app.set('io', io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Node.js microservice running on port ${PORT}`);
});
