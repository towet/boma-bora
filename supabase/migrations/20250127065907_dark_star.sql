/*
  # Fix RLS policies to prevent recursion

  1. Changes
    - Simplify policies to avoid recursive checks
    - Use auth.jwt() to check user role instead of querying profiles table
    - Maintain security while preventing infinite recursion

  2. Security
    - Agents can still manage farmer profiles
    - Users can view their own profiles
    - No recursive table queries in policies
*/

-- Drop existing profile policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
  DROP POLICY IF EXISTS "Agents can create farmer profiles" ON profiles;
  DROP POLICY IF EXISTS "Agents can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Agents can update farmer profiles" ON profiles;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;

-- Create new profile policies
CREATE POLICY "Allow users to view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow agents to view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'agent'
  );

CREATE POLICY "Allow agents to create farmer profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'agent'
    AND role = 'farmer'
  );

CREATE POLICY "Allow agents to update farmer profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'agent'
    AND role = 'farmer'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'agent'
    AND role = 'farmer'
  );

-- Update auth.users to include role in JWT
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, location)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'farmer'),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'location', '')
  );
  
  -- Update user's JWT claims to include role
  new.raw_app_meta_data := 
    coalesce(new.raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', COALESCE((new.raw_user_meta_data->>'role')::text, 'farmer'))::jsonb;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is created
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;