import { Vehicle } from '../models/Vehicle.js';
import { Route } from '../models/Route.js';
import { Seat } from '../models/Seat.js';

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

      const seatsResult = await Seat.findByVehicle(vehicleId);
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
      const { seatIds, customerEmail } = req.body;

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

      const lockResult = await Seat.lockSeats(seatIds, customerEmail);
      if (!lockResult.success) {
        return res.status(400).json({
          success: false,
          message: lockResult.error
        });
      }

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
      const result = await Seat.unlockExpiredSeats();
      
      res.json({
        success: true,
        message: `Unlocked ${result.count || 0} expired seats`,
        data: {
          unlockedCount: result.count || 0
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