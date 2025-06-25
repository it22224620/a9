/*
  # Clean Slate Migration

  1. Purpose
    - Delete all booking and seat data for retesting
    - Reset all seats to available status
    - Remove all payment records
    - Preserve vehicle and route configuration

  2. Operations
    - Delete all payment records
    - Delete all booking records
    - Reset all seats to available status
*/

-- Start a transaction to ensure all operations succeed or fail together
BEGIN;

-- First, delete all payment records (they reference bookings)
DELETE FROM payments;
RAISE NOTICE 'Deleted all payment records';

-- Next, delete all booking records
DELETE FROM bookings;
RAISE NOTICE 'Deleted all booking records';

-- Finally, reset all seats to available status
UPDATE seats 
SET 
  status = 'available',
  locked_at = NULL,
  customer_email = NULL,
  booking_date = NULL,
  updated_at = now();

RAISE NOTICE 'Reset all seats to available status';

-- Commit the transaction
COMMIT;

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Database cleaned successfully for retesting';
END $$;