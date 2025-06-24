'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Route {
  id: string;
  from: string;
  to: string;
  description: string;
  isActive: boolean;
}

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

interface CustomerInfo {
  customerName: string;
  email: string;
  phone: string;
  message?: string;
}

interface BookingContextType {
  // Current step
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Selected data
  selectedRoute: Route | null;
  selectedVehicle: Vehicle | null;
  selectedSeats: string[] | null;
  customerInfo: CustomerInfo | null;

  // Setters
  setSelectedRoute: (route: Route) => void;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  setSelectedSeats: (seats: string[]) => void;
  setCustomerInfo: (info: CustomerInfo) => void;

  // Utilities
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[] | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 5)));
  };

  const resetBooking = () => {
    setCurrentStep(1);
    setSelectedRoute(null);
    setSelectedVehicle(null);
    setSelectedSeats(null);
    setCustomerInfo(null);
  };

  const value: BookingContextType = {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    selectedRoute,
    selectedVehicle,
    selectedSeats,
    customerInfo,
    setSelectedRoute,
    setSelectedVehicle,
    setSelectedSeats,
    setCustomerInfo,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}