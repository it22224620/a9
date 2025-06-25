/*
  # Fix Seat Booking Issues

  1. Changes
    - Improve payment trigger function to properly update seat status
    - Add direct database function to fix bookings
    - Fix existing data inconsistencies
    - Add better error handling and logging

  2. Key Fixes
    - Ensure seats are properly marked as 'booked' after payment
    - Fix travel date handling for seat bookings
    - Add manual repair function for fixing specific bookings
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
DROP FUNCTION IF EXISTS update_booking_on_payment();
DROP FUNCTION IF EXISTS fix_booking_manually(text) CASCADE;

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

  -- Handle successful payment
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    -- Update booking status to confirmed
    UPDATE bookings 
    SET 
      status = 'confirmed', 
      updated_at = now()
    WHERE id = NEW.booking_id;
    
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
  
  -- Update payment status to success if it exists
  IF payment_record.id IS NOT NULL THEN
    UPDATE payments
    SET
      status = 'success',
      updated_at = now()
    WHERE id = payment_record.id AND status != 'success';
  ELSE
    -- Create a new payment if none exists
    INSERT INTO payments (
      booking_id, 
      amount, 
      currency, 
      status, 
      gateway, 
      gateway_response
    ) VALUES (
      booking_record.id,
      booking_record.total_amount,
      'LKR',
      'success',
      'payhere',
      jsonb_build_object(
        'manualFix', true,
        'fixedAt', now()
      )
    );
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
    END IF;
  END LOOP;
END $$;

-- Add comments
COMMENT ON FUNCTION update_booking_on_payment() IS 'Automatically updates booking and seat status when payment status changes';
COMMENT ON FUNCTION fix_booking_manually(text) IS 'Manually fix a specific booking by reference';