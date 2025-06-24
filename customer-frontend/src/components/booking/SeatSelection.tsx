'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import { getSeatLayout, lockSeats } from '../../lib/api';
import toast from 'react-hot-toast';

interface Seat {
  id: string;
  seatNumber: number;
  status: 'available' | 'pending' | 'booked';
  customerEmail?: string;
}

export default function SeatSelection() {
  const { selectedVehicle, setSelectedSeats, nextStep, prevStep, customerInfo } = useBooking();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (selectedVehicle) {
      fetchSeats();
    }
  }, [selectedVehicle]);

  const fetchSeats = async () => {
    if (!selectedVehicle) return;

    try {
      const response = await getSeatLayout(selectedVehicle.id);
      if (response.success) {
        setSeats(response.data);
      } else {
        toast.error('Failed to load seat layout');
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      toast.error('Failed to load seat layout');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;

    setSelectedSeatIds(prev => {
      if (prev.includes(seat.id)) {
        return prev.filter(id => id !== seat.id);
      } else {
        return [...prev, seat.id];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedSeatIds.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    // Check if we have customer email from previous step
    if (!customerInfo?.email) {
      toast.error('Customer email is required. Please go back and fill in your details.');
      return;
    }

    setLocking(true);
    try {
      const response = await lockSeats(selectedSeatIds, customerInfo.email);
      if (response.success) {
        setSelectedSeats(selectedSeatIds);
        toast.success(`${selectedSeatIds.length} seat(s) reserved for 10 minutes`);
        nextStep();
      } else {
        toast.error('Failed to reserve seats. Please try again.');
      }
    } catch (error) {
      console.error('Error locking seats:', error);
      toast.error('Failed to reserve seats. Please try again.');
    } finally {
      setLocking(false);
    }
  };

  const getSeatClass = (seat: Seat) => {
    if (selectedSeatIds.includes(seat.id)) {
      return 'seat seat-selected';
    }
    switch (seat.status) {
      case 'available':
        return 'seat seat-available';
      case 'pending':
        return 'seat seat-pending';
      case 'booked':
        return 'seat seat-booked';
      default:
        return 'seat seat-available';
    }
  };

  const renderSeatLayout = () => {
    const seatsPerRow = selectedVehicle?.type === 'bus' ? 4 : selectedVehicle?.type === 'van' ? 3 : 2;
    const rows = Math.ceil(seats.length / seatsPerRow);
    
    return (
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-2">
            {seats
              .slice(rowIndex * seatsPerRow, (rowIndex + 1) * seatsPerRow)
              .map((seat, seatIndex) => (
                <motion.button
                  key={seat.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: (rowIndex * seatsPerRow + seatIndex) * 0.05 }}
                  onClick={() => handleSeatClick(seat)}
                  className={getSeatClass(seat)}
                  disabled={seat.status !== 'available'}
                  title={`Seat ${seat.seatNumber} - ${seat.status}`}
                >
                  {selectedSeatIds.includes(seat.id) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    seat.seatNumber
                  )}
                </motion.button>
              ))}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading seat layout...</p>
      </div>
    );
  }

  const totalPrice = selectedSeatIds.length * (selectedVehicle?.pricePerSeat || 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Details</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Seats</h2>
          <p className="text-gray-600">
            Choose your preferred seats in the{' '}
            <span className="font-semibold text-primary-600">{selectedVehicle?.name}</span>
          </p>
        </div>
        <div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Seat Layout */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Driver</span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded-full mb-6"></div>
            </div>

            {renderSeatLayout()}

            {/* Legend */}
            <div className="flex justify-center space-x-6 mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="seat seat-available"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="seat seat-selected"></div>
                <span className="text-sm text-gray-600">Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="seat seat-pending"></div>
                <span className="text-sm text-gray-600">Reserved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="seat seat-booked"></div>
                <span className="text-sm text-gray-600">Booked</span>
              </div>
            </div>
          </div>
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
                <span className="text-gray-600">Booking Type:</span>
                <span className="font-medium capitalize">{selectedVehicle?.bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Seats:</span>
                <span className="font-medium">{selectedSeatIds.length}</span>
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

          {selectedSeatIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-2xl p-6"
            >
              <h4 className="font-semibold text-blue-900 mb-2">Selected Seats</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSeatIds.map(seatId => {
                  const seat = seats.find(s => s.id === seatId);
                  return (
                    <span
                      key={seatId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      Seat {seat?.seatNumber}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Seats will be reserved for 10 minutes after confirmation
              </p>
            </motion.div>
          )}

          {/* Customer Info Display */}
          {customerInfo && (
            <div className="bg-green-50 rounded-2xl p-6">
              <h4 className="font-semibold text-green-900 mb-2">Customer Details</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Name:</strong> {customerInfo.customerName}</p>
                <p><strong>Email:</strong> {customerInfo.email}</p>
                <p><strong>Phone:</strong> {customerInfo.phone}</p>
              </div>
            </div>
          )}
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
          onClick={handleContinue}
          disabled={selectedSeatIds.length === 0 || locking || !customerInfo?.email}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedSeatIds.length > 0 && !locking && customerInfo?.email
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {locking ? (
            <div className="flex items-center space-x-2">
              <div className="spinner"></div>
              <span>Reserving Seats...</span>
            </div>
          ) : (
            'Continue to Payment'
          )}
        </button>
      </div>
    </div>
  );
}