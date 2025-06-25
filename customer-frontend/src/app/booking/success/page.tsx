'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Calendar, MapPin, Users, CreditCard, FileText, Printer } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { getBookingStatus } from '../../../lib/api';
import toast from 'react-hot-toast';

interface BookingDetails {
  id: string;
  bookingReference: string;
  customerName: string;
  email: string;
  phone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  travelDate: string;
  route?: {
    from: string;
    to: string;
  };
  vehicle?: {
    name: string;
    type: string;
  };
  seatIds: string[];
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get('booking');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (bookingRef) {
      fetchBookingDetails();
    }
  }, [bookingRef, retryCount]);

  const fetchBookingDetails = async () => {
    try {
      const response = await getBookingStatus(bookingRef!, 'reference');
      if (response.success) {
        setBooking(response.data.booking);
        
        // If booking is still pending and we haven't retried too many times, retry after a delay
        if (response.data.booking.status === 'pending' && retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // Retry after 3 seconds
        }
      } else {
        toast.error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    if (!booking) return;

    const ticketContent = `
NATURE TRAVEL BOOKING CONFIRMATION
================================

Booking Reference: ${booking.bookingReference}
Customer: ${booking.customerName}
Email: ${booking.email}
Phone: ${booking.phone}

Journey Details:
From: ${booking.route?.from}
To: ${booking.route?.to}
Travel Date: ${booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Not specified'}
Vehicle: ${booking.vehicle?.name} (${booking.vehicle?.type})
Seats: ${booking.seatIds.length}
Amount: LKR ${booking.totalAmount?.toFixed(2)}

Status: ${booking.status}
Booked on: ${new Date(booking.createdAt || '').toLocaleDateString()}

Thank you for choosing Nature Travel!
    `;

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${booking.bookingReference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="container-custom py-16">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <Navbar />
        <div className="container-custom py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">The booking reference could not be found.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Booking {booking.status === 'confirmed' ? 'Confirmed!' : 'Received!'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {booking.status === 'confirmed' 
                ? "Your journey has been successfully booked. We've sent a confirmation email with all the details."
                : "Your booking is being processed. We'll confirm it shortly. Please check your email for updates."}
            </p>
            
            {booking.status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg inline-block">
                <p className="text-yellow-700">
                  <strong>Note:</strong> Your payment is being processed. This page will automatically refresh to show the latest status.
                </p>
              </div>
            )}
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className={`px-8 py-6 ${
              booking.status === 'confirmed' 
                ? 'bg-gradient-to-r from-green-600 to-blue-600' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}>
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">Booking Confirmation</h2>
                  <p className="opacity-90">Reference: {booking.bookingReference}</p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href={`/booking/invoice?booking=${booking.bookingReference}`}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Invoice</span>
                  </Link>
                  <button
                    onClick={downloadTicket}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Journey Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Journey Details</h3>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Route</p>
                      <p className="text-gray-600">{booking.route?.from} → {booking.route?.to}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Travel Date</p>
                      <p className="text-gray-600">
                        {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Booking Date</p>
                      <p className="text-gray-600">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Seats</p>
                      <p className="text-gray-600">{booking.seatIds.length} seat(s) reserved</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">LKR {booking.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer & Vehicle Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Information</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                    <p className="text-gray-600">{booking.customerName}</p>
                    <p className="text-gray-600">{booking.email}</p>
                    <p className="text-gray-600">{booking.phone}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
                    <p className="text-gray-600">{booking.vehicle?.name}</p>
                    <p className="text-gray-600 capitalize">{booking.vehicle?.type}</p>
                  </div>

                  <div className={`rounded-lg p-4 ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-50' 
                      : booking.status === 'pending' 
                        ? 'bg-yellow-50'
                        : 'bg-red-50'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      booking.status === 'confirmed' 
                        ? 'text-green-800' 
                        : booking.status === 'pending' 
                          ? 'text-yellow-800'
                          : 'text-red-800'
                    }`}>Status</h4>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href={`/booking/invoice?booking=${booking.bookingReference}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Printer className="w-5 h-5 mr-2" />
              Print Invoice
            </Link>
            <button
              onClick={downloadTicket}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Ticket
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-300"
            >
              Back to Home
            </Link>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 bg-blue-50 rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Check Your Email</h4>
                <p className="text-sm text-gray-600">We've sent a confirmation email with your ticket details.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Arrive Early</h4>
                <p className="text-sm text-gray-600">Please arrive at the departure point 15 minutes early.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Enjoy Your Journey</h4>
                <p className="text-sm text-gray-600">Sit back, relax, and enjoy the beautiful scenery!</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}