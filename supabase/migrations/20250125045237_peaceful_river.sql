/*
  # Add profile creation policy

  1. Security Changes
    - Add RLS policy to allow users to create their own profile
    - Policy ensures users can only create a profile with their own auth.uid()
*/

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);