'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { bookingsAPI } from '../../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingReference: string;
  customerName: string;
  email: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  route?: {
    from: string;
    to: string;
  };
}

export default function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      const response = await bookingsAPI.getAll({ limit: 5 });
      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      toast.error('Failed to fetch recent bookings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent padding={false}>
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent bookings found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
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
                    {formatCurrency(booking.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(booking.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}