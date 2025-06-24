import { Admin } from '../models/Admin.js';

export const jwtAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header required'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'JWT token required'
      });
    }

    // Verify JWT token
    const decoded = Admin.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get fresh admin data
    const adminResult = await Admin.findById(decoded.id);
    if (!adminResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or deactivated'
      });
    }

    // Add admin to request object
    req.admin = adminResult.data;
    req.token = token;
    
    next();

  } catch (error) {
    console.error('JWT auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const optionalJwtAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    return jwtAuth(req, res, next);
  }
  
  req.admin = null;
  next();
};

// Role-based access control
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.admin.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Super admin only access
export const requireSuperAdmin = requireRole('super_admin');

// Admin or super admin access
export const requireAdmin = requireRole(['admin', 'super_admin']);