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

// Test webhook endpoint for development
if (process.env.NODE_ENV === 'development') {
  router.post('/test-webhook', PaymentController.testWebhook);
}

export default router;