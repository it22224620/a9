import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller.js';
import { jwtAuth, requireSuperAdmin } from '../middleware/jwtMiddleware.js';

const router = Router();

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Role must be admin or super_admin')
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);

// Protected routes (require JWT)
router.use(jwtAuth); // All routes below require authentication

router.get('/profile', AuthController.getProfile);
router.post('/change-password', changePasswordValidation, AuthController.changePassword);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Super admin only routes
router.get('/admins', requireSuperAdmin, AuthController.getAllAdmins);

export default router;