import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { Seat } from '../models/Seat.js';
import crypto from 'crypto';
import { validationResult } from 'express-validator';

export class PaymentController {
  static async createPaymentIntent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { bookingId } = req.body;

      // Get booking details with validation
      const bookingResult = await Booking.findById(bookingId);
      if (!bookingResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = bookingResult.data;

      // Validate booking status
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Booking is not in pending status'
        });
      }

      // Check if payment already exists
      const existingPayments = await Payment.findByBookingId(bookingId);
      if (existingPayments.success && existingPayments.data.length > 0) {
        const successfulPayment = existingPayments.data.find(p => p.status === 'success');
        if (successfulPayment) {
          return res.status(400).json({
            success: false,
            message: 'Payment already completed for this booking'
          });
        }
      }

      // PayHere configuration
      const merchantId = process.env.PAYHERE_MERCHANT_ID || '1230783';
      const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'MzEyOTAyMzE4MTEzNzI4NzQ4NTQ2NzI4MzI4MjUyNzQyNzI2ODI4Mg==';
      const orderId = `ORDER_${booking.bookingReference}_${Date.now()}`;
      const amount = parseFloat(booking.totalAmount);
      const currency = 'LKR';
      
      // Format amount according to PayHere requirements (2 decimal places)
      const formattedAmount = amount.toFixed(2);
      
      // Generate hash according to official PayHere documentation
      const hash = PaymentController.generatePayHereHash(merchantId, orderId, formattedAmount, currency, merchantSecret);

      // Create payment record
      const paymentResult = await Payment.create({
        bookingId: booking.id,
        amount: amount,
        currency: currency,
        gateway: 'payhere',
        paymentIntentId: orderId,
        gatewayResponse: {
          merchantId,
          orderId,
          hash,
          createdAt: new Date().toISOString()
        }
      });

      if (!paymentResult.success) {
        console.error('Failed to create payment record:', paymentResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment intent'
        });
      }

      // Complete PayHere payment configuration according to official documentation
      const paymentConfig = {
        // PayHere endpoint
        action: process.env.PAYHERE_SANDBOX === 'true' 
          ? 'https://sandbox.payhere.lk/pay/checkout'
          : 'https://www.payhere.lk/pay/checkout',
        
        // Required parameters
        merchant_id: merchantId,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/booking/success?booking=${booking.bookingReference}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/booking?step=5&error=cancelled`,
        notify_url: `${req.protocol}://${req.get('host')}/api/payment/webhook`,
        
        // Order details
        order_id: orderId,
        items: `Travel Booking - ${booking.bookingReference}`,
        amount: formattedAmount,
        currency: currency,
        
        // Customer details
        first_name: booking.customerName.split(' ')[0] || 'Customer',
        last_name: booking.customerName.split(' ').slice(1).join(' ') || '',
        email: booking.email,
        phone: booking.phone,
        address: 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka',
        
        // Optional delivery details
        delivery_address: 'N/A',
        delivery_city: 'Colombo',
        delivery_country: 'Sri Lanka',
        
        // Custom parameters
        custom_1: booking.bookingReference,
        custom_2: booking.id,
        
        // Generated hash
        hash: hash,
        
        // Platform identifier
        platform: 'web'
      };

      console.log(`💳 Payment intent created for booking: ${booking.bookingReference}`);
      console.log(`🔐 PayHere Hash: ${hash}`);
      console.log(`💰 Amount: ${formattedAmount} ${currency}`);
      console.log(`🏪 Merchant ID: ${merchantId}`);

      res.json({
        success: true,
        message: 'Payment intent created successfully',
        data: {
          paymentId: paymentResult.data.id,
          paymentConfig,
          booking: {
            id: booking.id,
            reference: booking.bookingReference,
            amount: booking.totalAmount,
            customerName: booking.customerName,
            email: booking.email,
            travelDate: booking.travelDate // Include travel date
          }
        }
      });

    } catch (error) {
      console.error('💥 Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Payment processing failed'
      });
    }
  }

  static async handleWebhook(req, res) {
    try {
      console.log('💳 PayHere webhook received:', {
        timestamp: new Date().toISOString(),
        body: req.body,
        headers: req.headers
      });

      const {
        merchant_id,
        order_id,
        payment_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        custom_1,
        custom_2,
        method,
        status_message
      } = req.body;

      // Validate required webhook fields
      if (!merchant_id || !order_id || !status_code) {
        console.error('❌ Missing required webhook fields');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook payload'
        });
      }

      // Find payment record
      let payment = null;
      
      const paymentByIntentResult = await Payment.findByPaymentIntentId(order_id);
      if (paymentByIntentResult.success) {
        payment = paymentByIntentResult.data;
      } else {
        const paymentByTransactionResult = await Payment.findByTransactionId(order_id);
        if (paymentByTransactionResult.success) {
          payment = paymentByTransactionResult.data;
        }
      }

      if (!payment) {
        console.error('❌ Payment record not found for order:', order_id);
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      // Prevent duplicate processing
      if (payment.status === 'success') {
        console.log('✅ Payment already processed successfully:', order_id);
        return res.status(200).json({
          success: true,
          message: 'Payment already processed'
        });
      }

      // Verify webhook signature according to official documentation
      const isValidSignature = PaymentController.verifyPayHereSignature({
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
      });

      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Validate payment amount if provided
      if (payhere_amount) {
        const expectedAmount = parseFloat(payment.amount).toFixed(2);
        const receivedAmount = parseFloat(payhere_amount).toFixed(2);
        
        if (expectedAmount !== receivedAmount) {
          console.error('❌ Payment amount mismatch:', {
            expected: expectedAmount,
            received: receivedAmount,
            orderId: order_id
          });
          
          await Payment.updateStatus(
            payment.id,
            'failed',
            payment_id,
            { ...req.body, error: 'Amount mismatch', timestamp: new Date().toISOString() }
          );
          
          return res.status(400).json({
            success: false,
            message: 'Payment amount mismatch'
          });
        }
      }

      // Determine payment status based on PayHere status code
      let paymentStatus;
      let shouldConfirmBooking = false;
      
      switch (status_code) {
        case '2': // Success
          paymentStatus = 'success';
          shouldConfirmBooking = true;
          break;
        case '0': // Pending
          paymentStatus = 'pending';
          break;
        case '-1': // Cancelled
        case '-2': // Failed
        case '-3': // Chargedback
          paymentStatus = 'failed';
          break;
        default:
          paymentStatus = 'failed';
          console.warn('⚠️ Unknown PayHere status code:', status_code);
      }

      // Update payment record
      const updateResult = await Payment.updateStatus(
        payment.id,
        paymentStatus,
        payment_id,
        {
          ...req.body,
          processedAt: new Date().toISOString(),
          webhookReceived: true,
          statusDescription: PaymentController.getStatusDescription(status_code)
        }
      );

      if (!updateResult.success) {
        console.error('❌ Failed to update payment status');
        return res.status(500).json({
          success: false,
          message: 'Failed to update payment status'
        });
      }

      // Handle booking confirmation or cancellation
      if (shouldConfirmBooking) {
        try {
          const bookingResult = await Booking.updateStatus(payment.bookingId, 'confirmed');
          if (bookingResult.success) {
            const booking = bookingResult.data;
            
            // FIXED: Properly book seats with travel date
            const seatsResult = await Seat.confirmSeats(booking.seatIds, booking.travelDate);
            if (seatsResult.success) {
              console.log(`✅ Payment successful, booking confirmed, seats booked for ${booking.travelDate}: ${payment.bookingId}`);
            } else {
              console.error('❌ Failed to confirm seats after successful payment');
              await Booking.updateStatus(payment.bookingId, 'pending');
            }
          } else {
            console.error('❌ Failed to confirm booking after successful payment');
          }
        } catch (bookingError) {
          console.error('❌ Error confirming booking:', bookingError);
        }
      } else if (paymentStatus === 'failed') {
        try {
          const bookingResult = await Booking.findById(payment.bookingId);
          if (bookingResult.success) {
            const booking = bookingResult.data;
            await Booking.updateStatus(payment.bookingId, 'cancelled');
            await Seat.unlockSeats(booking.seatIds);
            console.log(`❌ Payment failed, booking cancelled, seats unlocked: ${payment.bookingId}`);
          }
        } catch (bookingError) {
          console.error('❌ Error cancelling booking:', bookingError);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        orderId: order_id,
        status: paymentStatus,
        description: PaymentController.getStatusDescription(status_code)
      });

    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      
      res.status(200).json({
        success: false,
        message: 'Webhook processing failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }
  }

  static async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const paymentResult = await Payment.findById(paymentId);
      if (!paymentResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const bookingResult = await Booking.findById(paymentResult.data.bookingId);
      
      res.json({
        success: true,
        data: {
          payment: paymentResult.data,
          booking: bookingResult.success ? bookingResult.data : null
        }
      });

    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PayHere hash generation according to official documentation
  static generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret) {
    try {
      // Step 1: Hash the merchant secret
      const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
      
      // Step 2: Create the hash string according to PayHere documentation
      // hash = MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
      const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
      
      // Step 3: Generate final hash
      const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
      
      console.log('🔐 PayHere hash generation:', {
        merchantId,
        orderId,
        amount,
        currency,
        hashedSecret: hashedSecret.substring(0, 8) + '...',
        hashString: hashString.replace(hashedSecret, '[HASHED_SECRET]'),
        finalHash: hash
      });
      
      return hash;
    } catch (error) {
      console.error('❌ Hash generation error:', error);
      // Return a fallback hash for development
      return crypto.createHash('md5').update(`${merchantId}${orderId}${amount}${currency}fallback`).digest('hex').toUpperCase();
    }
  }

  // PayHere webhook signature verification according to official documentation
  static verifyPayHereSignature(data) {
    try {
      const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
      } = data;

      const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'MzEyOTAyMzE4MTEzNzI4NzQ4NTQ2NzI4MzI4MjUyNzQyNzI2ODI4Mg==';
      
      // Generate local signature according to PayHere documentation
      // md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret))
      const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
      const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
      const localMd5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

      const isValid = localMd5sig === md5sig;
      
      if (!isValid) {
        console.error('❌ Signature verification failed:', {
          expected: localMd5sig,
          received: md5sig,
          orderId: order_id
        });
      } else {
        console.log('✅ Signature verification successful');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return false;
    }
  }

  // Get human-readable status description
  static getStatusDescription(statusCode) {
    const statusMap = {
      '2': 'Payment Successful',
      '0': 'Payment Pending',
      '-1': 'Payment Cancelled by User',
      '-2': 'Payment Failed',
      '-3': 'Payment Chargedback'
    };
    
    return statusMap[statusCode] || `Unknown Status Code: ${statusCode}`;
  }

  static async retryPayment(req, res) {
    try {
      const { paymentId } = req.params;
      
      const paymentResult = await Payment.findById(paymentId);
      if (!paymentResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = paymentResult.data;
      
      if (payment.status === 'success') {
        return res.status(400).json({
          success: false,
          message: 'Payment already successful'
        });
      }

      await Payment.updateStatus(payment.id, 'pending', null, {
        retryAttempt: true,
        retryAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Payment retry initiated',
        data: { paymentId: payment.id }
      });

    } catch (error) {
      console.error('Retry payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry payment'
      });
    }
  }
}