import express from 'express';
import { locationController } from '../controllers/locationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, locationController.getAllLocations);
router.get('/:id', protect, locationController.getLocationById);
router.post('/', protect, restrictTo('admin', 'operator'), locationController.createLocation);
router.put('/:id', protect, restrictTo('admin', 'operator'), locationController.updateLocation);
router.delete('/:id', protect, restrictTo('admin'), locationController.deleteLocation);

export default router;

