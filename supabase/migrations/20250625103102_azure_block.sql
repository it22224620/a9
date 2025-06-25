/*
  # Fix Payment Trigger Function and Seat Status

  1. Changes
    - Improve payment trigger function to properly update seat status
    - Add direct API endpoint to fix specific bookings
    - Fix any existing inconsistencies in the database
    - Add better error handling and logging

  2. Issues Fixed
    - Seats remain in "pending" status after successful payment
    - Booking status not properly synchronized with payment status
    - Missing travel date in seat booking records
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
    -- CRITICAL FIX: Force update ALL seats in the booking to 'booked' status
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      customer_email = booking_record.email,
      locked_at = NULL,
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

-- Create a function to manually fix a specific booking
CREATE OR REPLACE FUNCTION fix_booking_manually(booking_ref text)
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
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found: ' || booking_ref
    );
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
  IF payment_record.id IS NOT NULL AND payment_record.status != 'success' THEN
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
    locked_at = NULL,
    updated_at = now()
  WHERE id = ANY(booking_record.seat_ids);
  
  GET DIAGNOSTICS affected_seats = ROW_COUNT;
  
  -- Return result as JSON
  SELECT json_build_object(
    'success', true,
    'booking_id', booking_record.id,
    'booking_reference', booking_record.booking_reference,
    'old_status', booking_record.status,
    'new_status', 'confirmed',
    'seats_updated', affected_seats,
    'travel_date', booking_record.travel_date,
    'message', 'Booking fixed successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Fix all existing bookings with successful payments
DO $$
DECLARE
  booking_record RECORD;
  affected_seats INTEGER;
  total_fixed INTEGER := 0;
BEGIN
  -- Find all bookings with successful payments
  FOR booking_record IN 
    SELECT DISTINCT b.* 
    FROM bookings b
    JOIN payments p ON p.booking_id = b.id
    WHERE p.status = 'success'
    ORDER BY b.created_at DESC
  LOOP
    -- Update booking status to confirmed
    UPDATE bookings 
    SET 
      status = 'confirmed', 
      updated_at = now()
    WHERE id = booking_record.id AND status != 'confirmed';
    
    -- Book the seats
    UPDATE seats 
    SET 
      status = 'booked',
      booking_date = booking_record.travel_date,
      customer_email = booking_record.email,
      locked_at = NULL,
      updated_at = now()
    WHERE id = ANY(booking_record.seat_ids) AND status != 'booked';
    
    GET DIAGNOSTICS affected_seats = ROW_COUNT;
    
    IF affected_seats > 0 THEN
      total_fixed := total_fixed + 1;
      RAISE NOTICE 'Fixed booking %: Updated % seats', booking_record.booking_reference, affected_seats;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total bookings fixed: %', total_fixed;
END $$;

-- Specifically fix the booking from the screenshot
DO $$
DECLARE
  result json;
BEGIN
  -- Fix the specific booking from the screenshot
  SELECT fix_booking_manually('TRV-MCBT8Q4F-ECB77A3F') INTO result;
  RAISE NOTICE 'Fixed specific booking: %', result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error fixing specific booking: %', SQLERRM;
END $$;

-- Add comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes';
COMMENT ON FUNCTION fix_booking_manually(text) IS 'Manually fix a specific booking by reference';