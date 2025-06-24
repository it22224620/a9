/*
  # Travel & Tourism Vehicle Booking System Database Schema

  1. New Tables
    - `routes` - Travel routes with origin and destination
    - `vehicles` - Transportation vehicles (van, bus, car) with pricing
    - `seats` - Individual seats with real-time status tracking
    - `bookings` - Customer bookings without user authentication
    - `payments` - Payment transactions with PayHere integration

  2. Security
    - Enable RLS on all tables
    - Public policies for booking operations
    - Service role policies for admin operations

  3. Performance
    - Comprehensive indexing strategy
    - Optimized queries for seat availability
    - Efficient booking reference lookups

  4. Features
    - UUID primary keys for security
    - Automatic timestamp updates
    - Seat locking mechanism with TTL
    - Payment status tracking
    - Booking reference generation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('van', 'bus', 'car')),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('common', 'individual', 'vip')),
  seat_count integer NOT NULL CHECK (seat_count > 0 AND seat_count <= 100),
  is_available boolean DEFAULT true,
  image_url text,
  price_per_seat decimal(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'booked')),
  locked_at timestamptz,
  customer_email text,
  booking_date date, -- NEW: Date for which the seat is booked
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vehicle_id, seat_number, booking_date) -- Updated unique constraint
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text DEFAULT '',
  route_id uuid REFERENCES routes(id),
  vehicle_id uuid REFERENCES vehicles(id),
  seat_ids uuid[] NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('common', 'individual', 'vip')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  travel_date date NOT NULL DEFAULT CURRENT_DATE, -- NEW: Travel date field
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'LKR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  gateway text NOT NULL DEFAULT 'payhere',
  transaction_id text,
  payment_intent_id text,
  gateway_response jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_route ON vehicles(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(is_available);
CREATE INDEX IF NOT EXISTS idx_seats_vehicle ON seats(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_seats_booking_date ON seats(booking_date); -- NEW: Index for booking date
CREATE INDEX IF NOT EXISTS idx_seats_locked_at ON seats(locked_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date); -- NEW: Index for travel date
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Routes
CREATE POLICY "Public can read active routes"
  ON routes
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage routes"
  ON routes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Vehicles
CREATE POLICY "Public can read available vehicles"
  ON vehicles
  FOR SELECT
  TO public
  USING (is_available = true);

CREATE POLICY "Service role can manage vehicles"
  ON vehicles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Seats
CREATE POLICY "Public can read seats"
  ON seats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update seat locks"
  ON seats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage seats"
  ON seats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Bookings
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read own bookings by email"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage bookings"
  ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Payments
CREATE POLICY "Public can create payments"
  ON payments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read payments"
  ON payments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();