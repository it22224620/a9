import { supabase } from '../config/db.js';

export class Seat {
  constructor(data) {
    this.id = data.id;
    this.vehicleId = data.vehicle_id;
    this.seatNumber = data.seat_number;
    this.status = data.status; // 'available', 'pending', 'booked'
    this.lockedAt = data.locked_at;
    this.customerEmail = data.customer_email;
    this.bookingDate = data.booking_date; // Booking date
    this.createdAt = data.created_at;
  }

  static async findByVehicle(vehicleId, travelDate = null) {
    try {
      let query = supabase
        .from('seats')
        .select('*')
        .eq('vehicle_id', vehicleId);

      // If travel date is provided, get seats available for that date
      if (travelDate) {
        query = query.or(`booking_date.is.null,booking_date.neq.${travelDate}`);
      }

      const { data, error } = await query.order('seat_number', { ascending: true });

      if (error) throw error;
      return { success: true, data: data.map(seat => new Seat(seat)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find seats by vehicle and date using the database function
  static async findByVehicleAndDate(vehicleId, travelDate) {
    try {
      const { data, error } = await supabase
        .rpc('get_seat_availability_by_date', {
          p_vehicle_id: vehicleId,
          p_travel_date: travelDate
        });

      if (error) throw error;
      return { success: true, data: data.map(seat => ({
        id: seat.seat_id,
        vehicleId: vehicleId,
        seatNumber: seat.seat_number,
        status: seat.is_available_for_date ? 'available' : seat.status,
        isAvailableForDate: seat.is_available_for_date,
        bookingDate: seat.booking_date,
        customerEmail: seat.customer_email
      })) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async lockSeats(seatIds, customerEmail, travelDate = null) {
    try {
      const lockTime = new Date().toISOString();
      const updateData = {
        status: 'pending',
        locked_at: lockTime,
        customer_email: customerEmail
      };

      // Add travel date if provided
      if (travelDate) {
        updateData.booking_date = travelDate;
      }

      const { data, error } = await supabase
        .from('seats')
        .update(updateData)
        .in('id', seatIds)
        .eq('status', 'available')
        .select();

      if (error) throw error;
      
      if (data.length !== seatIds.length) {
        // Rollback - unlock any seats that were locked
        await this.unlockSeats(seatIds);
        throw new Error('Some seats are no longer available');
      }

      return { success: true, data: data.map(seat => new Seat(seat)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async unlockSeats(seatIds) {
    try {
      const { data, error } = await supabase
        .from('seats')
        .update({
          status: 'available',
          locked_at: null,
          customer_email: null,
          booking_date: null // Clear booking date when unlocking
        })
        .in('id', seatIds)
        .select();

      if (error) throw error;
      return { success: true, data: data.map(seat => new Seat(seat)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Properly book seats when payment is successful
  static async confirmSeats(seatIds, travelDate = null) {
    try {
      console.log(`🔄 Confirming ${seatIds.length} seats for travel date: ${travelDate}`);
      
      const updateData = { 
        status: 'booked',
        locked_at: null
      };
      
      // Set the booking date when confirming
      if (travelDate) {
        updateData.booking_date = travelDate;
      }

      const { data, error } = await supabase
        .from('seats')
        .update(updateData)
        .in('id', seatIds)
        .select();

      if (error) {
        console.error('❌ Error confirming seats:', error);
        throw error;
      }
      
      console.log(`✅ Successfully booked ${data.length} seats for travel date: ${travelDate}`);
      return { success: true, data: data.map(seat => new Seat(seat)) };
    } catch (error) {
      console.error('❌ Seat confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  static async unlockExpiredSeats() {
    try {
      const expirationTime = new Date(Date.now() - parseInt(process.env.SEAT_LOCK_DURATION || 600000));
      
      const { data, error } = await supabase
        .from('seats')
        .update({
          status: 'available',
          locked_at: null,
          customer_email: null,
          booking_date: null
        })
        .eq('status', 'pending')
        .lt('locked_at', expirationTime.toISOString())
        .select();

      if (error) throw error;
      
      console.log(`🔓 Unlocked ${data.length} expired seats`);
      return { success: true, count: data.length };
    } catch (error) {
      console.error('Error unlocking expired seats:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async getAvailableSeats(vehicleId, travelDate = null) {
    try {
      if (travelDate) {
        // Use the new function for date-specific availability
        return await this.findByVehicleAndDate(vehicleId, travelDate);
      }

      // Fallback to original method
      let query = supabase
        .from('seats')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'available');

      const { data, error } = await query.order('seat_number', { ascending: true });

      if (error) throw error;
      return { success: true, data: data.map(seat => new Seat(seat)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Admin operations for full CRUD access
  static async adminUpdate(id, updateData, adminId) {
    try {
      const { data, error } = await supabase
        .from('seats')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Seat(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async adminDelete(id, adminId) {
    try {
      const { error } = await supabase
        .from('seats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}