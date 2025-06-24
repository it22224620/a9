import { supabase } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class Admin {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.role = data.role || 'admin';
    this.isActive = data.is_active ?? true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    // Don't include password in the object
  }

  static async create(adminData) {
    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

      const { data, error } = await supabase
        .from('admins')
        .insert([{
          username: adminData.username,
          email: adminData.email,
          password_hash: hashedPassword,
          role: adminData.role || 'admin',
          is_active: true
        }])
        .select('id, username, email, role, is_active, created_at, updated_at')
        .single();

      if (error) throw error;
      return { success: true, data: new Admin(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, username, email, role, is_active, created_at, updated_at')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, data: new Admin(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  static generateToken(admin) {
    const payload = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';
    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'travel-booking-api'
    };

    return jwt.sign(payload, secret, options);
  }

  static verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  static async updateLastLogin(id) {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async changePassword(id, newPassword) {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const { error } = await supabase
        .from('admins')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getAllAdmins() {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, username, email, role, is_active, created_at, updated_at, last_login')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data.map(admin => new Admin(admin)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async deactivateAdmin(id) {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}