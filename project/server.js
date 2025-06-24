import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import database and utilities
import { testConnection } from './config/db.js';
import { SeatLockTimer } from './utils/lockSeatTimer.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with PayHere-compatible CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://maxcdn.bootstrapcdn.com",
        "https://sandbox.payhere.lk",
        "https://www.payhere.lk"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for PayHere inline scripts
        "https://www.payhere.lk",
        "https://sandbox.payhere.lk",
        "https://maxcdn.bootstrapcdn.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://images.pexels.com",
        "https://images.unsplash.com",
        "https://sandbox.payhere.lk",
        "https://www.payhere.lk"
      ],
      connectSrc: [
        "'self'",
        "https://sandbox.payhere.lk",
        "https://www.payhere.lk",
        "https://api.payhere.lk"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://maxcdn.bootstrapcdn.com"
      ],
      frameSrc: [
        "'self'",
        "https://sandbox.payhere.lk",
        "https://www.payhere.lk"
      ],
      formAction: [
        "'self'",
        "https://sandbox.payhere.lk",
        "https://www.payhere.lk"
      ]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost'],  // since frontend runs on port 80 (no port needed)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
}));


// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Special rate limit for payment webhook (more lenient)
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow more requests for webhooks
  skip: (req) => {
    // Skip rate limiting for webhook endpoint
    return req.path === '/api/payment/webhook';
  }
});

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw body parser for webhook verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Booking System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', vehicleRoutes); // This includes routes and vehicles endpoints
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Global error handler:', error);
  
  // Handle different types of errors
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      error: error 
    })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your Supabase configuration.');
      process.exit(1);
    }

    // Initialize seat lock timer
    console.log('🔄 Initializing seat lock timer...');
    SeatLockTimer.init();

    // Start the server
    app.listen(PORT, () => {
      console.log(`
🚀 Travel Booking System API Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server URL: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://localhost:${PORT}/health
🔧 Admin Panel: Protected with JWT/API key
⏰ Seat Lock Timer: Active (2min intervals)
💳 PayHere CSP: Configured for payment integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Available API Endpoints:
  GET    /health                           - Health check
  
🔐 Authentication Endpoints:
  POST   /api/auth/register                - Register admin
  POST   /api/auth/login                   - Login admin
  GET    /api/auth/profile                 - Get admin profile
  POST   /api/auth/refresh-token           - Refresh JWT token
  POST   /api/auth/change-password         - Change password
  GET    /api/auth/admins                  - Get all admins (super admin)
  POST   /api/auth/logout                  - Logout

🔓 Public Endpoints:
  GET    /api/routes                       - Get all routes
  GET    /api/vehicles/:routeId            - Get vehicles by route
  GET    /api/seats/:vehicleId             - Get seat layout
  POST   /api/seats/lock                   - Lock seats
  POST   /api/booking/create               - Create booking
  GET    /api/booking/status/:id           - Get booking status
  POST   /api/payment/create-intent        - Create payment intent
  POST   /api/payment/webhook              - Payment webhook
  
🔐 Admin Endpoints (require JWT or X-Admin-Key header):
  POST   /api/admin/routes                 - Create route
  PUT    /api/admin/routes/:id             - Update route
  DELETE /api/admin/routes/:id             - Delete route
  POST   /api/admin/vehicles               - Create vehicle
  GET    /api/admin/vehicles               - Get all vehicles
  PUT    /api/admin/vehicles/:id           - Update vehicle
  DELETE /api/admin/vehicles/:id           - Delete vehicle
  GET    /api/admin/bookings               - Get all bookings
  GET    /api/admin/dashboard              - Dashboard stats

Ready for requests! 🎉
      `);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
startServer();