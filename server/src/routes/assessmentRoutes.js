import express from 'express';
import { assessmentController } from '../controllers/assessmentController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/latest', protect, assessmentController.getLatestAssessments);
router.get('/config', protect, assessmentController.getConfig);
router.get('/location/:locationId', protect, assessmentController.getLocationAssessments);
router.post('/recalculate/:locationId', protect, restrictTo('admin', 'operator'), assessmentController.recalculateLocationRisk);

export default router;

