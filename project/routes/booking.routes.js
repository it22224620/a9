import { Router } from 'express';
import { body } from 'express-validator';
import { BookingController } from '../controllers/booking.controller.js';
import { flexibleAdminAuth } from '../middleware/adminMiddleware.js';

const router = Router();

// Validation middleware for booking creation
const createBookingValidation = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('phone')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Valid phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
  
  body('routeId')
    .isUUID()
    .withMessage('Valid route ID is required'),
  
  body('vehicleId')
    .isUUID()
    .withMessage('Valid vehicle ID is required'),
  
  body('seatIds')
    .isArray({ min: 1 })
    .withMessage('At least one seat must be selected'),
  
  body('seatIds.*')
    .isUUID()
    .withMessage('Valid seat IDs are required'),
  
  body('bookingType')
    .isIn(['common', 'individual', 'vip'])
    .withMessage('Valid booking type is required'),
  
  body('travelDate')
    .optional()
    .isISO8601()
    .withMessage('Valid travel date is required'),
  
  body('departureTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Valid departure time is required (HH:MM:SS format)'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// Public routes
router.post('/create', createBookingValidation, BookingController.createBooking);
router.get('/status/:id', BookingController.getBookingStatus);
router.get('/all', BookingController.getAllBookings);
router.put('/confirm/:bookingId', BookingController.confirmBooking);
router.put('/cancel/:bookingId', BookingController.cancelBooking);
router.get('/date-range', BookingController.getBookingsByDateRange);

// Admin routes (require authentication)
router.use('/admin', flexibleAdminAuth);
router.put('/admin/:bookingId', BookingController.adminUpdateBooking);
router.delete('/admin/:bookingId', BookingController.adminDeleteBooking);

export default router;