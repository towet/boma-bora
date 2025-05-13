/*
  # Update profiles table phone_number constraint

  1. Changes
    - Make phone_number column nullable in profiles table
  
  2. Security
    - No changes to RLS policies
*/

DO $$ 
BEGIN 
  ALTER TABLE profiles 
    ALTER COLUMN phone_number DROP NOT NULL;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;