/*
  # Fix Payment Status Trigger and Booking Status

  1. Improvements
    - Completely rewrite the payment status trigger for better reliability
    - Add direct function to fix specific bookings
    - Fix existing pending bookings with successful payments
    - Add better logging for debugging payment issues

  2. Changes
    - Replace the existing trigger with a more robust version
    - Add manual fix function for specific bookings
    - Fix data consistency issues in existing bookings
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
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE id = NEW.booking_id;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Booking not found for payment ID: %', NEW.id;
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
    WHERE id = NEW.booking_id;
    
    -- Book the seats for the specific travel date
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
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER payment_status_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_payment();

-- Add function to manually fix a specific booking
CREATE OR REPLACE FUNCTION fix_booking(booking_ref text)
RETURNS RECORD AS $$
DECLARE
  booking_record RECORD;
  payment_record RECORD;
  affected_seats INTEGER;
  result RECORD;
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
  
  SELECT 
    booking_record.id as booking_id,
    booking_record.booking_reference as reference,
    booking_record.travel_date as travel_date,
    affected_seats as seats_updated,
    'confirmed' as new_status
  INTO result;
  
  RETURN result;
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
    WHERE b.status = 'pending' AND p.status = 'success'
  LOOP
    -- Update booking status
    UPDATE bookings 
    SET 
      status = 'confirmed', 
      updated_at = now()
    WHERE id = booking_record.id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
      RAISE NOTICE 'Fixed booking status for %', booking_record.booking_reference;
      
      -- Book the seats
      UPDATE seats 
      SET 
        status = 'booked',
        booking_date = booking_record.travel_date,
        customer_email = booking_record.email,
        updated_at = now()
      WHERE id = ANY(booking_record.seat_ids);
      
      GET DIAGNOSTICS affected_seats = ROW_COUNT;
      RAISE NOTICE 'Booked % seats for booking %', affected_seats, booking_record.booking_reference;
    END IF;
  END LOOP;
END $$;

-- Add comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes with improved error handling';
COMMENT ON FUNCTION fix_booking(text) IS 'Manually fix a specific booking by reference';