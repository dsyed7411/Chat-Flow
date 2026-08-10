require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const socketHandler = require('./socket/socketHandler');
require('./config/db'); // Initialize SQLite DB

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app for access in REST controllers
app.set('io', io);

// Initialize Socket.io event listeners
socketHandler(io);

// Root Endpoint
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; height: 100vh; box-sizing: border-box;">
      <h1 style="color: #6366f1; font-size: 2.5rem;">⚡ ChatFlow Backend API is Active!</h1>
      <p style="color: #9ca3af; font-size: 1.1rem;">Node.js + Express + Socket.io Server is running smoothly.</p>
      <p style="margin-top: 20px;"><a href="/api/health" style="color: #38bdf8; text-decoration: none; font-weight: 600;">Check Health Status (/api/health)</a></p>
    </div>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Chat application backend is running smoothly' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Server listening on port: ${PORT}`);
  console.log(`REST API URL: http://localhost:${PORT}/api`);
  console.log(`Socket.io Server active`);
  console.log(`=================================`);
});
