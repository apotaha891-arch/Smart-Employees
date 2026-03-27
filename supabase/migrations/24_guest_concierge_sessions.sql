-- ============================================================
-- Allow Guest (unauthenticated) Concierge Conversations
-- Adds session_id for guest tracking and anon insert policy
-- ============================================================

-- 1. Make user_id nullable (guests have no user_id)
ALTER TABLE concierge_conversations
    ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add session_id for tracking guest visitors
ALTER TABLE concierge_conversations
    ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Add metadata column for insights (phone, booking intent, etc.)
--    (already exists but include for safety)
ALTER TABLE concierge_conversations
    ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- 4. Allow anonymous users to INSERT their own conversations (by session_id)
DROP POLICY IF EXISTS "Guests can create conversations" ON concierge_conversations;
CREATE POLICY "Guests can create conversations" ON concierge_conversations
FOR INSERT WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- 5. Allow anonymous users to UPDATE their own session conversations
DROP POLICY IF EXISTS "Guests can update their session conversations" ON concierge_conversations;
CREATE POLICY "Guests can update their session conversations" ON concierge_conversations
FOR UPDATE USING (user_id IS NULL AND session_id IS NOT NULL);

-- 6. Allow anonymous to SELECT their own conversation (optional, for restoring chat)
DROP POLICY IF EXISTS "Guests can view their session conversations" ON concierge_conversations;
CREATE POLICY "Guests can view their session conversations" ON concierge_conversations
FOR SELECT USING (user_id IS NULL AND session_id IS NOT NULL);

-- 7. Update admin function to also return guest conversations with session_id
CREATE OR REPLACE FUNCTION get_admin_concierge_conversations()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    session_id TEXT,
    is_guest BOOLEAN,
    user_email TEXT,
    user_name TEXT,
    messages JSONB,
    last_message TEXT,
    metadata JSONB,
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
        cc.session_id, cc.is_guest,
        p.email as user_email, p.full_name as user_name,
        cc.messages, cc.last_message, cc.metadata, cc.ticket_id
    FROM concierge_conversations cc
    LEFT JOIN profiles p ON cc.user_id = p.id
    ORDER BY cc.updated_at DESC;
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_concierge_conversations() TO authenticated;
-- Also allow anon role to call the insert/update through RLS policies above
