/*
  # Travel Booking System - Add Travel Date Support

  1. Schema Updates
    - Add `travel_date` field to bookings table
    - Add `booking_date` field to seats table for date-specific reservations
    - Update unique constraints for seats to include booking_date
    - Add indexes for better performance with date queries

  2. Changes Made
    - Bookings now support travel dates
    - Seats can be booked for specific dates
    - Enhanced indexing for date-based queries
    - Maintains backward compatibility

  3. Notes
    - Uses ALTER TABLE to modify existing tables
    - Handles existing triggers and constraints gracefully
    - Preserves all existing data and functionality
*/

-- Add travel_date to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'travel_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN travel_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add booking_date to seats table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seats' AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE seats ADD COLUMN booking_date date;
  END IF;
END $$;

-- Drop existing unique constraint on seats if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'seats' 
    AND constraint_name = 'seats_vehicle_id_seat_number_key'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE seats DROP CONSTRAINT seats_vehicle_id_seat_number_key;
  END IF;
END $$;

-- Create new unique constraint including booking_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'seats' 
    AND constraint_name = 'seats_vehicle_seat_date_unique'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE seats ADD CONSTRAINT seats_vehicle_seat_date_unique 
    UNIQUE(vehicle_id, seat_number, booking_date);
  END IF;
END $$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_seats_booking_date ON seats(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);

-- Update the seats table to allow multiple bookings for different dates
-- This ensures seats can be booked for different travel dates
COMMENT ON COLUMN seats.booking_date IS 'Date for which the seat is booked - allows same seat to be booked for different dates';
COMMENT ON COLUMN bookings.travel_date IS 'Date when the customer will travel';

-- Create or replace function to handle seat availability by date
CREATE OR REPLACE FUNCTION get_available_seats_for_date(
  p_vehicle_id uuid,
  p_travel_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  seat_id uuid,
  seat_number integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as seat_id,
    s.seat_number,
    CASE 
      WHEN s.booking_date IS NULL OR s.booking_date != p_travel_date THEN 'available'
      ELSE s.status
    END as status
  FROM seats s
  WHERE s.vehicle_id = p_vehicle_id
  ORDER BY s.seat_number;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to check seat conflicts
CREATE OR REPLACE FUNCTION check_seat_date_conflict(
  p_seat_ids uuid[],
  p_travel_date date
)
RETURNS boolean AS $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM seats
  WHERE id = ANY(p_seat_ids)
    AND booking_date = p_travel_date
    AND status IN ('pending', 'booked');
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments for documentation
COMMENT ON TABLE bookings IS 'Customer bookings with travel date support';
COMMENT ON TABLE seats IS 'Vehicle seats with date-specific booking capability';

-- Ensure RLS policies are properly set (idempotent)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'bookings' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'seats' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Update any existing bookings without travel_date to have today's date
UPDATE bookings 
SET travel_date = CURRENT_DATE 
WHERE travel_date IS NULL;

-- Create a view for easy seat availability checking
CREATE OR REPLACE VIEW seat_availability AS
SELECT 
  s.id,
  s.vehicle_id,
  s.seat_number,
  s.status,
  s.booking_date,
  s.customer_email,
  s.locked_at,
  v.name as vehicle_name,
  v.type as vehicle_type,
  r.origin_city,
  r.destination_city
FROM seats s
JOIN vehicles v ON s.vehicle_id = v.id
JOIN routes r ON v.route_id = r.id
WHERE v.is_available = true AND r.is_active = true;

-- Grant access to the view
GRANT SELECT ON seat_availability TO public;
GRANT ALL ON seat_availability TO service_role;