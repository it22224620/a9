/*
  # Clean Database for Retesting

  1. Delete Operations
    - Remove all payment records
    - Remove all booking records
    - Reset all seats to available status

  2. Safety
    - Uses proper transaction handling
    - Maintains referential integrity
    - Logs operations for visibility
*/

-- Clean up all booking-related data for retesting
DO $$
DECLARE
  payment_count INTEGER;
  booking_count INTEGER;
  seat_count INTEGER;
BEGIN
  -- Get counts before deletion for logging
  SELECT COUNT(*) INTO payment_count FROM payments;
  SELECT COUNT(*) INTO booking_count FROM bookings;
  SELECT COUNT(*) INTO seat_count FROM seats WHERE status != 'available';

  -- Delete all payment records first (they reference bookings)
  DELETE FROM payments;
  RAISE NOTICE 'Deleted % payment records', payment_count;

  -- Delete all booking records
  DELETE FROM bookings;
  RAISE NOTICE 'Deleted % booking records', booking_count;

  -- Reset all seats to available status
  UPDATE seats 
  SET 
    status = 'available',
    locked_at = NULL,
    customer_email = NULL,
    booking_date = NULL,
    updated_at = now();

  RAISE NOTICE 'Reset % seats to available status', seat_count;
  RAISE NOTICE 'Database cleaned successfully for retesting';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error during cleanup: %', SQLERRM;
END $$;

-- Verify the cleanup was successful
DO $$
DECLARE
  remaining_payments INTEGER;
  remaining_bookings INTEGER;
  non_available_seats INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_payments FROM payments;
  SELECT COUNT(*) INTO remaining_bookings FROM bookings;
  SELECT COUNT(*) INTO non_available_seats FROM seats WHERE status != 'available';

  IF remaining_payments > 0 OR remaining_bookings > 0 OR non_available_seats > 0 THEN
    RAISE WARNING 'Cleanup verification failed: % payments, % bookings, % non-available seats remain', 
      remaining_payments, remaining_bookings, non_available_seats;
  ELSE
    RAISE NOTICE 'Cleanup verification successful: All data cleared';
  END IF;
END $$;