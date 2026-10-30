import express from 'express';
import { sensorController } from '../controllers/sensorController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, sensorController.getAllSensors);
router.get('/:id', protect, sensorController.getSensorById);
router.post('/', protect, restrictTo('admin', 'operator'), sensorController.createSensor);
router.put('/:id', protect, restrictTo('admin', 'operator'), sensorController.updateSensor);
router.delete('/:id', protect, restrictTo('admin'), sensorController.deleteSensor);

export default router;

