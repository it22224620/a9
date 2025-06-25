import { Vehicle } from '../models/Vehicle.js';
import { Route } from '../models/Route.js';
import { Seat } from '../models/Seat.js';
import { supabase } from '../config/db.js';

export class VehicleController {
  static async getVehiclesByRoute(req, res) {
    try {
      const { routeId } = req.params;

      // Verify route exists
      const routeResult = await Route.findById(routeId);
      if (!routeResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Get vehicles for the route
      const vehiclesResult = await Vehicle.findByRoute(routeId);
      if (!vehiclesResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch vehicles',
          error: vehiclesResult.error
        });
      }

      // Get seat availability for each vehicle
      const vehiclesWithSeats = await Promise.all(
        vehiclesResult.data.map(async (vehicle) => {
          const seatsResult = await Seat.findByVehicle(vehicle.id);
          const seats = seatsResult.success ? seatsResult.data : [];
          
          const availableSeats = seats.filter(seat => seat.status === 'available').length;
          const pendingSeats = seats.filter(seat => seat.status === 'pending').length;
          const bookedSeats = seats.filter(seat => seat.status === 'booked').length;

          return {
            ...vehicle,
            seatAvailability: {
              available: availableSeats,
              pending: pendingSeats,
              booked: bookedSeats,
              total: seats.length
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          route: routeResult.data,
          vehicles: vehiclesWithSeats
        }
      });

    } catch (error) {
      console.error('Get vehicles by route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getVehicleDetails(req, res) {
    try {
      const { vehicleId } = req.params;

      const vehicleResult = await Vehicle.findById(vehicleId);
      if (!vehicleResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Get seat layout
      const seatsResult = await Seat.findByVehicle(vehicleId);
      const seats = seatsResult.success ? seatsResult.data : [];

      res.json({
        success: true,
        data: {
          vehicle: vehicleResult.data,
          seats: seats
        }
      });

    } catch (error) {
      console.error('Get vehicle details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllRoutes(req, res) {
    try {
      const routesResult = await Route.findAll();
      if (!routesResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch routes',
          error: routesResult.error
        });
      }

      res.json({
        success: true,
        data: routesResult.data
      });

    } catch (error) {
      console.error('Get all routes error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getSeatLayout(req, res) {
    try {
      const { vehicleId } = req.params;
      const { travelDate } = req.query;

      console.log(`🪑 Getting seat layout for vehicle: ${vehicleId}, travel date: ${travelDate}`);

      let seatsResult;
      
      if (travelDate) {
        // Use the database function to get date-specific availability
        const { data, error } = await supabase
          .rpc('get_seat_availability_by_date', {
            p_vehicle_id: vehicleId,
            p_travel_date: travelDate
          });

        if (error) {
          console.error('Database function error:', error);
          throw error;
        }

        // Transform the data to match our Seat model
        const seats = data.map(seat => ({
          id: seat.seat_id,
          vehicleId: vehicleId,
          seatNumber: seat.seat_number,
          status: seat.is_available_for_date ? 'available' : seat.status,
          bookingDate: seat.booking_date,
          customerEmail: seat.customer_email,
          lockedAt: seat.locked_at
        }));

        console.log(`📊 Found ${seats.length} seats, ${seats.filter(s => s.status === 'available').length} available for ${travelDate}`);

        seatsResult = { success: true, data: seats };
      } else {
        // Fallback to regular seat layout without date filtering
        seatsResult = await Seat.findByVehicle(vehicleId);
      }

      if (!seatsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch seat layout',
          error: seatsResult.error
        });
      }

      res.json({
        success: true,
        data: seatsResult.data
      });

    } catch (error) {
      console.error('Get seat layout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async lockSeats(req, res) {
    try {
      const { seatIds, customerEmail, travelDate } = req.body;

      if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid seat IDs are required'
        });
      }

      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Customer email is required'
        });
      }

      console.log(`🔒 Locking ${seatIds.length} seats for ${customerEmail} on ${travelDate}`);

      const lockResult = await Seat.lockSeats(seatIds, customerEmail, travelDate);
      if (!lockResult.success) {
        return res.status(400).json({
          success: false,
          message: lockResult.error
        });
      }

      console.log(`✅ Successfully locked ${seatIds.length} seats for travel date: ${travelDate}`);

      res.json({
        success: true,
        message: `${seatIds.length} seat(s) locked successfully`,
        data: {
          seats: lockResult.data,
          expiresAt: new Date(Date.now() + parseInt(process.env.SEAT_LOCK_DURATION || 600000))
        }
      });

    } catch (error) {
      console.error('Lock seats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async unlockExpiredSeats(req, res) {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_seat_locks');
      
      if (error) throw error;
      
      const unlockedCount = data && data.length > 0 ? data[0].unlocked_count : 0;
      
      console.log(`🔓 Unlocked ${unlockedCount} expired seats`);
      
      res.json({
        success: true,
        message: `Unlocked ${unlockedCount} expired seats`,
        data: {
          unlockedCount
        }
      });

    } catch (error) {
      console.error('Unlock expired seats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}