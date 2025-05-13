-- Complete Boma Bora Supabase Database Setup
-- Created: 2025-05-13

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for roles and status
CREATE TYPE user_role AS ENUM ('farmer', 'agent');
CREATE TYPE collection_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE message_type AS ENUM ('inquiry', 'response', 'announcement');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    phone_number TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    location TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) NOT NULL,
    agent_id UUID REFERENCES auth.users(id) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    quantity_liters DECIMAL(10,2),
    status collection_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table for direct communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    message_type message_type NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcements table for broadcast messages
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcement_recipients for tracking who has read announcements
CREATE TABLE IF NOT EXISTS announcement_recipients (
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (announcement_id, user_id)
);

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcement_recipients_updated_at
    BEFORE UPDATE ON announcement_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Policies for farmers table
CREATE POLICY "Agents can create farmers"
    ON farmers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can view farmers"
    ON farmers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can update their farmers"
    ON farmers FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can delete their farmers"
    ON farmers FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

-- Policies for collections table
CREATE POLICY "Agents can create collections"
    ON collections FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can view all collections"
    ON collections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Farmers can view their own collections"
    ON collections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM farmers
            WHERE farmers.id = farmer_id
            AND farmers.created_by IN (
                SELECT agent_id FROM collections
                WHERE farmer_id = farmers.id
            )
        )
    );

CREATE POLICY "Agents can update collections they created"
    ON collections FOR UPDATE
    TO authenticated
    USING (
        agent_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can delete collections they created"
    ON collections FOR DELETE
    TO authenticated
    USING (
        agent_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

-- Policies for messages
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own sent messages"
    ON messages FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid());

-- Policies for announcements
CREATE POLICY "Agents can create announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'agent'
        )
    );

CREATE POLICY "Users can view relevant announcements"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        -- Agents can see all announcements they created
        agent_id = auth.uid()
        OR
        -- Farmers can see announcements from their agents
        EXISTS (
            SELECT 1 FROM farmers
            WHERE farmers.created_by = announcements.agent_id
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'farmer'
            )
        )
    );

CREATE POLICY "Agents can update their announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (
        agent_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Agents can delete their announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (
        agent_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

-- Policies for announcement recipients
CREATE POLICY "Users can view their announcement read status"
    ON announcement_recipients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark announcements as read"
    ON announcement_recipients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their announcement read status"
    ON announcement_recipients FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Grant permissions to the authenticated role to use UUID functions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Insert function for profiles on user signup with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  full_name_val TEXT;
  role_val TEXT;
BEGIN
  -- Extract metadata with fallbacks to prevent null values
  full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'New User');
  role_val := COALESCE(new.raw_user_meta_data->>'role', 'farmer');
  
  -- Verify role is valid
  IF role_val NOT IN ('farmer', 'agent') THEN
    role_val := 'farmer'; -- Default to farmer if invalid
  END IF;

  -- Insert the profile record
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, full_name_val, role_val::user_role);
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error and still return new to prevent registration failure
  RAISE NOTICE 'Error in handle_new_user function: %', SQLERRM;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
