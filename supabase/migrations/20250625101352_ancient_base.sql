-- Create a new migration to fix payment processing issues

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
DROP FUNCTION IF EXISTS update_booking_on_payment();

-- Create improved function to handle payment status changes
CREATE OR REPLACE FUNCTION update_booking_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  booking_record RECORD;
  seat_record RECORD;
  affected_seats INTEGER := 0;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE id = NEW.booking_id;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Booking not found for payment ID: %', NEW.booking_id;
    RETURN NEW;
  END IF;

  -- Log the payment status change
  RAISE NOTICE 'Payment status changed from % to % for booking %', 
    COALESCE(OLD.status, 'NULL'), NEW.status, booking_record.booking_reference;

  -- Handle successful payment
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    RAISE NOTICE 'Processing successful payment for booking %', booking_record.booking_reference;
    
    -- Update booking status to confirmed
    UPDATE bookings 
    SET 
      status = 'confirmed', 
      updated_at = now()
    WHERE id = NEW.booking_id AND status = 'pending';
    
    IF FOUND THEN
      RAISE NOTICE 'Booking % confirmed successfully', booking_record.booking_reference;
    ELSE
      RAISE WARNING 'Failed to confirm booking % (current status: %)', 
        booking_record.booking_reference, booking_record.status;
    END IF;
    
    -- Book the seats for the specific travel date
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids) 
      AND status = 'pending'
      AND customer_email = booking_record.email;
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    
    IF affected_seats > 0 THEN
      RAISE NOTICE 'Successfully booked % seats for travel date %', 
        affected_seats, booking_record.travel_date;
    ELSE
      RAISE WARNING 'No seats were booked for booking %', booking_record.booking_reference;
      
      -- Try to book seats even if they're not in pending status (fallback)
      UPDATE seats 
      SET 
        status = 'booked',
        booking_date = booking_record.travel_date,
        customer_email = booking_record.email,
        updated_at = now()
      WHERE id = ANY(booking_record.seat_ids);
      
      GET DIAGNOSTICS affected_seats = ROW_COUNT;
      RAISE NOTICE 'Fallback booking: % seats updated', affected_seats;
    END IF;
    
  -- Handle failed payment
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    RAISE NOTICE 'Processing failed payment for booking %', booking_record.booking_reference;
    
    -- Update booking status to cancelled
    UPDATE bookings 
    SET 
      status = 'cancelled', 
      updated_at = now()
    WHERE id = NEW.booking_id AND status = 'pending';
    
    -- Unlock the seats
    UPDATE seats 
    SET 
      status = 'available',
      locked_at = NULL,
      customer_email = NULL,
      booking_date = NULL,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids) 
      AND (status = 'pending' OR customer_email = booking_record.email);
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    RAISE NOTICE 'Unlocked % seats for failed payment', affected_seats;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER payment_status_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_payment();

-- Fix existing data: Find bookings with successful payments but still pending status
DO $$
DECLARE
  booking_record RECORD;
  affected_seats INTEGER;
BEGIN
  -- Process each pending booking with successful payment
  FOR booking_record IN 
    SELECT b.*, p.status as payment_status
    FROM bookings b
    JOIN payments p ON p.booking_id = b.id
    WHERE b.status = 'pending' AND p.status = 'success'
  LOOP
    RAISE NOTICE 'Fixing booking %: % -> confirmed', 
      booking_record.booking_reference, booking_record.status;
    
    -- Update booking status
    UPDATE bookings 
    SET 
      status = 'confirmed',
      updated_at = now()
    WHERE id = booking_record.id;
    
    -- Book the seats
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids);
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    RAISE NOTICE 'Fixed % seats for booking %', affected_seats, booking_record.booking_reference;
  END LOOP;
END $$;

-- Add function to manually fix booking and seat status
CREATE OR REPLACE FUNCTION fix_booking_status(p_booking_reference text)
RETURNS TABLE (
  booking_id uuid,
  old_status text,
  new_status text,
  seats_updated integer
) AS $$
DECLARE
  booking_record RECORD;
  payment_record RECORD;
  affected_seats INTEGER := 0;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE booking_reference = p_booking_reference;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_reference;
  END IF;
  
  -- Get payment details
  SELECT * INTO payment_record FROM payments WHERE booking_id = booking_record.id ORDER BY created_at DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found for booking: %', p_booking_reference;
  END IF;
  
  -- If payment is successful but booking is pending, fix it
  IF payment_record.status = 'success' AND booking_record.status = 'pending' THEN
    -- Update booking
    UPDATE bookings 
    SET 
      status = 'confirmed',
      updated_at = now()
    WHERE id = booking_record.id;
    
    -- Book seats
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      customer_email = booking_record.email,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids);
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    
    RETURN QUERY SELECT 
      booking_record.id,
      booking_record.status,
      'confirmed'::text,
      affected_seats;
  ELSE
    RETURN QUERY SELECT 
      booking_record.id,
      booking_record.status,
      booking_record.status,
      0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add function to check booking consistency
CREATE OR REPLACE FUNCTION check_booking_consistency()
RETURNS TABLE (
  booking_reference text,
  booking_status text,
  payment_status text,
  seats_booked integer,
  seats_expected integer,
  is_consistent boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.booking_reference,
    b.status as booking_status,
    p.status as payment_status,
    (
      SELECT COUNT(*)::integer
      FROM seats s 
      WHERE s.id = ANY(b.seat_ids) 
        AND s.status = 'booked' 
        AND s.booking_date = b.travel_date
    ) as seats_booked,
    array_length(b.seat_ids, 1) as seats_expected,
    CASE 
      WHEN b.status = 'confirmed' AND p.status = 'success' AND 
           (SELECT COUNT(*) FROM seats s WHERE s.id = ANY(b.seat_ids) AND s.status = 'booked' AND s.booking_date = b.travel_date) = array_length(b.seat_ids, 1)
      THEN true
      ELSE false
    END as is_consistent
  FROM bookings b
  LEFT JOIN payments p ON p.booking_id = b.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes with improved error handling';
COMMENT ON FUNCTION fix_booking_status(text) IS 'Manually fix booking and seat status for a specific booking reference';
COMMENT ON FUNCTION check_booking_consistency() IS 'Check consistency between bookings, payments, and seats';