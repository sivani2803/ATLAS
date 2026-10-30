import express from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, analyticsController.getDashboardSummary);
router.get('/trends', protect, analyticsController.getTrends);
router.get('/export/csv', protect, analyticsController.exportCsv);

export default router;

