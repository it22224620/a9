-- Drop all existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_seat_availability_by_date(uuid, date);
DROP FUNCTION IF EXISTS get_available_seats_for_date(uuid, date);
DROP FUNCTION IF EXISTS cleanup_expired_seat_locks();

-- Drop existing view if it exists
DROP VIEW IF EXISTS seat_availability;

-- Create improved function to get seat availability by date
CREATE OR REPLACE FUNCTION get_seat_availability_by_date(
  p_vehicle_id uuid,
  p_travel_date date DEFAULT NULL
)
RETURNS TABLE (
  seat_id uuid,
  seat_number integer,
  status text,
  is_available_for_date boolean,
  booking_date date,
  customer_email text,
  locked_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as seat_id,
    s.seat_number,
    s.status,
    CASE 
      -- Seat is available if:
      -- 1. Status is 'available' (not booked for any date)
      -- 2. Status is 'booked' but for a different date than requested
      -- 3. Status is 'pending' but lock has expired
      WHEN s.status = 'available' THEN true
      WHEN s.status = 'booked' AND (s.booking_date IS NULL OR s.booking_date != p_travel_date) THEN true
      WHEN s.status = 'pending' AND s.locked_at < (now() - interval '10 minutes') THEN true
      ELSE false
    END as is_available_for_date,
    s.booking_date,
    s.customer_email,
    s.locked_at
  FROM seats s
  WHERE s.vehicle_id = p_vehicle_id
  ORDER BY s.seat_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available seats for a specific date
CREATE FUNCTION get_available_seats_for_date(
  p_vehicle_id uuid,
  p_travel_date date
)
RETURNS TABLE (
  seat_id uuid,
  seat_number integer,
  vehicle_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as seat_id,
    s.seat_number,
    s.vehicle_id
  FROM seats s
  WHERE s.vehicle_id = p_vehicle_id
    AND (
      -- Seat is available (not booked for any date)
      s.status = 'available'
      OR 
      -- Seat is booked but for a different date
      (s.status = 'booked' AND (s.booking_date IS NULL OR s.booking_date != p_travel_date))
      OR
      -- Seat is pending but lock has expired
      (s.status = 'pending' AND s.locked_at < (now() - interval '10 minutes'))
    )
  ORDER BY s.seat_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired seat locks
CREATE FUNCTION cleanup_expired_seat_locks()
RETURNS TABLE (
  unlocked_count integer
) AS $$
DECLARE
  affected_rows integer;
BEGIN
  -- Unlock seats that have been pending for more than 10 minutes
  UPDATE seats 
  SET 
    status = 'available',
    locked_at = NULL,
    customer_email = NULL,
    booking_date = NULL,
    updated_at = now()
  WHERE status = 'pending' 
    AND locked_at < (now() - interval '10 minutes');
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Update the seat availability view to be more comprehensive
CREATE VIEW seat_availability AS
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
JOIN vehicles v ON v.id = s.vehicle_id
JOIN routes r ON r.id = v.route_id
ORDER BY v.name, s.seat_number;

-- Add comments to functions
COMMENT ON FUNCTION get_seat_availability_by_date(uuid, date) IS 'Get seat availability for a specific vehicle and travel date';
COMMENT ON FUNCTION get_available_seats_for_date(uuid, date) IS 'Get only available seats for a specific vehicle and travel date';
COMMENT ON FUNCTION cleanup_expired_seat_locks() IS 'Clean up expired seat locks and return count of unlocked seats';

-- Fix any existing data inconsistencies
-- Reset seats that are marked as booked but don't have a booking_date
UPDATE seats 
SET 
  status = 'available',
  booking_date = NULL,
  customer_email = NULL,
  locked_at = NULL,
  updated_at = now()
WHERE status = 'booked' AND booking_date IS NULL;

-- Clean up any expired locks
SELECT cleanup_expired_seat_locks();

-- Add indexes for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_seats_vehicle_date_status ON seats(vehicle_id, booking_date, status);
CREATE INDEX IF NOT EXISTS idx_seats_status_locked ON seats(status, locked_at) WHERE status = 'pending';

-- Add index for the new date-specific queries
CREATE INDEX IF NOT EXISTS idx_seats_status_date ON seats(status, booking_date);