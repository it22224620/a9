import { Router } from 'express';
import { body } from 'express-validator';
import { VehicleController } from '../controllers/vehicle.controller.js';

const router = Router();

// Validation middleware for seat locking
const lockSeatsValidation = [
  body('seatIds')
    .isArray({ min: 1 })
    .withMessage('At least one seat ID is required'),
  
  body('seatIds.*')
    .isUUID()
    .withMessage('Valid seat IDs are required'),
  
  body('customerEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid customer email is required')
];

// Routes
router.get('/routes', VehicleController.getAllRoutes);
router.get('/vehicles/:routeId', VehicleController.getVehiclesByRoute);
router.get('/vehicle/:vehicleId', VehicleController.getVehicleDetails);
router.get('/seats/:vehicleId', VehicleController.getSeatLayout);
router.post('/seats/lock', lockSeatsValidation, VehicleController.lockSeats);
router.post('/seats/unlock-expired', VehicleController.unlockExpiredSeats);

export default router;