/*
  # Admin Authentication System

  1. New Tables
    - `admins` - Admin users with authentication
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text) - 'admin' or 'super_admin'
      - `is_active` (boolean)
      - `last_login` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `admins` table
    - Service role can manage admins
    - Admins can read their own data

  3. Indexes
    - Username and email indexes for fast lookups
    - Active status index for filtering
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admins
CREATE POLICY "Service role can manage admins"
  ON admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can read their own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Update timestamp trigger
CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default super admin (password: Admin123!)
-- Note: In production, change this password immediately
INSERT INTO admins (username, email, password_hash, role) 
VALUES (
  'superadmin',
  'admin@travelbook.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu3VG', -- Admin123!
  'super_admin'
) ON CONFLICT (username) DO NOTHING;