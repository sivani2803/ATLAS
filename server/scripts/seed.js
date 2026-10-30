import { connectDatabase, closeDatabase } from '../src/config/db.js';
import { seedDemonstrationData } from './seedCore.js';
import { logger } from '../src/utils/logger.js';

const run = async () => {
  try {
    logger.info('Initializing database connection for standalone seed command...');
    await connectDatabase();
    const result = await seedDemonstrationData(true);
    logger.info('Seed completed successfully:', result);
    process.exit(0);
  } catch (err) {
    logger.error('Failed to seed database:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
};

run();
