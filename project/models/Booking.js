import { supabase } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export class Booking {
  constructor(data) {
    this.id = data.id;
    this.bookingReference = data.booking_reference;
    this.customerName = data.customer_name;
    this.email = data.email;
    this.phone = data.phone;
    this.message = data.message;
    this.routeId = data.route_id;
    this.vehicleId = data.vehicle_id;
    this.seatIds = data.seat_ids;
    this.bookingType = data.booking_type;
    this.totalAmount = data.total_amount;
    this.status = data.status; // 'pending', 'confirmed', 'cancelled'
    this.travelDate = data.travel_date; // NEW: Travel date
    this.createdAt = data.created_at;
    
    // Handle joined route data
    if (data.routes) {
      this.route = {
        id: data.routes.id,
        from: data.routes.origin_city,
        to: data.routes.destination_city,
        description: data.routes.description
      };
    }
    
    // Handle joined vehicle data
    if (data.vehicles) {
      this.vehicle = data.vehicles;
    }
  }

  static async create(bookingData) {
    try {
      const bookingReference = this.generateBookingReference();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          booking_reference: bookingReference,
          customer_name: bookingData.customerName,
          email: bookingData.email,
          phone: bookingData.phone,
          message: bookingData.message || '',
          route_id: bookingData.routeId,
          vehicle_id: bookingData.vehicleId,
          seat_ids: bookingData.seatIds,
          booking_type: bookingData.bookingType,
          total_amount: bookingData.totalAmount,
          travel_date: bookingData.travelDate, // NEW: Include travel date
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Booking(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static generateBookingReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomId = uuidv4().split('-')[0].toUpperCase();
    return `TRV-${timestamp}-${randomId}`;
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
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
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: new Booking(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findByReference(bookingReference) {
    try {
      const { data, error } = await supabase
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
        .eq('booking_reference', bookingReference)
        .single();

      if (error) throw error;
      return { success: true, data: new Booking(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Booking(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findAll(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
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
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data: data.map(booking => new Booking(booking)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Find bookings by travel date
  static async findByTravelDate(travelDate, limit = 50) {
    try {
      const { data, error } = await supabase
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
        .eq('travel_date', travelDate)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data.map(booking => new Booking(booking)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getStats() {
    try {
      const { data: totalBookings, error: totalError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' });

      const { data: confirmedBookings, error: confirmedError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'confirmed');

      const { data: todayBookings, error: todayError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      if (totalError || confirmedError || todayError) {
        throw new Error('Error fetching booking stats');
      }

      return {
        success: true,
        data: {
          total: totalBookings?.length || 0,
          confirmed: confirmedBookings?.length || 0,
          today: todayBookings?.length || 0
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Admin operations for full CRUD access
  static async adminUpdate(id, updateData, adminId) {
    try {
      // Get old data for audit trail
      const oldBooking = await this.findById(id);
      
      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log admin operation
      await this.logAdminOperation(adminId, 'update', 'bookings', id, oldBooking.data, data);

      return { success: true, data: new Booking(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async adminDelete(id, adminId) {
    try {
      // Get booking data for audit trail
      const booking = await this.findById(id);
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log admin operation
      await this.logAdminOperation(adminId, 'delete', 'bookings', id, booking.data, null);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async logAdminOperation(adminId, operationType, tableName, recordId, oldData, newData) {
    try {
      await supabase
        .from('admin_operations')
        .insert([{
          admin_id: adminId,
          operation_type: operationType,
          table_name: tableName,
          record_id: recordId,
          old_data: oldData,
          new_data: newData
        }]);
    } catch (error) {
      console.error('Failed to log admin operation:', error);
    }
  }
}