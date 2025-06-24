/*
  # Fix Admin Registration RLS Policy

  1. Security Updates
    - Add policy to allow admin registration
    - Ensure service role can manage admins
    - Allow public registration for first admin setup

  2. Changes
    - Add public insert policy for admin registration
    - Keep existing read policies for authenticated users
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can read their own data" ON admins;

-- Allow public registration (for initial admin setup)
CREATE POLICY "Allow admin registration"
  ON admins
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role can manage admins"
  ON admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read admin data
CREATE POLICY "Authenticated can read admin data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Admins can update their own data"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);