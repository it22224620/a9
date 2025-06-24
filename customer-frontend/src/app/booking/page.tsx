'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BookingProgress from '../../components/booking/BookingProgress';
import RouteSelection from '../../components/booking/RouteSelection';
import VehicleSelection from '../../components/booking/VehicleSelection';
import CustomerForm from '../../components/booking/CustomerForm';
import SeatSelection from '../../components/booking/SeatSelection';
import PaymentForm from '../../components/booking/PaymentForm';
import { useBooking } from '../../contexts/BookingContext';

const steps = [
  { id: 1, name: 'Route', description: 'Choose your destination' },
  { id: 2, name: 'Vehicle', description: 'Select your ride' },
  { id: 3, name: 'Details', description: 'Your information' },
  { id: 4, name: 'Seats', description: 'Pick your seats' },
  { id: 5, name: 'Payment', description: 'Complete booking' },
];

export default function BookingPage() {
  const { currentStep } = useBooking();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RouteSelection />;
      case 2:
        return <VehicleSelection />;
      case 3:
        return <CustomerForm />;
      case 4:
        return <SeatSelection />;
      case 5:
        return <PaymentForm />;
      default:
        return <RouteSelection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-16 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Book Your Journey
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Experience the beauty of Sri Lanka with our comfortable and reliable travel services
            </p>
          </motion.div>
        </div>
      </div>

      {/* Booking Progress */}
      <div className="container-custom py-8">
        <BookingProgress steps={steps} currentStep={currentStep} />
      </div>

      {/* Booking Content */}
      <div className="container-custom pb-16">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {renderStep()}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}