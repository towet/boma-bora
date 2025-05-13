/*
  # Schema update for Boma Bora application

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (user_role enum: 'farmer' or 'agent')
      - `full_name` (text)
      - `phone_number` (text)
      - `location` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `collections`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, references profiles)
      - `agent_id` (uuid, references profiles)
      - `quantity` (decimal)
      - `price_per_liter` (decimal)
      - `total_amount` (decimal)
      - `collection_date` (timestamptz)
    - `schedules`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, references profiles)
      - `farmer_id` (uuid, references profiles)
      - `collection_date` (timestamptz)
      - `status` (text)
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `read` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum for user roles if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('farmer', 'agent');
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  collection_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  farmer_id UUID REFERENCES profiles(id) NOT NULL,
  collection_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Farmers can view own collections" ON collections;
  DROP POLICY IF EXISTS "Agents can view and create collections" ON collections;
  DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
  DROP POLICY IF EXISTS "Agents can create and update schedules" ON schedules;
  DROP POLICY IF EXISTS "Users can view own messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages" ON messages;
EXCEPTION 
  WHEN OTHERS THEN NULL;
END $$;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Farmers can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Agents can view and create collections"
  ON collections FOR ALL
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  USING (auth.uid() = farmer_id OR auth.uid() = agent_id);

CREATE POLICY "Agents can create and update schedules"
  ON schedules FOR ALL
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);