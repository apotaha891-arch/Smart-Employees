-- Create salon_configs table to store "Smart Employee" setup
CREATE TABLE IF NOT EXISTS salon_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name TEXT,
    specialty TEXT,
    tone TEXT,
    service_menu_url TEXT,
    working_hours JSONB, -- Stores days and times
    google_calendar_token TEXT,
    whatsapp_number TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salon_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own salon config" 
ON salon_configs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salon config" 
ON salon_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salon config" 
ON salon_configs FOR UPDATE 
USING (auth.uid() = user_id);
