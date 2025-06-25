'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeft, User, Mail, Phone, MessageSquare, Calendar } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import toast from 'react-hot-toast';

interface CustomerFormData {
  customerName: string;
  email: string;
  phone: string;
  message?: string;
  travelDate: string;
}

export default function CustomerForm() {
  const { setCustomerInfo, nextStep, prevStep, selectedVehicle, selectedSeats } = useBooking();
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>();

  const onSubmit = (data: CustomerFormData) => {
    setCustomerInfo(data);
    toast.success('Information saved successfully');
    nextStep();
  };

  const totalPrice = (selectedSeats?.length || 0) * (selectedVehicle?.pricePerSeat || 0);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Vehicles</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Information</h2>
          <p className="text-gray-600">
            Please provide your details to complete the booking
          </p>
        </div>
        <div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Customer Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="customer-form">
              {/* Travel Date */}
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Travel Date *</span>
                </label>
                <input
                  type="date"
                  min={today}
                  {...register('travelDate', {
                    required: 'Travel date is required'
                  })}
                  className="form-input"
                />
                {errors.travelDate && (
                  <p className="form-error">{errors.travelDate.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select the date you want to travel
                </p>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  {...register('customerName', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className="form-input"
                  placeholder="Enter your full name"
                />
                {errors.customerName && (
                  <p className="form-error">{errors.customerName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className="form-input"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  We'll send your booking confirmation to this email
                </p>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Please enter a valid phone number'
                    },
                    minLength: { value: 10, message: 'Phone number must be at least 10 digits' }
                  })}
                  className="form-input"
                  placeholder="+94 77 123 4567"
                />
                {errors.phone && (
                  <p className="form-error">{errors.phone.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>Special Requests (Optional)</span>
                </label>
                <textarea
                  {...register('message')}
                  rows={4}
                  className="form-input resize-none"
                  placeholder="Any special requests or preferences for your journey..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Let us know if you have any special requirements
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Important Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Please arrive at the departure point 15 minutes early</li>
                  <li>• Seats are reserved for 10 minutes after booking</li>
                  <li>• Cancellation policy applies as per terms and conditions</li>
                  <li>• Valid ID required for travel</li>
                  <li>• Travel date cannot be changed after booking confirmation</li>
                </ul>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Booking Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{selectedVehicle?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedVehicle?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-medium">{selectedSeats?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Seat:</span>
                <span className="font-medium">LKR {selectedVehicle?.pricePerSeat.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  LKR {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <span>Select your seats</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <span>Complete payment securely</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <span>Receive booking confirmation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <span>Enjoy your journey!</span>
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
          type="submit"
          form="customer-form"
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Continue to Seat Selection
        </button>
      </div>
    </div>
  );
}