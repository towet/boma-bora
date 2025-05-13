-- Create messages table for direct communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    message_type TEXT CHECK (message_type IN ('inquiry', 'response', 'announcement')) NOT NULL
);

-- Create announcements table for broadcast messages
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create announcement_recipients for tracking who has read announcements
CREATE TABLE IF NOT EXISTS announcement_recipients (
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

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
            WHERE farmers.id = auth.uid()
            AND farmers.created_by = announcements.agent_id
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

-- Add type definitions to existing types
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'inquiry';
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'response';
ALTER TYPE public.message_type ADD VALUE IF NOT EXISTS 'announcement';
