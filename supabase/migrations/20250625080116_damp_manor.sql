/*
  # Add Date-Specific Seat Booking Support

  1. Schema Updates
    - Add `booking_date` column to seats table for date-specific bookings
    - Add `travel_date` column to bookings table with proper default
    - Update unique constraints for date-specific seat management
    - Add new indexes for performance

  2. Data Migration
    - Migrate existing data to new schema
    - Set proper booking dates for existing booked seats
    - Update booking status from 'pending' to 'confirmed' where payment succeeded

  3. Enhanced Functions
    - Add seat availability checking by date
    - Add booking status consistency view
    - Add payment status trigger for automatic booking confirmation
*/

-- Add booking_date column to seats table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seats' AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE seats ADD COLUMN booking_date date;
    
    -- Add comment for the new column
    COMMENT ON COLUMN seats.booking_date IS 'Date for which the seat is booked - allows same seat to be booked for different dates';
  END IF;
END $$;

-- Add travel_date column to bookings table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'travel_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN travel_date date NOT NULL DEFAULT CURRENT_DATE;
    
    -- Add comment for the new column
    COMMENT ON COLUMN bookings.travel_date IS 'Date when the customer will travel';
  END IF;
END $$;

-- Update booking status constraint to include 'confirmed'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled'));
END $$;

-- Create new unique constraint for seats (vehicle_id, seat_number, booking_date)
DO $$
BEGIN
  -- Drop old unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'seats' AND constraint_name = 'seats_vehicle_id_seat_number_key'
  ) THEN
    ALTER TABLE seats DROP CONSTRAINT seats_vehicle_id_seat_number_key;
  END IF;
  
  -- Add new unique constraint that includes booking_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'seats' AND constraint_name = 'seats_vehicle_seat_date_unique'
  ) THEN
    ALTER TABLE seats ADD CONSTRAINT seats_vehicle_seat_date_unique 
      UNIQUE (vehicle_id, seat_number, booking_date);
  END IF;
END $$;

-- Add new indexes for performance
CREATE INDEX IF NOT EXISTS idx_seats_booking_date ON seats(booking_date);
CREATE INDEX IF NOT EXISTS idx_seats_status_date ON seats(status, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON payments(booking_id, status);

-- Add table comments
COMMENT ON TABLE seats IS 'Vehicle seats with date-specific booking capability';
COMMENT ON TABLE bookings IS 'Customer bookings with travel date support';

-- Create function to get seat availability by date
CREATE OR REPLACE FUNCTION get_seat_availability_by_date(
  p_vehicle_id uuid,
  p_travel_date date
)
RETURNS TABLE (
  seat_id uuid,
  seat_number integer,
  status text,
  is_available_for_date boolean,
  booking_date date,
  customer_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as seat_id,
    s.seat_number,
    s.status,
    CASE 
      WHEN s.status = 'available' THEN true
      WHEN s.status = 'booked' AND (s.booking_date IS NULL OR s.booking_date != p_travel_date) THEN true
      ELSE false
    END as is_available_for_date,
    s.booking_date,
    s.customer_email
  FROM seats s
  WHERE s.vehicle_id = p_vehicle_id
  ORDER BY s.seat_number;
END;
$$ LANGUAGE plpgsql;

-- Create view for booking status consistency checking
CREATE OR REPLACE VIEW booking_status_check AS
SELECT 
  b.id as booking_id,
  b.booking_reference,
  b.status as booking_status,
  b.travel_date,
  p.status as payment_status,
  p.amount as payment_amount,
  b.total_amount as booking_amount,
  array_length(b.seat_ids, 1) as seat_count,
  (
    SELECT COUNT(*)
    FROM seats s 
    WHERE s.id = ANY(b.seat_ids) 
      AND s.status = 'booked' 
      AND s.booking_date = b.travel_date
  ) as booked_seats_count,
  CASE 
    WHEN b.status = 'confirmed' AND p.status = 'success' AND 
         (SELECT COUNT(*) FROM seats s WHERE s.id = ANY(b.seat_ids) AND s.status = 'booked' AND s.booking_date = b.travel_date) = array_length(b.seat_ids, 1)
    THEN 'consistent'
    WHEN b.status = 'pending' AND (p.status IS NULL OR p.status = 'pending')
    THEN 'pending_payment'
    WHEN b.status = 'cancelled' AND (p.status = 'failed' OR p.status IS NULL)
    THEN 'properly_cancelled'
    ELSE 'inconsistent'
  END as consistency_status
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
ORDER BY b.created_at DESC;

-- Create function to update booking status when payment status changes
CREATE OR REPLACE FUNCTION update_booking_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment becomes successful, confirm the booking and book the seats
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    -- Update booking status to confirmed
    UPDATE bookings 
    SET status = 'confirmed', updated_at = now()
    WHERE id = NEW.booking_id AND status = 'pending';
    
    -- Book the seats for the specific travel date
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = (SELECT travel_date FROM bookings WHERE id = NEW.booking_id),
      updated_at = now()
    WHERE id = ANY(
      SELECT seat_ids FROM bookings WHERE id = NEW.booking_id
    ) AND status = 'pending';
    
  -- If payment fails, cancel the booking and unlock seats
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Update booking status to cancelled
    UPDATE bookings 
    SET status = 'cancelled', updated_at = now()
    WHERE id = NEW.booking_id AND status = 'pending';
    
    -- Unlock the seats
    UPDATE seats 
    SET 
      status = 'available',
      locked_at = NULL,
      customer_email = NULL,
      booking_date = NULL,
      updated_at = now()
    WHERE id = ANY(
      SELECT seat_ids FROM bookings WHERE id = NEW.booking_id
    ) AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status updates (drop if exists first)
DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
CREATE TRIGGER payment_status_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_payment();

-- Migrate existing data: Set booking_date for seats that are already booked
UPDATE seats 
SET booking_date = (
  SELECT b.travel_date 
  FROM bookings b 
  WHERE seats.id = ANY(b.seat_ids) 
    AND b.status IN ('confirmed', 'pending')
  LIMIT 1
)
WHERE status = 'booked' AND booking_date IS NULL;

-- Fix existing bookings: Update status from 'pending' to 'confirmed' where payment succeeded
UPDATE bookings 
SET status = 'confirmed', updated_at = now()
WHERE status = 'pending' 
  AND id IN (
    SELECT DISTINCT p.booking_id 
    FROM payments p 
    WHERE p.status = 'success'
  );

-- Ensure seats are properly booked for confirmed bookings with successful payments
UPDATE seats 
SET 
  status = 'booked',
  booking_date = (
    SELECT b.travel_date 
    FROM bookings b 
    WHERE seats.id = ANY(b.seat_ids) 
      AND b.status = 'confirmed'
    LIMIT 1
  ),
  updated_at = now()
WHERE id IN (
  SELECT UNNEST(b.seat_ids)
  FROM bookings b
  JOIN payments p ON p.booking_id = b.id
  WHERE b.status = 'confirmed' AND p.status = 'success'
) AND status != 'booked';

-- Add function comment
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes';