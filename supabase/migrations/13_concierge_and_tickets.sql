-- ============================================================
-- Support Tickets & Concierge Conversations
-- ============================================================

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- open, pending, closed, archived
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    category TEXT DEFAULT 'General',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create concierge_conversations table
CREATE TABLE IF NOT EXISTS concierge_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]'::jsonb, -- Store full chat history as JSON
    last_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;

-- 3. Policies for support_tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets" ON support_tickets 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tickets" ON support_tickets;
CREATE POLICY "Users can create their own tickets" ON support_tickets 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
CREATE POLICY "Admins can manage all tickets" ON support_tickets 
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Policies for concierge_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON concierge_conversations;
CREATE POLICY "Users can view their own conversations" ON concierge_conversations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own conversations" ON concierge_conversations;
CREATE POLICY "Users can manage their own conversations" ON concierge_conversations 
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all conversations" ON concierge_conversations;
CREATE POLICY "Admins can view all conversations" ON concierge_conversations 
FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5. RPC functions for Admin Dashboard
CREATE OR REPLACE FUNCTION get_admin_tickets()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    category TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        st.id, st.created_at, st.user_id, 
        p.email as user_email, p.full_name as user_name,
        st.title, st.description, st.status, st.priority, st.category
    FROM support_tickets st
    LEFT JOIN profiles p ON st.user_id = p.id
    ORDER BY st.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION get_admin_concierge_conversations()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    messages JSONB,
    last_message TEXT,
    ticket_id UUID
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        cc.id, cc.created_at, cc.updated_at, cc.user_id, 
        p.email as user_email, p.full_name as user_name,
        cc.messages, cc.last_message, cc.ticket_id
    FROM concierge_conversations cc
    LEFT JOIN profiles p ON cc.user_id = p.id
    ORDER BY cc.updated_at DESC;
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_tickets() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_concierge_conversations() TO authenticated;
