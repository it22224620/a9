import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Route } from '../models/Route.js';
import { Seat } from '../models/Seat.js';
import { validationResult } from 'express-validator';

export class BookingController {
  static async createBooking(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { 
        customerName, 
        email, 
        phone, 
        message,
        routeId, 
        vehicleId, 
        seatIds, 
        bookingType,
        travelDate,
        departureTime
      } = req.body;

      // Verify vehicle exists and get pricing
      const vehicleResult = await Vehicle.findById(vehicleId);
      if (!vehicleResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const vehicle = vehicleResult.data;
      
      // Calculate total amount
      const totalAmount = vehicle.pricePerSeat * seatIds.length;

      // Verify seats are still locked for this customer
      const seatsResult = await Seat.findByVehicle(vehicleId);
      if (!seatsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying seats'
        });
      }

      const lockedSeats = seatsResult.data.filter(seat => 
        seatIds.includes(seat.id) && 
        seat.status === 'pending' && 
        seat.customerEmail === email
      );

      if (lockedSeats.length !== seatIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some seats are no longer available or lock has expired'
        });
      }

      // Create booking with date information
      const bookingResult = await Booking.create({
        customerName,
        email,
        phone,
        message,
        routeId,
        vehicleId,
        seatIds,
        bookingType,
        totalAmount,
        travelDate: travelDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        departureTime: departureTime || vehicle.departureTime || '08:00:00'
      });

      if (!bookingResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create booking',
          error: bookingResult.error
        });
      }

      console.log(`✅ Booking created successfully: ${bookingResult.data.bookingReference}`);
      console.log(`📅 Travel date: ${bookingResult.data.travelDate}`);
      console.log(`💺 Seats: ${seatIds.length} seats locked`);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking: bookingResult.data,
          nextStep: 'payment'
        }
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.query; // 'id' or 'reference'

      let bookingResult;
      
      if (type === 'reference') {
        bookingResult = await Booking.findByReference(id);
      } else {
        bookingResult = await Booking.findById(id);
      }

      if (!bookingResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Get seat information
      const seatsResult = await Seat.findByVehicle(bookingResult.data.vehicleId);
      const bookedSeats = seatsResult.success ? 
        seatsResult.data.filter(seat => bookingResult.data.seatIds.includes(seat.id)) : [];

      res.json({
        success: true,
        data: {
          booking: bookingResult.data,
          seats: bookedSeats
        }
      });

    } catch (error) {
      console.error('Get booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllBookings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        travelDate, 
        email, 
        bookingReference 
      } = req.query;
      const offset = (page - 1) * limit;

      const filters = {};
      if (status) filters.status = status;
      if (travelDate) filters.travelDate = travelDate;
      if (email) filters.email = email;
      if (bookingReference) filters.bookingReference = bookingReference;

      const bookingsResult = await Booking.findAll(parseInt(limit), offset, filters);
      
      if (!bookingsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch bookings',
          error: bookingsResult.error
        });
      }

      res.json({
        success: true,
        data: bookingsResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookingsResult.data.length
        }
      });

    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async confirmBooking(req, res) {
    try {
      const { bookingId } = req.params;

      // Update booking status
      const bookingResult = await Booking.updateStatus(bookingId, 'confirmed');
      if (!bookingResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Confirm seats with travel date
      const booking = bookingResult.data;
      const seatsResult = await Seat.confirmSeats(booking.seatIds, booking.travelDate);
      
      if (!seatsResult.success) {
        // Rollback booking status
        await Booking.updateStatus(bookingId, 'pending');
        return res.status(500).json({
          success: false,
          message: 'Failed to confirm seats'
        });
      }

      console.log(`✅ Booking confirmed: ${booking.bookingReference}`);
      console.log(`📅 Travel date: ${booking.travelDate}`);
      console.log(`💺 Seats booked: ${booking.seatIds.length}`);

      res.json({
        success: true,
        message: 'Booking confirmed successfully',
        data: bookingResult.data
      });

    } catch (error) {
      console.error('Confirm booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      // Get booking details
      const bookingResult = await Booking.findById(bookingId);
      if (!bookingResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = bookingResult.data;

      // Update booking status
      const updateResult = await Booking.updateStatus(bookingId, 'cancelled');
      if (!updateResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to cancel booking'
        });
      }

      // Unlock seats
      await Seat.unlockSeats(booking.seatIds);

      console.log(`❌ Booking cancelled: ${booking.bookingReference}`);
      console.log(`🔓 Seats unlocked: ${booking.seatIds.length}`);

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updateResult.data
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Admin methods for full CRUD operations
  static async adminUpdateBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const updateData = req.body;
      
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await Booking.adminUpdate(bookingId, updateData, adminInfo);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or update failed',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Booking updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Admin update booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async adminDeleteBooking(req, res) {
    try {
      const { bookingId } = req.params;
      
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await Booking.adminDelete(bookingId, adminInfo);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or deletion failed',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      console.error('Admin delete booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getBookingsByDateRange(req, res) {
    try {
      const { startDate, endDate, status } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const filters = {};
      if (status) filters.status = status;

      const bookingsResult = await Booking.getBookingsByDateRange(startDate, endDate, filters);
      
      if (!bookingsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch bookings',
          error: bookingsResult.error
        });
      }

      res.json({
        success: true,
        data: bookingsResult.data
      });

    } catch (error) {
      console.error('Get bookings by date range error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}