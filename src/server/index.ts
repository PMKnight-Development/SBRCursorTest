import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from '../config/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
// import { validateRequest } from './middleware/validation';

// Import routes
import authRoutes from './routes/auth';
import callsRoutes from './routes/calls';
import unitsRoutes from './routes/units';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import reportsRoutes from './routes/reports';
import notificationsRoutes from './routes/notifications';
import protocolRoutes from './routes/protocol';
import arcgisRoutes from './routes/arcgis';

// Import WebSocket handlers
import { setupWebSocketHandlers } from './websocket';

// Import database connection
import { db } from '../config/database';

const app = express();
const server = createServer(app);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for production)
if (config.environment === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: process.env['npm_package_version'] || '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/protocol', protocolRoutes);
app.use('/api/arcgis', arcgisRoutes);

// Serve React app for all other routes (SPA)
if (config.environment === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Setup WebSocket handlers
setupWebSocketHandlers(io);

// Database connection test
async function testDatabaseConnection() {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  try {
    await db.destroy();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  process.exit(0);
}

// Start server
async function startServer() {
  try {
    await testDatabaseConnection();
    
    server.listen(config.port, () => {
      logger.info(`SBR CAD Server running on port ${config.port}`);
      logger.info(`Environment: ${config.environment}`);
      logger.info(`Client URL: http://localhost:${config.clientPort}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export { app, server, io }; 