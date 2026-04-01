require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { initializeSocketHandlers } = require('./socket/socketHandler');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'GEMINI_API_KEY', 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const normalizeOrigin = (origin) => (origin || '').trim().replace(/\/+$/, '');

// Supports FRONTEND_URL plus comma-separated FRONTEND_URLS for multi-env deploys.
const configuredOrigins = [
  ...(process.env.FRONTEND_URLS || '').split(','),
  process.env.FRONTEND_URL || 'http://localhost:5173'
]
  .map(normalizeOrigin)
  .filter(Boolean);

// Keep common local dev URLs allowed even when production URLs are configured.
if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

const allowedOrigins = [...new Set(configuredOrigins)];
const socketPath = process.env.SOCKET_PATH || '/socket.io';

const corsOriginValidator = (origin, callback) => {
  // Allow non-browser clients/health checks with no origin.
  if (!origin) {
    callback(null, true);
    return;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

// Initialize Socket.io
const io = new Server(httpServer, {
  path: socketPath,
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' })); // Increased for image uploads
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/conversations', require('./routes/conversation.routes'));
app.use('/api/data', require('./routes/data.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', socketio: 'enabled' });
});

// Initialize Socket.io handlers
initializeSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔌 Socket.io enabled on path: ${socketPath}`);
});
