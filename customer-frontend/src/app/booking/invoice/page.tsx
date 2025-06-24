'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Printer, Calendar, MapPin, Users, CreditCard, Phone, Mail, Car } from 'lucide-react';
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

export default function InvoicePage() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get('booking');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingRef) {
      fetchBookingDetails();
    }
  }, [bookingRef]);

  const fetchBookingDetails = async () => {
    try {
      const response = await getBookingStatus(bookingRef!, 'reference');
      if (response.success) {
        setBooking(response.data.booking);
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

  const handlePrint = () => {
    window.print();
  };

  const downloadInvoice = () => {
    if (!booking) return;

    const invoiceContent = `
NATURE TRAVEL - BOOKING INVOICE
===============================

Invoice Date: ${new Date().toLocaleDateString()}
Booking Reference: ${booking.bookingReference}

CUSTOMER INFORMATION
-------------------
Name: ${booking.customerName}
Email: ${booking.email}
Phone: ${booking.phone}

JOURNEY DETAILS
--------------
Route: ${booking.route?.from} → ${booking.route?.to}
Travel Date: ${booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Not specified'}
Vehicle: ${booking.vehicle?.name} (${booking.vehicle?.type})
Number of Seats: ${booking.seatIds.length}

PAYMENT DETAILS
--------------
Seat Price: LKR ${(booking.totalAmount / booking.seatIds.length).toFixed(2)} per seat
Total Seats: ${booking.seatIds.length}
Total Amount: LKR ${booking.totalAmount.toFixed(2)}
Payment Status: ${booking.status}
Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}

TERMS & CONDITIONS
-----------------
• Please arrive at departure point 15 minutes early
• Valid ID required for travel
• Cancellation policy applies as per terms
• This is a computer-generated invoice

Thank you for choosing Nature Travel!
Contact: +94 77 123 4567 | info@naturetravel.lk
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${booking.bookingReference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600">The booking reference could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print bg-gray-50 border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Booking Invoice</h1>
          <div className="flex space-x-3">
            <button
              onClick={downloadInvoice}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nature Travel</h1>
            <p className="text-gray-600">Explore Sri Lanka's Beauty</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>123 Galle Road, Colombo 03, Sri Lanka</p>
              <p>Phone: +94 77 123 4567 | Email: info@naturetravel.lk</p>
            </div>
          </div>

          {/* Invoice Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">BOOKING INVOICE</h2>
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <div>
                <span className="font-medium">Invoice Date:</span> {new Date().toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Booking Ref:</span> {booking.bookingReference}
              </div>
            </div>
          </div>

          {/* Customer and Journey Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Customer Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary-600" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-16 text-sm text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{booking.customerName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{booking.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{booking.phone}</span>
                </div>
              </div>
            </div>

            {/* Journey Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Journey Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Route:</span>
                  <p className="font-medium text-gray-900">{booking.route?.from} → {booking.route?.to}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Travel Date:</span>
                  <p className="font-medium text-gray-900">
                    {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <p className="font-medium text-gray-900">{booking.vehicle?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">({booking.vehicle?.type})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                Payment Details
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Description</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Unit Price</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-900">Travel Seat Reservation</p>
                        <p className="text-sm text-gray-500">{booking.route?.from} to {booking.route?.to}</p>
                      </div>
                    </td>
                    <td className="text-center py-4 text-gray-900">{booking.seatIds.length}</td>
                    <td className="text-right py-4 text-gray-900">
                      LKR {(booking.totalAmount / booking.seatIds.length).toFixed(2)}
                    </td>
                    <td className="text-right py-4 text-gray-900">
                      LKR {booking.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={3} className="py-4 text-right font-semibold text-gray-900">
                      Total Amount:
                    </td>
                    <td className="py-4 text-right font-bold text-xl text-primary-600">
                      LKR {booking.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Booking Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">Payment Status</h3>
                <p className="text-green-700">Your booking has been confirmed and payment received successfully.</p>
              </div>
              <div className="text-right">
                <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                  {booking.status}
                </span>
                <p className="text-sm text-green-600 mt-1">
                  Booked on {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Travel Guidelines</h4>
                <ul className="space-y-1">
                  <li>• Please arrive at departure point 15 minutes early</li>
                  <li>• Valid government-issued ID required for travel</li>
                  <li>• Seat numbers will be assigned at departure</li>
                  <li>• No smoking or alcohol consumption during travel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                <ul className="space-y-1">
                  <li>• Cancellation allowed up to 24 hours before travel</li>
                  <li>• Refund processing takes 3-5 business days</li>
                  <li>• No-show bookings are non-refundable</li>
                  <li>• Weather-related cancellations are fully refundable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
            <p className="text-sm text-gray-500">
              Thank you for choosing Nature Travel! Have a wonderful journey.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}