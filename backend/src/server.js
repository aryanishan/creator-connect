import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import { setupSocket } from './socket/socketHandler.js';
import { setSocketServer } from './socket/socketEmitter.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Render and similar platforms run behind a proxy.
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/webhooks', webhookRoutes);
app.get('/', (req, res) => {
  res.send('CreatorConnect API is running...');
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Socket.io setup
setSocketServer(io);
setupSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = Number(process.env.PORT) || 5000;

httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env.`);
    process.exit(1);
  }
  console.error('Server start error:', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
