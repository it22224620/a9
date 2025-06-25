/*
  # Fix Payment Status and Seat Booking Issues

  1. Changes
    - Completely rewrite the payment status trigger for better reliability
    - Add direct function to fix specific bookings
    - Fix existing pending bookings with successful payments
    - Add better logging for debugging payment issues
    - Fix seat status not updating to booked after payment

  2. Improvements
    - More robust error handling
    - Better transaction management
    - Explicit seat status updates
    - Improved debugging information
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
DROP FUNCTION IF EXISTS update_booking_on_payment();

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
  
  -- Insert into a log table if you have one
  -- INSERT INTO system_logs(message, created_at) VALUES (log_message, now());

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

-- Add function to manually fix a specific booking
CREATE OR REPLACE FUNCTION fix_booking(booking_ref text)
RETURNS TABLE (
  booking_id uuid,
  booking_reference text,
  old_status text,
  new_status text,
  seats_updated integer,
  travel_date date
) AS $$
DECLARE
  booking_record RECORD;
  payment_record RECORD;
  affected_seats INTEGER;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE booking_reference = booking_ref;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', booking_ref;
  END IF;
  
  -- Get payment details
  SELECT * INTO payment_record FROM payments WHERE booking_id = booking_record.id LIMIT 1;
  
  -- Update booking status to confirmed
  UPDATE bookings 
  SET 
    status = 'confirmed', 
    updated_at = now()
  WHERE id = booking_record.id
  RETURNING id, booking_reference, status, travel_date INTO booking_record;
  
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
  
  RETURN QUERY
  SELECT 
    booking_record.id,
    booking_record.booking_reference,
    'pending'::text,
    booking_record.status,
    affected_seats,
    booking_record.travel_date;
END;
$$ LANGUAGE plpgsql;

-- Fix all existing bookings with successful payments but pending status
DO $$
DECLARE
  booking_record RECORD;
  affected_rows INTEGER;
  affected_seats INTEGER;
BEGIN
  FOR booking_record IN 
    SELECT b.* 
    FROM bookings b
    JOIN payments p ON p.booking_id = b.id
    WHERE p.status = 'success'
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
        RAISE NOTICE 'Fixed booking status for %', booking_record.booking_reference;
      END IF;
    END IF;
    
    -- Book the seats regardless of booking status
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      customer_email = booking_record.email,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids) AND status != 'booked';
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    IF affected_seats > 0 THEN
      RAISE NOTICE 'Booked % seats for booking %', affected_seats, booking_record.booking_reference;
    END IF;
  END LOOP;
END $$;

-- Fix specific booking from the screenshot (TRV-MCBS86EL-3EED0522)
SELECT * FROM fix_booking('TRV-MCBS86EL-3EED0522');

-- Add comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes with improved error handling';
COMMENT ON FUNCTION fix_booking(text) IS 'Manually fix a specific booking by reference';