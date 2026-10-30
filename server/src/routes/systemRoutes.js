import express from 'express';
import { systemController } from '../controllers/systemController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', systemController.getHealth);
router.get('/ready', systemController.getReadiness);
router.post('/seed', protect, restrictTo('admin'), systemController.seedDemo);
router.post('/reset', protect, restrictTo('admin'), systemController.resetDemo);
router.post('/simulate-pulse', protect, restrictTo('admin', 'operator'), systemController.simulatePulse);
router.get('/audit-logs', protect, restrictTo('admin'), systemController.getAuditLogs);

export default router;

