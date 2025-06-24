import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/admin.controller.js';
import { flexibleAdminAuth } from '../middleware/adminMiddleware.js';

const router = Router();

// Apply flexible admin authentication to all routes (supports both JWT and API Key)
router.use(flexibleAdminAuth);

// Route validation
const createRouteValidation = [
  body('from')
    .trim()
    .notEmpty()
    .withMessage('From location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('From location must be between 2 and 100 characters'),
  
  body('to')
    .trim()
    .notEmpty()
    .withMessage('To location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('To location must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Vehicle validation
const createVehicleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vehicle name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Vehicle name must be between 2 and 100 characters'),
  
  body('type')
    .isIn(['van', 'bus', 'car'])
    .withMessage('Vehicle type must be van, bus, or car'),
  
  body('routeId')
    .isUUID()
    .withMessage('Valid route ID is required'),
  
  body('bookingType')
    .isIn(['common', 'individual', 'vip'])
    .withMessage('Booking type must be common, individual, or vip'),
  
  body('seatCount')
    .isInt({ min: 1, max: 100 })
    .withMessage('Seat count must be between 1 and 100'),
  
  body('pricePerSeat')
    .isFloat({ min: 0 })
    .withMessage('Price per seat must be a positive number'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

// Route Management
router.post('/routes', createRouteValidation, AdminController.createRoute);
router.put('/routes/:id', AdminController.updateRoute);
router.delete('/routes/:id', AdminController.deleteRoute);

// Vehicle Management
router.post('/vehicles', createVehicleValidation, AdminController.createVehicle);
router.get('/vehicles', AdminController.getAllVehicles);
router.put('/vehicles/:id', AdminController.updateVehicle);
router.delete('/vehicles/:id', AdminController.deleteVehicle);

// Booking Management (Full CRUD)
router.get('/bookings', AdminController.getAllBookings);
router.put('/bookings/:id', AdminController.updateBooking);
router.delete('/bookings/:id', AdminController.deleteBooking);

// Seat Management (Full CRUD)
router.put('/seats/:id', AdminController.updateSeat);
router.delete('/seats/:id', AdminController.deleteSeat);

// Payment Management
router.get('/payments', AdminController.getAllPayments);
router.put('/payments/:id', AdminController.updatePayment);
router.post('/payments/:id/refund', AdminController.refundPayment);

// Bulk Operations
router.post('/bookings/bulk-update', AdminController.bulkUpdateBookings);
router.post('/bookings/bulk-delete', AdminController.bulkDeleteBookings);

// Advanced Reporting
router.get('/reports/bookings-by-date', AdminController.getBookingsByDateRange);

// Admin Operations Audit Trail
router.get('/operations', AdminController.getAdminOperations);

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// System Maintenance
router.post('/maintenance/unlock-expired-seats', AdminController.unlockAllExpiredSeats);

export default router;