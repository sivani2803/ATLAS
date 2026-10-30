import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { ENV } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allow maps and local dev websocket connections
    crossOriginEmbedderPolicy: false
  }));

  // CORS Configuration
  const allowedOrigins = [
    ENV.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, edge IoT devices)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sensor-key', 'x-api-key']
  }));

  // Request Logging
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Body Parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // General API Rate Limiting
  app.use('/api/', apiLimiter);

  // Direct Health check alias
  app.get('/api/health', (req, res, next) => {
    // Delegate to systemRoutes
    req.url = '/health';
    return systemRoutes(req, res, next);
  });

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/sensors', sensorRoutes);
  app.use('/api/readings', readingRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/system', systemRoutes);

  // Root Welcome & Documentation pointer
  app.get('/', (req, res) => {
    res.json({
      name: 'Landslide Risk Monitoring and Alert Platform API',
      version: '1.0.0',
      status: 'ONLINE',
      docs: '/api/assessments/config',
      health: '/api/health'
    });
  });

  // 404 Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.originalUrl} not found on this telemetry service.`,
        statusCode: 404
      }
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
