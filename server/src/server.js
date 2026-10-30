import http from 'http';
import { createApp } from './app.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import { initSocketIO } from './sockets/socketManager.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { Location } from './models/Location.js';
import { seedDemonstrationData } from '../scripts/seedCore.js';

const startServer = async () => {
  try {
    logger.info('Initializing Landslide Risk Monitoring Platform Server...');

    // 1. Connect to Database
    await connectDatabase();

    // 2. Auto-seed if empty database detected
    const locationCount = await Location.countDocuments();
    if (locationCount === 0) {
      logger.info('Empty database detected. Auto-seeding demonstration dataset...');
      await seedDemonstrationData(false);
      logger.info('Auto-seed completed.');
    }

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Real-Time WebSockets
    initSocketIO(server);

    // 5. Listen
    const PORT = ENV.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`=======================================================`);
      logger.info(` Landslide Risk Monitoring & Alert Platform API running `);
      logger.info(` Listening on: http://localhost:${PORT}                 `);
      logger.info(` Environment:  ${ENV.NODE_ENV}                         `);
      logger.info(` Health Check: http://localhost:${PORT}/api/health     `);
      logger.info(` Client Origin:${ENV.CLIENT_URL}                       `);
      logger.info(`=======================================================`);
    });

    // 6. Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await closeDatabase();
        process.exit(0);
      });

      // Force close after 10s if stuck
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return { app, server };
  } catch (err) {
    logger.error('Fatal error starting server:', err);
    process.exit(1);
  }
};

startServer();
