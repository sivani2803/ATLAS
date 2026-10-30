import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const ingestionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // 600 telemetry points / min
  message: {
    success: false,
    error: {
      message: 'Ingestion rate limit exceeded. Batch readings or reduce edge transmission rate.',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
