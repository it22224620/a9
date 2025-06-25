import { Router } from 'express';
import { body } from 'express-validator';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

// Validation middleware for payment intent creation
const createPaymentIntentValidation = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required')
];

// Routes
router.post('/create-intent', createPaymentIntentValidation, PaymentController.createPaymentIntent);
router.post('/webhook', PaymentController.handleWebhook);
router.get('/status/:paymentId', PaymentController.getPaymentStatus);
router.post('/retry/:paymentId', PaymentController.retryPayment);

// New route for manually fixing booking status
router.post('/fix-booking/:bookingReference', PaymentController.fixBookingStatus);

export default router;