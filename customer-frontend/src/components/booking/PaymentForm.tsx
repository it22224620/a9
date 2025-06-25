'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import { createBooking, createPaymentIntent } from '../../lib/api';
import toast from 'react-hot-toast';

export default function PaymentForm() {
  const {
    selectedRoute,
    selectedVehicle,
    selectedSeats,
    customerInfo,
    prevStep,
    resetBooking
  } = useBooking();

  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  const totalPrice = (selectedSeats?.length || 0) * (selectedVehicle?.pricePerSeat || 0);

  const handlePayment = async () => {
    if (!selectedRoute || !selectedVehicle || !selectedSeats || !customerInfo) {
      toast.error('Missing booking information');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create booking
      console.log('Creating booking with data:', {
        customerName: customerInfo.customerName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        message: customerInfo.message || '',
        routeId: selectedRoute.id,
        vehicleId: selectedVehicle.id,
        seatIds: selectedSeats,
        bookingType: selectedVehicle.bookingType,
        travelDate: customerInfo.travelDate
      });

      const bookingResponse = await createBooking({
        customerName: customerInfo.customerName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        message: customerInfo.message || '',
        routeId: selectedRoute.id,
        vehicleId: selectedVehicle.id,
        seatIds: selectedSeats,
        bookingType: selectedVehicle.bookingType,
        travelDate: customerInfo.travelDate
      });

      if (!bookingResponse.success) {
        console.error('Booking creation failed:', bookingResponse);
        toast.error(bookingResponse.message || 'Failed to create booking');
        return;
      }

      const booking = bookingResponse.data.booking;
      setBookingId(booking.id);

      // Step 2: Create payment intent
      const paymentResponse = await createPaymentIntent({
        bookingId: booking.id
      });

      if (!paymentResponse.success) {
        toast.error('Failed to initialize payment');
        return;
      }

      const config = paymentResponse.data.paymentConfig;
      setPaymentConfig(config);

      // Step 3: Submit to PayHere using official form submission method
      console.log('Submitting to PayHere with config:', {
        ...config,
        hash: config.hash ? config.hash.substring(0, 8) + '...' : 'missing'
      });

      // Create and submit PayHere form according to official documentation
      submitToPayHere(config);

    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid booking data';
        toast.error(errorMessage);
        console.error('Booking validation error:', error.response?.data);
      } else {
        toast.error('Failed to process payment');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit to PayHere using official HTML form method
  const submitToPayHere = (config: any) => {
    try {
      // Create a form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = config.action || 'https://sandbox.payhere.lk/pay/checkout';
      form.style.display = 'none';

      // Add all required fields according to PayHere documentation
      const fields = {
        merchant_id: config.merchant_id,
        return_url: config.return_url,
        cancel_url: config.cancel_url,
        notify_url: config.notify_url,
        order_id: config.order_id,
        items: config.items,
        currency: config.currency,
        amount: config.amount,
        first_name: config.first_name,
        last_name: config.last_name,
        email: config.email,
        phone: config.phone,
        address: config.address,
        city: config.city,
        country: config.country,
        delivery_address: config.delivery_address,
        delivery_city: config.delivery_city,
        delivery_country: config.delivery_country,
        custom_1: config.custom_1,
        custom_2: config.custom_2,
        hash: config.hash
      };

      // Create hidden input fields for each parameter
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      // Add form to document and submit
      document.body.appendChild(form);
      
      console.log('Submitting PayHere form with fields:', Object.keys(fields));
      form.submit();

      // Clean up
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }, 1000);

    } catch (error) {
      console.error('Error submitting to PayHere:', error);
      toast.error('Failed to redirect to payment gateway');
    }
  };

  // Test payment function for development
  const handleTestPayment = async () => {
    if (!bookingId) {
      toast.error('Please create booking first');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/test-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentConfig?.order_id,
          statusCode: '2' // Success
        })
      });

      if (response.ok) {
        toast.success('Test payment successful! Redirecting...');
        setTimeout(() => {
          window.location.href = `/booking/success?booking=${paymentConfig?.custom_1}`;
        }, 2000);
      } else {
        toast.error('Test payment failed');
      }
    } catch (error) {
      console.error('Test payment error:', error);
      toast.error('Test payment failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Seats</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
          <p className="text-gray-600">
            Complete your booking with our secure payment system
          </p>
        </div>
        <div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payment Section */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            {/* Payment Method */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="border-2 border-primary-200 bg-primary-50 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">PayHere Secure Payment</h4>
                    <p className="text-sm text-gray-600">
                      Pay securely with credit card, debit card, or mobile wallet
                    </p>
                  </div>
                  <div className="ml-auto">
                    <CheckCircle className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Card Information */}
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h4 className="font-semibold text-yellow-800 mb-3">Test Payment Information</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>Test Card Number:</strong> 4916217501611292</p>
                <p><strong>Expiry Date:</strong> 12/25</p>
                <p><strong>CVV:</strong> 123</p>
                <p><strong>Cardholder Name:</strong> Test Customer</p>
                <p className="text-xs mt-2 text-yellow-600">
                  This is a sandbox environment. Use these test credentials for payment testing.
                </p>
              </div>
            </div>

            {/* Security Features */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Security & Trust</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">SSL Encrypted</div>
                    <div className="text-sm text-gray-600">256-bit security</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Instant Booking</div>
                    <div className="text-sm text-gray-600">Immediate confirmation</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Guaranteed</div>
                    <div className="text-sm text-gray-600">Secure transaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-4">
              {/* Main Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="w-6 h-6" />
                    <span>Pay LKR {totalPrice.toFixed(2)} Securely</span>
                  </div>
                )}
              </button>

              {/* Test Payment Button (Development Only) */}
              {process.env.NODE_ENV === 'development' && bookingId && paymentConfig && (
                <button
                  onClick={handleTestPayment}
                  className="w-full py-3 border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors"
                >
                  🧪 Test Payment Success (Dev Only)
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              By proceeding, you agree to our Terms of Service and Privacy Policy.
              Your payment is processed securely by PayHere.
            </p>
          </motion.div>
        </div>

        {/* Final Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Final Summary</h3>
            
            {/* Journey Details */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium">{selectedRoute?.from} → {selectedRoute?.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{selectedVehicle?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedVehicle?.bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-medium">{selectedSeats?.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Date:</span>
                <span className="font-medium">{customerInfo?.travelDate}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Passenger Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{customerInfo?.customerName}</p>
                <p>{customerInfo?.email}</p>
                <p>{customerInfo?.phone}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats ({selectedSeats?.length}):</span>
                  <span>LKR {((selectedSeats?.length || 0) * (selectedVehicle?.pricePerSeat || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span>LKR 0.00</span>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    LKR {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
            <ol className="text-sm text-green-800 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <span>Redirect to PayHere payment gateway</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <span>Enter your payment details securely</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <span>Instant booking confirmation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <span>Email with travel details</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={resetBooking}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Start New Booking
        </button>
      </div>
    </div>
  );
}