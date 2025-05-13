-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for roles and status
CREATE TYPE user_role AS ENUM ('farmer', 'agent');
CREATE TYPE collection_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE message_type AS ENUM ('inquiry', 'response', 'announcement');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone_number VARCHAR(20),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    location TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    quantity_liters DECIMAL(10,2),
    status collection_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    receiver_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    message_type message_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create announcement_recipients table
CREATE TABLE IF NOT EXISTS announcement_recipients (
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
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

-- Create indexes for better query performance
CREATE INDEX idx_farmers_created_by ON farmers(created_by);
CREATE INDEX idx_collections_farmer_id ON collections(farmer_id);
CREATE INDEX idx_collections_agent_id ON collections(agent_id);
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_announcements_agent_id ON announcements(agent_id);
CREATE INDEX idx_announcement_recipients_user_id ON announcement_recipients(user_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Farmers policies
CREATE POLICY "Agents can create farmers"
    ON farmers FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'agent'
    ));

CREATE POLICY "Agents can view their created farmers"
    ON farmers FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

-- Collections policies
CREATE POLICY "Agents can create collections"
    ON collections FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'agent'
    ));

CREATE POLICY "Users can view their own collections"
    ON collections FOR SELECT
    TO authenticated
    USING (
        agent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM farmers
            WHERE farmers.id = collections.farmer_id
            AND farmers.created_by = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their messages"
    ON messages FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Announcements policies
CREATE POLICY "Agents can create announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'agent'
        )
    );

CREATE POLICY "Users can view announcements"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM announcement_recipients
            WHERE announcement_recipients.announcement_id = announcements.id
            AND announcement_recipients.user_id = auth.uid()
        )
    );

-- Announcement recipients policies
CREATE POLICY "Users can view their announcement receipts"
    ON announcement_recipients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_collections(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    farmer_name VARCHAR(255),
    scheduled_date DATE,
    scheduled_time TIME,
    quantity_liters DECIMAL(10,2),
    status collection_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        f.full_name as farmer_name,
        c.scheduled_date,
        c.scheduled_time,
        c.quantity_liters,
        c.status
    FROM collections c
    JOIN farmers f ON c.farmer_id = f.id
    WHERE c.agent_id = user_uuid
    OR f.created_by = user_uuid
    ORDER BY c.scheduled_date DESC, c.scheduled_time DESC;
END;
$$ LANGUAGE plpgsql;
