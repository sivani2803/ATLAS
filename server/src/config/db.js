import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let mongodInstance = null;
let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) return mongoose.connection;

  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  if (ENV.USE_MEMORY_DB) {
    logger.info('USE_MEMORY_DB=true requested. Initializing embedded in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      isConnected = true;
      logger.info(`Connected to embedded in-memory MongoDB at: ${uri}`);
      return mongoose.connection;
    } catch (err) {
      logger.error('Failed to initialize MongoMemoryServer', err);
      throw err;
    }
  }

  try {
    logger.info(`Attempting to connect to MongoDB URI: ${ENV.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    await mongoose.connect(ENV.MONGODB_URI, mongoOptions);
    isConnected = true;
    logger.info('Successfully connected to MongoDB.');
    return mongoose.connection;
  } catch (primaryErr) {
    logger.warn(`Could not connect to configured MongoDB (${primaryErr.message}).`);

    // In non-production or development fallback to MongoMemoryServer
    if (ENV.NODE_ENV !== 'production') {
      logger.info('Falling back to zero-configuration embedded MongoDB (mongodb-memory-server) for seamless local execution...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        isConnected = true;
        logger.info(`Connected to embedded in-memory MongoDB at: ${fallbackUri}`);
        logger.info('NOTE: For production persistence, configure MONGODB_URI with your MongoDB Atlas cluster connection string.');
        return mongoose.connection;
      } catch (memErr) {
        logger.error('Failed to start in-memory fallback MongoDB:', memErr);
        throw primaryErr;
      }
    } else {
      throw primaryErr;
    }
  }
};

export const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || 'local',
    name: mongoose.connection.name || 'landslide_db',
    isInMemory: !!mongodInstance
  };
};

export const closeDatabase = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  logger.info('Database connection closed gracefully.');
};
