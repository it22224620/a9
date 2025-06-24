import { Admin } from '../models/Admin.js';
import { validationResult } from 'express-validator';

export class AuthController {
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, role } = req.body;

      // Check if username already exists
      const existingUsername = await Admin.findByUsername(username);
      if (existingUsername.success) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if email already exists
      const existingEmail = await Admin.findByEmail(email);
      if (existingEmail.success) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Create admin
      const adminResult = await Admin.create({
        username,
        email,
        password,
        role: role || 'admin'
      });

      if (!adminResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create admin account',
          error: adminResult.error
        });
      }

      // Generate JWT token
      const token = Admin.generateToken(adminResult.data);

      // Update last login
      await Admin.updateLastLogin(adminResult.data.id);

      res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        data: {
          admin: adminResult.data,
          token,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Find admin by username
      const adminResult = await Admin.findByUsername(username);
      if (!adminResult.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const adminData = adminResult.data;

      // Verify password
      const isValidPassword = await Admin.verifyPassword(password, adminData.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create admin object without password
      const admin = new Admin(adminData);

      // Generate JWT token
      const token = Admin.generateToken(admin);

      // Update last login
      await Admin.updateLastLogin(admin.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin,
          token,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getProfile(req, res) {
    try {
      // Admin data is already available from middleware
      const admin = req.admin;

      res.json({
        success: true,
        data: admin
      });

    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const adminId = req.admin.id;

      // Get current admin data with password
      const adminResult = await Admin.findByUsername(req.admin.username);
      if (!adminResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Verify current password
      const isValidPassword = await Admin.verifyPassword(currentPassword, adminResult.data.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const updateResult = await Admin.changePassword(adminId, newPassword);
      if (!updateResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update password',
          error: updateResult.error
        });
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const admin = req.admin;

      // Generate new token
      const token = Admin.generateToken(admin);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can log the logout event
      console.log(`Admin ${req.admin.username} logged out at ${new Date().toISOString()}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllAdmins(req, res) {
    try {
      const adminsResult = await Admin.getAllAdmins();
      if (!adminsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch admins',
          error: adminsResult.error
        });
      }

      res.json({
        success: true,
        data: adminsResult.data
      });

    } catch (error) {
      console.error('Get all admins error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}