import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.url}: ${err.message}`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Data Validation Failed';
    details = Object.values(err.errors).map(e => e.message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Must be unique.`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with specified identifier format: ${err.value}`;
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Invalid request parameters';
    details = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details,
      path: req.originalUrl
    },
    timestamp: new Date().toISOString()
  });
};
