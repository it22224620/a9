import { supabase } from '../config/db.js';

export class Route {
  constructor(data) {
    this.id = data.id;
    this.from = data.origin_city;
    this.to = data.destination_city;
    this.description = data.description;
    this.isActive = data.is_active ?? true;
    this.createdAt = data.created_at;
  }

  static async create(routeData) {
    try {
      const { data, error } = await supabase
        .from('routes')
        .insert([{
          origin_city: routeData.from,
          destination_city: routeData.to,
          description: routeData.description,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Route(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findAll() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('origin_city', { ascending: true });

      if (error) throw error;
      return { success: true, data: data.map(route => new Route(route)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, data: new Route(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async update(id, updateData) {
    try {
      const updateFields = {};
      if (updateData.from) updateFields.origin_city = updateData.from;
      if (updateData.to) updateFields.destination_city = updateData.to;
      if (updateData.description !== undefined) updateFields.description = updateData.description;

      const { data, error } = await supabase
        .from('routes')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Route(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('routes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}