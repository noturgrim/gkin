const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS Configuration
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Import database initialization
const { initializeDatabase } = require('./db/init');

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('GKIN API is running');
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a room (for private messaging if needed later)
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  // Handle new messages
  socket.on('message', async (message) => {
    try {
      // We'll handle message saving in the API endpoint
      // Just broadcast the message to all clients
      io.emit('message', message);
    } catch (error) {
      console.error('Error handling socket message:', error);
    }
  });
  
  // Handle mentions
  socket.on('mention', (data) => {
    // Broadcast to specific roles or users
    if (data.type === 'role') {
      io.to(data.value).emit('mention', data);
    } else {
      io.to(`user-${data.userId}`).emit('mention', data);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize database before starting the server
initializeDatabase()
  .then(() => {
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
