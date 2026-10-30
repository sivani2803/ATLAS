import express from 'express';
import { readingController } from '../controllers/readingController.js';
import { verifyIngestionAuth, protect } from '../middleware/auth.js';
import { ingestionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/ingest', ingestionLimiter, verifyIngestionAuth, readingController.ingestSingle);
router.post('/batch', ingestionLimiter, verifyIngestionAuth, readingController.ingestBatch);
router.get('/', protect, readingController.getReadings);

export default router;

