-- Add phone_number and location to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update profiles policies to allow users to update their profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow agents to view farmer profiles for adding them
CREATE POLICY "Agents can view farmer profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'agent'
        )
        OR id = auth.uid()
    );
