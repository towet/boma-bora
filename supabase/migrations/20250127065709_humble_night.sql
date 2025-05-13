/*
  # Update RLS policies for farmer management

  1. Changes
    - Add policy to allow agents to create farmer profiles
    - Add policy to allow agents to view all farmer profiles
    - Add policy to allow agents to update farmer profiles

  2. Security
    - Only agents can create and manage farmer profiles
    - Farmers can only view their own profiles
*/

-- Drop existing profile policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;

-- Create new profile policies
CREATE POLICY "Agents can create farmer profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Allow agents to view all profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
    OR
    -- Allow users to view their own profile
    auth.uid() = id
  );

CREATE POLICY "Agents can update farmer profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
    AND role = 'farmer'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
    AND role = 'farmer'
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);