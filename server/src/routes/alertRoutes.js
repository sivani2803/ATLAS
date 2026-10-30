import express from 'express';

import { alertController } from '../controllers/alertController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, alertController.getAllAlerts);
router.get('/:id', protect, alertController.getAlertById);
router.put('/:id/acknowledge', protect, restrictTo('admin', 'operator'), alertController.acknowledgeAlert);
router.put('/:id/resolve', protect, restrictTo('admin', 'operator'), alertController.resolveAlert);

export default router;

