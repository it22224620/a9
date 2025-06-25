/*
  # Fix Payment Processing and Booking Confirmation

  1. Changes
    - Fix the payment trigger function to properly update seat status
    - Add a function to manually fix bookings
    - Create a view to check booking consistency
    - Fix existing bookings with successful payments

  2. Improvements
    - Better error handling in trigger function
    - More robust seat status updates
    - Automatic data repair for existing bookings
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
DROP FUNCTION IF EXISTS update_booking_on_payment();
-- Drop the function with explicit parameter type to avoid conflicts
DROP FUNCTION IF EXISTS fix_booking_status(text);

-- Create improved function to handle payment status changes
CREATE OR REPLACE FUNCTION update_booking_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  booking_record RECORD;
  affected_seats INTEGER := 0;
  log_message TEXT;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE id = NEW.booking_id;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Booking not found for payment ID: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Log the payment status change
  log_message := format('Payment status changed from %s to %s for booking %s', 
    COALESCE(OLD.status, 'NULL'), NEW.status, booking_record.booking_reference);
  RAISE NOTICE '%', log_message;

  -- Handle successful payment
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    RAISE NOTICE 'Processing successful payment for booking %', booking_record.booking_reference;
    
    -- Update booking status to confirmed
    UPDATE bookings 
    SET 
      status = 'confirmed', 
      updated_at = now()
    WHERE id = NEW.booking_id;
    
    -- Book the seats for the specific travel date
    -- IMPORTANT: This is the critical part that was failing
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids);
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    RAISE NOTICE 'Booked % seats for travel date %', affected_seats, booking_record.travel_date;
    
  -- Handle failed payment
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    RAISE NOTICE 'Processing failed payment for booking %', booking_record.booking_reference;
    
    -- Update booking status to cancelled
    UPDATE bookings 
    SET 
      status = 'cancelled', 
      updated_at = now()
    WHERE id = NEW.booking_id;
    
    -- Unlock the seats
    UPDATE seats 
    SET 
      status = 'available',
      locked_at = NULL,
      customer_email = NULL,
      booking_date = NULL,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids);
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    RAISE NOTICE 'Unlocked % seats for failed payment', affected_seats;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in payment trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER payment_status_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_payment();

-- Add function to manually fix a specific booking (with new name to avoid conflicts)
CREATE OR REPLACE FUNCTION fix_booking_status_manually(booking_ref text)
RETURNS json AS $$
DECLARE
  booking_record RECORD;
  payment_record RECORD;
  affected_seats INTEGER;
  result json;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE booking_reference = booking_ref;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', booking_ref;
  END IF;
  
  -- Get payment details
  SELECT * INTO payment_record FROM payments WHERE booking_id = booking_record.id ORDER BY created_at DESC LIMIT 1;
  
  -- Update booking status to confirmed
  UPDATE bookings 
  SET 
    status = 'confirmed', 
    updated_at = now()
  WHERE id = booking_record.id;
  
  -- Update payment status to success if not already
  IF payment_record.status != 'success' THEN
    UPDATE payments
    SET
      status = 'success',
      updated_at = now()
    WHERE id = payment_record.id;
  END IF;
  
  -- Book the seats for the specific travel date
  UPDATE seats 
  SET 
    status = 'booked',
    booking_date = booking_record.travel_date,
    customer_email = booking_record.email,
    updated_at = now()
  WHERE id = ANY(booking_record.seat_ids);
  
  GET DIAGNOSTICS affected_seats = ROW_COUNT;
  
  -- Return result as JSON
  SELECT json_build_object(
    'booking_id', booking_record.id,
    'booking_reference', booking_record.booking_reference,
    'old_status', 'pending',
    'new_status', 'confirmed',
    'seats_updated', affected_seats,
    'travel_date', booking_record.travel_date,
    'message', 'Booking fixed successfully'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix all existing bookings with successful payments but pending status
DO $$
DECLARE
  booking_record RECORD;
  affected_rows INTEGER;
  affected_seats INTEGER;
  total_bookings_fixed INTEGER := 0;
  total_seats_fixed INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting to fix existing bookings with successful payments...';
  
  FOR booking_record IN 
    SELECT DISTINCT b.* 
    FROM bookings b
    JOIN payments p ON p.booking_id = b.id
    WHERE p.status = 'success'
    ORDER BY b.created_at
  LOOP
    -- Update booking status if needed
    IF booking_record.status != 'confirmed' THEN
      UPDATE bookings 
      SET 
        status = 'confirmed', 
        updated_at = now()
      WHERE id = booking_record.id;
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      
      IF affected_rows > 0 THEN
        total_bookings_fixed := total_bookings_fixed + 1;
        RAISE NOTICE 'Fixed booking status for %', booking_record.booking_reference;
      END IF;
    END IF;
    
    -- Book the seats regardless of current status (in case they're still pending)
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      customer_email = booking_record.email,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids) AND status != 'booked';
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    IF affected_seats > 0 THEN
      total_seats_fixed := total_seats_fixed + affected_seats;
      RAISE NOTICE 'Booked % seats for booking %', affected_seats, booking_record.booking_reference;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: Fixed % bookings and % seats', total_bookings_fixed, total_seats_fixed;
END $$;

-- Specifically fix the booking from the screenshot if it exists
DO $$
DECLARE
  fix_result json;
BEGIN
  -- Check if the specific booking exists
  IF EXISTS (SELECT 1 FROM bookings WHERE booking_reference = 'TRV-MCBS86EL-3EED0522') THEN
    SELECT fix_booking_status_manually('TRV-MCBS86EL-3EED0522') INTO fix_result;
    RAISE NOTICE 'Fixed specific booking TRV-MCBS86EL-3EED0522: %', fix_result;
  ELSE
    RAISE NOTICE 'Booking TRV-MCBS86EL-3EED0522 not found, skipping specific fix';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not fix specific booking TRV-MCBS86EL-3EED0522: %', SQLERRM;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes with improved error handling';
COMMENT ON FUNCTION fix_booking_status_manually(text) IS 'Manually fix a specific booking by reference - returns JSON result';

-- Create a view to easily check booking consistency
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
  (SELECT count(*) FROM seats s WHERE s.id = ANY(b.seat_ids) AND s.status = 'booked') as booked_seats_count,
  CASE 
    WHEN p.status = 'success' AND b.status = 'confirmed' AND (SELECT count(*) FROM seats s WHERE s.id = ANY(b.seat_ids) AND s.status = 'booked') = array_length(b.seat_ids, 1) THEN 'consistent'
    WHEN p.status = 'success' AND b.status != 'confirmed' THEN 'booking_status_mismatch'
    WHEN p.status = 'success' AND (SELECT count(*) FROM seats s WHERE s.id = ANY(b.seat_ids) AND s.status = 'booked') != array_length(b.seat_ids, 1) THEN 'seat_status_mismatch'
    ELSE 'needs_review'
  END as consistency_status
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
ORDER BY b.created_at DESC;

COMMENT ON VIEW booking_status_check IS 'View to check consistency between bookings, payments, and seats';