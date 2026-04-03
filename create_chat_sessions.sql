-- Chat Sessions Table for Agent Memory
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, agent_id)
);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all for service role (used by Edge Functions)
CREATE POLICY "Allow all for service role" ON chat_sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Optional: Allow users to see their own agents' sessions (if needed)
-- CREATE POLICY "Users can view their agents' sessions" ON chat_sessions
--     FOR SELECT
--     USING (EXISTS (SELECT 1 FROM agents WHERE id = chat_sessions.agent_id AND user_id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lookup ON chat_sessions(session_id, agent_id);
