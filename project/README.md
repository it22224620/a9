# 🚌 Travel & Tourism Vehicle Booking System

A production-grade backend system for travel and tourism vehicle booking built with Node.js, Express, and Supabase PostgreSQL. Features real-time seat management, secure payment processing with PayHere, and comprehensive admin controls.

## 🚀 Features

- **No User Authentication Required** - Direct booking via form submission
- **Real-time Seat Management** - Advanced seat locking with TTL mechanism
- **Secure Payment Processing** - PayHere integration with webhook verification
- **Admin Dashboard** - Complete CRUD operations for routes, vehicles, and bookings
- **Production Ready** - Rate limiting, security headers, error handling, and logging
- **ACID Compliance** - Transaction support for data integrity
- **Auto Cleanup** - CRON jobs for expired seat unlocking

## 🛠️ Tech Stack

- **Backend**: Node.js 18+ with Express.js (ES Modules)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Payment**: PayHere Gateway
- **Caching**: In-memory seat lock cache
- **Security**: Helmet, CORS, Rate Limiting
- **Deployment**: PM2 + Nginx ready

## 📋 Prerequisites

- Node.js 18 or higher
- Supabase account and project
- PayHere merchant account

## ⚙️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd travel-booking-backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# PayHere Configuration
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_SANDBOX=true

# Admin Configuration
ADMIN_SECRET_KEY=your_super_secret_admin_key_2024

# Application Configuration
FRONTEND_URL=http://localhost:5173
SEAT_LOCK_DURATION=600000
WEBHOOK_ENDPOINT_SECRET=your_webhook_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

1. **Connect to Supabase**: Click the "Connect to Supabase" button in the top right of your development interface
2. **Run Migration**: The database schema will be automatically created from the migration file
3. **Verify Setup**: The application will test the database connection on startup

### 4. PayHere Configuration

1. Sign up for a PayHere merchant account
2. Get your Merchant ID and Merchant Secret from the PayHere dashboard
3. Set up webhook URL: `https://your-domain.com/api/payment/webhook`
4. For testing, set `PAYHERE_SANDBOX=true`

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start at `http://localhost:3000` and display available endpoints.

## 📚 API Documentation

### 🔓 Public Endpoints

#### Routes & Vehicles
```http
GET /api/routes                    # Get all available routes
GET /api/vehicles/:routeId         # Get vehicles for a route
GET /api/vehicle/:vehicleId        # Get vehicle details
GET /api/seats/:vehicleId          # Get seat layout
```

#### Seat Management
```http
POST /api/seats/lock               # Lock seats for booking
POST /api/seats/unlock-expired     # Unlock expired seats
```

**Lock Seats Request:**
```json
{
  "seatIds": ["uuid1", "uuid2"],
  "customerEmail": "customer@example.com"
}
```

#### Booking
```http
POST /api/booking/create           # Create new booking
GET /api/booking/status/:id        # Get booking status
```

**Create Booking Request:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+94771234567",
  "message": "Special requests here",
  "routeId": "route-uuid",
  "vehicleId": "vehicle-uuid",
  "seatIds": ["seat-uuid1", "seat-uuid2"],
  "bookingType": "common"
}
```

#### Payment
```http
POST /api/payment/create-intent    # Create payment intent
POST /api/payment/webhook          # PayHere webhook (PayHere only)
GET /api/payment/status/:paymentId # Get payment status
```

### 🔐 Admin Endpoints

All admin endpoints require the `X-Admin-Key` header with your admin secret key.

```http
# Routes Management
POST   /api/admin/routes           # Create route
PUT    /api/admin/routes/:id       # Update route
DELETE /api/admin/routes/:id       # Delete route

# Vehicle Management
POST   /api/admin/vehicles         # Create vehicle
GET    /api/admin/vehicles         # Get all vehicles
PUT    /api/admin/vehicles/:id     # Update vehicle
DELETE /api/admin/vehicles/:id     # Delete vehicle

# Booking Management
GET    /api/admin/bookings         # Get all bookings

# Dashboard
GET    /api/admin/dashboard        # Get dashboard statistics

# System Maintenance
POST   /api/admin/maintenance/unlock-expired-seats
```

**Create Vehicle Request:**
```json
{
  "name": "Luxury Bus #1",
  "type": "bus",
  "routeId": "route-uuid",
  "bookingType": "common",
  "seatCount": 45,
  "pricePerSeat": 1500.00,
  "imageUrl": "https://example.com/bus-image.jpg"
}
```

## 🧪 Testing with Postman

### 1. Import Environment
Create a Postman environment with these variables:
- `base_url`: http://localhost:3000
- `admin_key`: your_admin_secret_key

### 2. Test Flow Sequence

1. **Create Route**
   ```http
   POST {{base_url}}/api/admin/routes
   Headers: X-Admin-Key: {{admin_key}}
   Body: {
     "from": "Colombo",
     "to": "Kandy",
     "description": "Scenic mountain route"
   }
   ```

2. **Add Vehicle**
   ```http
   POST {{base_url}}/api/admin/vehicles
   Headers: X-Admin-Key: {{admin_key}}
   Body: {
     "name": "Express Bus #1",
     "type": "bus",
     "routeId": "{{route_id_from_step_1}}",
     "bookingType": "common",
     "seatCount": 30,
     "pricePerSeat": 1200.00
   }
   ```

3. **Get Seat Layout**
   ```http
   GET {{base_url}}/api/seats/{{vehicle_id}}
   ```

4. **Lock Seats**
   ```http
   POST {{base_url}}/api/seats/lock
   Body: {
     "seatIds": ["seat-id-1", "seat-id-2"],
     "customerEmail": "test@example.com"
   }
   ```

5. **Create Booking**
   ```http
   POST {{base_url}}/api/booking/create
   Body: {
     "customerName": "Test Customer",
     "email": "test@example.com",
     "phone": "+94771234567",
     "routeId": "{{route_id}}",
     "vehicleId": "{{vehicle_id}}",
     "seatIds": ["seat-id-1", "seat-id-2"],
     "bookingType": "common"
   }
   ```

6. **Create Payment Intent**
   ```http
   POST {{base_url}}/api/payment/create-intent
   Body: {
     "bookingId": "{{booking_id_from_step_5}}"
   }
   ```

7. **Simulate Payment Webhook**
   ```http
   POST {{base_url}}/api/payment/webhook
   Body: {
     "merchant_id": "your_merchant_id",
     "order_id": "{{order_id_from_step_6}}",
     "payment_id": "test_payment_123",
     "payhere_amount": "2400.00",
     "payhere_currency": "LKR",
     "status_code": "2",
     "md5sig": "{{calculated_hash}}"
   }
   ```

## 🔄 Seat Locking Mechanism

The system implements a sophisticated seat locking mechanism:

- **Lock Duration**: 10 minutes (configurable via `SEAT_LOCK_DURATION`)
- **Auto Cleanup**: CRON job runs every 2 minutes
- **Status Flow**: `available` → `pending` → `booked`/`available`
- **Concurrency Safe**: Atomic database operations prevent double booking

### Seat Status Flow
```
available → [user locks] → pending → [payment success] → booked
     ↑                         ↓
     └─────[timeout/failure]────┘
```

## 💳 PayHere Integration

### Webhook Setup
1. Login to PayHere merchant dashboard
2. Go to Settings → Webhooks
3. Set Webhook URL: `https://your-domain.com/api/payment/webhook`
4. Ensure webhook is enabled

### Hash Generation
PayHere requires MD5 hash verification. The system automatically:
- Generates payment hash for requests
- Verifies webhook signatures
- Handles payment status updates

### Testing Payments
Use PayHere sandbox mode for testing:
- Set `PAYHERE_SANDBOX=true` in environment
- Use test card numbers from PayHere documentation

## 🔧 Production Deployment

### PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'travel-booking-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deployment Commands
```bash
# Install dependencies
npm ci --production

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📊 Monitoring & Logging

### Health Check
```http
GET /health
```

### Log Levels
- **Production**: Combined format with error logging
- **Development**: Detailed request logging
- **Error Tracking**: Unhandled promise rejection handling

### Performance Metrics
- Request rate limiting: 100 requests per 15 minutes per IP
- Seat lock cache: 30-second TTL for performance
- Database connection pooling via Supabase

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable origin control
- **Rate Limiting**: DDoS protection
- **Input Validation**: Express-validator
- **SQL Injection**: Parameterized queries
- **Admin Authentication**: Timing-safe key comparison
- **Payment Security**: Hash verification

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies are set correctly

2. **Payment Webhook Not Working**
   - Verify webhook URL is publicly accessible
   - Check PayHere merchant configuration
   - Ensure webhook endpoint can receive POST requests

3. **Seats Not Unlocking**
   - Check CRON job is running
   - Verify `SEAT_LOCK_DURATION` configuration
   - Manual cleanup: `POST /api/admin/maintenance/unlock-expired-seats`

4. **Rate Limiting Issues**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
   - Consider IP whitelisting for admin operations

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the API documentation above
- Review the troubleshooting section

---

**Built with ❤️ for the travel industry**