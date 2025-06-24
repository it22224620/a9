import { supabase } from '../config/db.js';

export class Vehicle {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'van', 'bus', 'car'
    this.routeId = data.route_id;
    this.bookingType = data.booking_type; // 'common', 'individual', 'vip'
    this.seatCount = data.seat_count;
    this.isAvailable = data.is_available;
    this.imageUrl = data.image_url;
    this.pricePerSeat = data.price_per_seat;
    this.createdAt = data.created_at;
    
    // Handle joined route data with correct column names
    if (data.routes) {
      this.route = {
        id: data.routes.id,
        from: data.routes.origin_city,  // Map origin_city to from
        to: data.routes.destination_city,  // Map destination_city to to
        description: data.routes.description
      };
    }
  }

  static async create(vehicleData) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          name: vehicleData.name,
          type: vehicleData.type,
          route_id: vehicleData.routeId,
          booking_type: vehicleData.bookingType,
          seat_count: vehicleData.seatCount,
          is_available: true,
          image_url: vehicleData.imageUrl,
          price_per_seat: vehicleData.pricePerSeat
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Create seats for the vehicle
      await this.createSeats(data.id, vehicleData.seatCount);
      
      return { success: true, data: new Vehicle(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async createSeats(vehicleId, seatCount) {
    const seats = [];
    for (let i = 1; i <= seatCount; i++) {
      seats.push({
        vehicle_id: vehicleId,
        seat_number: i,
        status: 'available'
      });
    }

    const { error } = await supabase
      .from('seats')
      .insert(seats);

    if (error) throw error;
  }

  static async findByRoute(routeId) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('route_id', routeId)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data.map(vehicle => new Vehicle(vehicle)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: new Vehicle(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findAll() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          routes:route_id (
            id,
            origin_city,
            destination_city,
            description
          )
        `)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data.map(vehicle => new Vehicle(vehicle)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Vehicle(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_available: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}