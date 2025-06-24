'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Users, Star, Wifi, Coffee, Music, ArrowLeft, Crown, Shield } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import { getVehiclesByRoute } from '../../lib/api';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  bookingType: string;
  seatCount: number;
  pricePerSeat: number;
  imageUrl?: string;
  seatAvailability: {
    available: number;
    pending: number;
    booked: number;
    total: number;
  };
}

export default function VehicleSelection() {
  const { selectedRoute, setSelectedVehicle, nextStep, prevStep } = useBooking();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    if (selectedRoute) {
      fetchVehicles();
    }
  }, [selectedRoute]);

  const fetchVehicles = async () => {
    if (!selectedRoute) return;

    try {
      const response = await getVehiclesByRoute(selectedRoute.id);
      if (response.success) {
        setVehicles(response.data.vehicles);
      } else {
        toast.error('Failed to load vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setSelectedVehicle(vehicle);
  };

  const handleContinue = () => {
    if (!selectedVehicleId) {
      toast.error('Please select a vehicle to continue');
      return;
    }
    nextStep();
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bus':
        return '🚌';
      case 'van':
        return '🚐';
      case 'car':
        return '🚗';
      default:
        return '🚗';
    }
  };

  const getBookingTypeIcon = (bookingType: string) => {
    switch (bookingType.toLowerCase()) {
      case 'vip':
        return Crown;
      case 'individual':
        return Shield;
      default:
        return Users;
    }
  };

  const getBookingTypeColor = (bookingType: string) => {
    switch (bookingType.toLowerCase()) {
      case 'vip':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'individual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getVehicleFeatures = (bookingType: string) => {
    switch (bookingType.toLowerCase()) {
      case 'vip':
        return [
          { icon: Wifi, label: 'Free WiFi' },
          { icon: Coffee, label: 'Refreshments' },
          { icon: Music, label: 'Entertainment' },
          { icon: Users, label: 'Premium Service' },
        ];
      case 'individual':
        return [
          { icon: Wifi, label: 'WiFi Available' },
          { icon: Music, label: 'Music System' },
          { icon: Users, label: 'Personal Space' },
        ];
      default:
        return [
          { icon: Music, label: 'Basic Audio' },
          { icon: Users, label: 'Shared Service' },
        ];
    }
  };

  const getBookingTypeDescription = (bookingType: string) => {
    switch (bookingType.toLowerCase()) {
      case 'vip':
        return 'Premium experience with luxury amenities and personalized service';
      case 'individual':
        return 'Enhanced comfort with additional space and better amenities';
      default:
        return 'Standard comfortable travel with basic amenities';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available vehicles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Routes</span>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Vehicle</h2>
          <p className="text-gray-600">
            Choose from our fleet of comfortable vehicles for your journey to{' '}
            <span className="font-semibold text-primary-600">{selectedRoute?.to}</span>
          </p>
        </div>
        <div></div>
      </div>

      {/* Booking Type Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Booking Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Common</span>
            </div>
            <p className="text-sm text-gray-600">Standard comfortable travel with basic amenities</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Individual</span>
            </div>
            <p className="text-sm text-gray-600">Enhanced comfort with additional space and better amenities</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">VIP</span>
            </div>
            <p className="text-sm text-gray-600">Premium experience with luxury amenities and personalized service</p>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {vehicles.map((vehicle, index) => {
          const BookingIcon = getBookingTypeIcon(vehicle.bookingType);
          
          return (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleVehicleSelect(vehicle)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedVehicleId === vehicle.id
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              {/* Vehicle Image */}
              <div className="relative mb-6 rounded-xl overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 h-48">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {getVehicleIcon(vehicle.type)}
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBookingTypeColor(vehicle.bookingType)}`}>
                    <BookingIcon className="w-3 h-3 inline mr-1" />
                    {vehicle.bookingType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">{vehicle.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-600">4.8</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Car className="w-4 h-4" />
                    <span className="capitalize">{vehicle.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{vehicle.seatCount} seats</span>
                  </div>
                </div>

                {/* Booking Type Description */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {getBookingTypeDescription(vehicle.bookingType)}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {getVehicleFeatures(vehicle.bookingType).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-gray-500">
                      <feature.icon className="w-3 h-3" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                {/* Availability */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Seat Availability</span>
                    <span className="text-sm text-gray-600">
                      {vehicle.seatAvailability.available} of {vehicle.seatAvailability.total} available
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(vehicle.seatAvailability.available / vehicle.seatAvailability.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">
                      LKR {vehicle.pricePerSeat.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">per seat</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedVehicleId === vehicle.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedVehicleId === vehicle.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles available</h3>
          <p className="text-gray-600">
            No vehicles are currently available for this route. Please try a different route or contact support.
          </p>
        </div>
      )}

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
          disabled={!selectedVehicleId}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedVehicleId
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Customer Details
        </button>
      </div>
    </div>
  );
}