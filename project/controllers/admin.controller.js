import { Vehicle } from '../models/Vehicle.js';
import { Route } from '../models/Route.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Seat } from '../models/Seat.js';
import { supabase } from '../config/db.js';
import { validationResult } from 'express-validator';

export class AdminController {
  // Routes Management
  static async createRoute(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { from, to, description } = req.body;
      
      const routeResult = await Route.create({ from, to, description });
      if (!routeResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create route',
          error: routeResult.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'create', 'routes', routeResult.data.id, null, routeResult.data);
      }

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: routeResult.data
      });

    } catch (error) {
      console.error('Create route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get old data for audit trail
      const oldRoute = await Route.findById(id);

      const result = await Route.update(id, updateData);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Route not found or update failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'update', 'routes', id, oldRoute.data, result.data);
      }

      res.json({
        success: true,
        message: 'Route updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Update route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteRoute(req, res) {
    try {
      const { id } = req.params;

      // Get route data for audit trail
      const route = await Route.findById(id);

      const result = await Route.delete(id);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Route not found or deletion failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'delete', 'routes', id, route.data, null);
      }

      res.json({
        success: true,
        message: 'Route deleted successfully'
      });

    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Vehicle Management
  static async createVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const vehicleData = req.body;
      
      const vehicleResult = await Vehicle.create(vehicleData);
      if (!vehicleResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create vehicle',
          error: vehicleResult.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'create', 'vehicles', vehicleResult.data.id, null, vehicleResult.data);
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicleResult.data
      });

    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get old data for audit trail
      const oldVehicle = await Vehicle.findById(id);

      const result = await Vehicle.update(id, updateData);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or update failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'update', 'vehicles', id, oldVehicle.data, result.data);
      }

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteVehicle(req, res) {
    try {
      const { id } = req.params;

      // Get vehicle data for audit trail
      const vehicle = await Vehicle.findById(id);

      const result = await Vehicle.delete(id);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or deletion failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'delete', 'vehicles', id, vehicle.data, null);
      }

      res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });

    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllVehicles(req, res) {
    try {
      const vehiclesResult = await Vehicle.findAll();
      if (!vehiclesResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch vehicles',
          error: vehiclesResult.error
        });
      }

      res.json({
        success: true,
        data: vehiclesResult.data
      });

    } catch (error) {
      console.error('Get all vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Dashboard Statistics
  static async getDashboardStats(req, res) {
    try {
      // Get booking statistics
      const bookingStats = await Booking.getStats();
      
      // Get payment statistics
      const paymentStats = await Payment.getStats();

      // Get vehicle statistics
      const vehiclesResult = await Vehicle.findAll();
      const totalVehicles = vehiclesResult.success ? vehiclesResult.data.length : 0;

      // Get route statistics
      const routesResult = await Route.findAll();
      const totalRoutes = routesResult.success ? routesResult.data.length : 0;

      const dashboardData = {
        bookings: bookingStats.success ? bookingStats.data : {
          total: 0,
          confirmed: 0,
          today: 0
        },
        payments: paymentStats.success ? paymentStats.data : {
          totalRevenue: 0,
          todayRevenue: 0,
          totalTransactions: 0,
          todayTransactions: 0
        },
        vehicles: {
          total: totalVehicles,
          active: totalVehicles // Assuming all fetched vehicles are active
        },
        routes: {
          total: totalRoutes,
          active: totalRoutes // Assuming all fetched routes are active
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Booking Management with Admin Powers
  static async getAllBookings(req, res) {
    try {
      const { page = 1, limit = 50, status, travelDate } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('bookings')
        .select(`
          *,
          routes:route_id (
            id,
            origin_city,
            destination_city,
            description
          ),
          vehicles:vehicle_id (
            id,
            name,
            type,
            booking_type,
            departure_time
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (travelDate) {
        query = query.eq('travel_date', travelDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const bookings = data.map(booking => new Booking(booking));

      res.json({
        success: true,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookings.length
        }
      });

    } catch (error) {
      console.error('Get all bookings (admin) error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NEW: Admin booking operations
  static async updateBooking(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await Booking.adminUpdate(id, updateData, req.admin?.id);
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

  static async deleteBooking(req, res) {
    try {
      const { id } = req.params;

      const result = await Booking.adminDelete(id, req.admin?.id);
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

  // NEW: Admin seat operations
  static async updateSeat(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await Seat.adminUpdate(id, updateData, req.admin?.id);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Seat not found or update failed',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Seat updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Admin update seat error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteSeat(req, res) {
    try {
      const { id } = req.params;

      const result = await Seat.adminDelete(id, req.admin?.id);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Seat not found or deletion failed',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Seat deleted successfully'
      });

    } catch (error) {
      console.error('Admin delete seat error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NEW: Admin payment operations
  static async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('payments')
        .select(`
          *,
          bookings:booking_id (
            id,
            booking_reference,
            customer_name,
            email,
            travel_date,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const payments = data.map(payment => new Payment(payment));

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: payments.length
        }
      });

    } catch (error) {
      console.error('Get all payments (admin) error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { status, transactionId, gatewayResponse } = req.body;

      const result = await Payment.updateStatus(id, status, transactionId, gatewayResponse);
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or update failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'update', 'payments', id, null, result.data);
      }

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Admin update payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await Payment.refund(id, reason || 'Admin refund');
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or refund failed',
          error: result.error
        });
      }

      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'refund', 'payments', id, null, { reason });
      }

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Admin refund payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NEW: Admin operations audit trail
  static async getAdminOperations(req, res) {
    try {
      const { page = 1, limit = 50, adminId, operationType, tableName } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('admin_operations')
        .select(`
          *,
          admins:admin_id (
            id,
            username,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      // Apply filters
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }

      if (operationType) {
        query = query.eq('operation_type', operationType);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length
        }
      });

    } catch (error) {
      console.error('Get admin operations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NEW: Bulk operations
  static async bulkUpdateBookings(req, res) {
    try {
      const { bookingIds, updateData } = req.body;

      if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Booking IDs array is required'
        });
      }

      const results = [];
      for (const bookingId of bookingIds) {
        const result = await Booking.adminUpdate(bookingId, updateData, req.admin?.id);
        results.push({
          bookingId,
          success: result.success,
          error: result.error
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      });

    } catch (error) {
      console.error('Bulk update bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async bulkDeleteBookings(req, res) {
    try {
      const { bookingIds } = req.body;

      if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Booking IDs array is required'
        });
      }

      const results = [];
      for (const bookingId of bookingIds) {
        const result = await Booking.adminDelete(bookingId, req.admin?.id);
        results.push({
          bookingId,
          success: result.success,
          error: result.error
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        message: `Bulk delete completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      });

    } catch (error) {
      console.error('Bulk delete bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // System Maintenance
  static async unlockAllExpiredSeats(req, res) {
    try {
      const result = await Seat.unlockExpiredSeats();
      
      // Log admin operation
      if (req.admin?.id) {
        await Booking.logAdminOperation(req.admin.id, 'maintenance', 'seats', null, null, { 
          operation: 'unlock_expired_seats',
          unlockedCount: result.count || 0
        });
      }

      res.json({
        success: true,
        message: `System maintenance completed. Unlocked ${result.count || 0} expired seats`,
        data: {
          unlockedCount: result.count || 0,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('System maintenance error:', error);
      res.status(500).json({
        success: false,
        message: 'System maintenance failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // NEW: Advanced reporting
  static async getBookingsByDateRange(req, res) {
    try {
      const { startDate, endDate, status } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          routes:route_id (
            id,
            origin_city,
            destination_city
          ),
          vehicles:vehicle_id (
            id,
            name,
            type
          )
        `)
        .gte('travel_date', startDate)
        .lte('travel_date', endDate)
        .order('travel_date', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const bookings = data.map(booking => new Booking(booking));

      // Calculate summary statistics
      const summary = {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0),
        statusBreakdown: {
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length
        }
      };

      res.json({
        success: true,
        data: {
          bookings,
          summary,
          dateRange: { startDate, endDate }
        }
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