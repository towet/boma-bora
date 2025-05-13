-- Complete Boma Bora Supabase Database Setup (Final Version)
-- Created: 2025-05-13

-- ===============================
-- BASIC SETUP
-- ===============================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- SCHEMA SETUP
-- ===============================

-- Create custom types for roles and status
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS collection_status CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;

CREATE TYPE user_role AS ENUM ('farmer', 'agent');
CREATE TYPE collection_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE message_type AS ENUM ('inquiry', 'response', 'announcement');

-- ===============================
-- TABLES SETUP
-- ===============================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'farmer',
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
    location TEXT DEFAULT 'Unknown Location',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID NOT NULL,
    agent_id UUID NOT NULL,
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
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    message_type message_type NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcements table for broadcast messages
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcement_recipients for tracking who has read announcements
CREATE TABLE IF NOT EXISTS announcement_recipients (
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (announcement_id, user_id)
);

-- ===============================
-- FUNCTION SETUP
-- ===============================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===============================
-- TRIGGER SETUP
-- ===============================

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

-- ===============================
-- RLS SETUP
-- ===============================

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- ===============================
-- POLICIES SETUP
-- ===============================

-- Policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Policies for farmers table
CREATE POLICY "Farmers are viewable by everyone"
    ON farmers FOR SELECT
    USING (true);

CREATE POLICY "Any user can create farmers"
    ON farmers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Any user can update farmers"
    ON farmers FOR UPDATE
    USING (true);

CREATE POLICY "Any user can delete farmers"
    ON farmers FOR DELETE
    USING (true);

-- Policies for collections table
CREATE POLICY "Collections are viewable by everyone"
    ON collections FOR SELECT
    USING (true);

CREATE POLICY "Any user can create collections"
    ON collections FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Any user can update collections"
    ON collections FOR UPDATE
    USING (true);

CREATE POLICY "Any user can delete collections"
    ON collections FOR DELETE
    USING (true);

-- Policies for messages
CREATE POLICY "Messages are viewable by everyone"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Any user can send messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Any user can update messages"
    ON messages FOR UPDATE
    USING (true);

-- Policies for announcements
CREATE POLICY "Announcements are viewable by everyone"
    ON announcements FOR SELECT
    USING (true);

CREATE POLICY "Any user can create announcements"
    ON announcements FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Any user can update announcements"
    ON announcements FOR UPDATE
    USING (true);

CREATE POLICY "Any user can delete announcements"
    ON announcements FOR DELETE
    USING (true);

-- Policies for announcement recipients
CREATE POLICY "Announcement recipients are viewable by everyone"
    ON announcement_recipients FOR SELECT
    USING (true);

CREATE POLICY "Any user can mark announcements as read"
    ON announcement_recipients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Any user can update announcement read status"
    ON announcement_recipients FOR UPDATE
    USING (true);

-- ===============================
-- PERMISSIONS SETUP
-- ===============================

-- Grant permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on individual types
GRANT USAGE ON TYPE user_role TO anon, authenticated, service_role;
GRANT USAGE ON TYPE collection_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE message_type TO anon, authenticated, service_role;

-- ===============================
-- USER MANAGEMENT SETUP
-- ===============================

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a row into public.profiles
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    (CASE 
      WHEN new.raw_user_meta_data->>'role' = 'agent' THEN 'agent'::user_role
      ELSE 'farmer'::user_role
    END)
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
