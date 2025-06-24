'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { bookingsAPI } from '../../../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingReference: string;
  customerName: string;
  email: string;
  phone: string;
  message: string;
  totalAmount: number;
  status: string;
  createdAt: string;
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await bookingsAPI.getAll(params);
      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to confirm booking ${booking.bookingReference}?`)) {
      return;
    }

    try {
      await bookingsAPI.confirm(booking.id);
      toast.success('Booking confirmed successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to cancel booking ${booking.bookingReference}?`)) {
      return;
    }

    try {
      await bookingsAPI.cancel(booking.id);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600">Manage customer bookings and reservations</p>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>All Bookings</span>
              <span className="text-sm font-normal text-gray-500">
                ({filteredBookings.length} bookings)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No bookings found</p>
                <p className="text-sm">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} bookings at the moment`
                    : 'Bookings will appear here once customers make reservations'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.bookingReference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-gray-500">{booking.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.route ? (
                          `${booking.route.from} → ${booking.route.to}`
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.vehicle ? (
                          <div>
                            <p className="font-medium">{booking.vehicle.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{booking.vehicle.type}</p>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{booking.seatIds.length}</TableCell>
                      <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmBooking(booking)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Booking Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Booking Details"
          size="lg"
        >
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">{selectedBooking.bookingReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats:</span>
                      <span className="font-medium">{selectedBooking.seatIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedBooking.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedBooking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedBooking.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Route Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.route ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">From:</span>
                          <span className="font-medium">{selectedBooking.route.from}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">To:</span>
                          <span className="font-medium">{selectedBooking.route.to}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No route information available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.vehicle ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{selectedBooking.vehicle.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{selectedBooking.vehicle.type}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No vehicle information available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedBooking.message && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Message</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedBooking.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleCancelBooking(selectedBooking);
                      setIsModalOpen(false);
                    }}
                  >
                    Cancel Booking
                  </Button>
                  <Button
                    onClick={() => {
                      handleConfirmBooking(selectedBooking);
                      setIsModalOpen(false);
                    }}
                  >
                    Confirm Booking
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}