-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('farmer', 'agent')) NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    quantity_liters DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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

-- Policies for collections table
CREATE POLICY "Agents can create collections"
    ON collections FOR INSERT
    TO authenticated
    WITH CHECK (
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
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'farmer'
            AND farmer_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update collections they created"
    ON collections FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

-- Insert function for profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
