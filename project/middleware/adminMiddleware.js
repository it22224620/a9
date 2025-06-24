import crypto from 'crypto';
import { jwtAuth } from './jwtMiddleware.js';

// Legacy admin key authentication (for backward compatibility)
export const adminAuth = (req, res, next) => {
  try {
    const adminKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!adminKey) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    // Simple admin key verification
    const expectedKey = process.env.ADMIN_SECRET_KEY;
    
    if (!expectedKey) {
      console.error('ADMIN_SECRET_KEY not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Constant time comparison to prevent timing attacks
    const providedKeyBuffer = Buffer.from(adminKey, 'utf8');
    const expectedKeyBuffer = Buffer.from(expectedKey, 'utf8');
    
    if (providedKeyBuffer.length !== expectedKeyBuffer.length) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const isValid = crypto.timingSafeEqual(providedKeyBuffer, expectedKeyBuffer);
    
    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Add admin flag to request for potential future use
    req.isAdmin = true;
    req.admin = { 
      id: 'legacy-admin',
      username: 'legacy-admin',
      role: 'super_admin',
      authMethod: 'api-key'
    };
    next();

  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// New flexible admin authentication (JWT or API Key)
export const flexibleAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];

  // Check if JWT token is provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return jwtAuth(req, res, next);
  }

  // Check if admin key is provided
  if (adminKey || authHeader) {
    return adminAuth(req, res, next);
  }

  // No authentication provided
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Use JWT token or admin key.'
  });
};

export const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];
  
  if (authHeader || adminKey) {
    return flexibleAdminAuth(req, res, next);
  }
  
  req.isAdmin = false;
  req.admin = null;
  next();
};