import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

let ioInstance = null;

export const initSocketIO = (httpServer) => {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  // Authenticate socket connections using JWT token
  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]);
      if (!token) {
        return next(new Error('Authentication required for real-time telemetry stream'));
      }
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid or expired telemetry authentication token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`Authenticated socket client connected: ${socket.id} (user: ${socket.user?.id || 'unknown'})`);


    // Join regional or location-specific rooms if requested
    socket.on('join:location', (locationId) => {
      if (locationId) {
        socket.join(`location:${locationId}`);
        logger.debug(`Socket ${socket.id} joined location:${locationId}`);
      }
    });

    socket.on('leave:location', (locationId) => {
      if (locationId) {
        socket.leave(`location:${locationId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

export const broadcastReading = (reading, locationId) => {
  if (!ioInstance) return;
  ioInstance.emit('reading:new', reading);
  if (locationId) {
    ioInstance.to(`location:${locationId}`).emit('reading:new', reading);
  }
};

export const broadcastAssessment = (assessment, locationId) => {
  if (!ioInstance) return;
  ioInstance.emit('assessment:updated', assessment);
  if (locationId) {
    ioInstance.to(`location:${locationId}`).emit('assessment:updated', assessment);
  }
};

export const broadcastAlert = (alert, locationId) => {
  if (!ioInstance) return;
  ioInstance.emit('alert:new', alert);
  if (locationId) {
    ioInstance.to(`location:${locationId}`).emit('alert:new', alert);
  }
};

export const broadcastAlertUpdate = (event, alert) => {
  if (!ioInstance) return;
  ioInstance.emit(event, alert);
};

export const broadcastSensorStatus = (sensor) => {
  if (!ioInstance) return;
  ioInstance.emit('sensor:status_change', sensor);
};
