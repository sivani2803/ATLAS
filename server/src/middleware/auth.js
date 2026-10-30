import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User session invalid. Please log in again.', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'Account is suspended or inactive.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401, error.message);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, `Forbidden. Role '${req.user?.role}' is not authorized for this operation.`, 403);
    }
    next();
  };
};

/**
 * Validates either JWT token or Edge Hardware Pre-Shared Ingestion Secret
 */
export const verifyIngestionAuth = async (req, res, next) => {
  const edgeKey = req.headers['x-sensor-key'] || req.headers['x-api-key'];
  if (edgeKey && edgeKey === ENV.SENSOR_INGESTION_KEY) {
    req.isEdgeDevice = true;
    return next();
  }

  // Fallback to user session
  return protect(req, res, next);
};
