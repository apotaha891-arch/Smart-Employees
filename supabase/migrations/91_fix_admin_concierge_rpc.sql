-- ──────────────────────────────────────────────────────────────────────────────
-- Fix: Create get_admin_concierge_conversations RPC (if table exists)
-- Run this in Supabase SQL Editor
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Create concierge_conversations table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.concierge_conversations (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   TEXT,
    user_email  TEXT,
    messages    JSONB DEFAULT '[]',
    ticket_id   UUID,
    status      TEXT DEFAULT 'open',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create platform_notifications table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.platform_notifications (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type        TEXT NOT NULL,
    title       TEXT,
    message     TEXT,
    data        JSONB,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the admin RPC for fetching concierge conversations
CREATE OR REPLACE FUNCTION public.get_admin_concierge_conversations()
RETURNS SETOF public.concierge_conversations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.concierge_conversations
    ORDER BY updated_at DESC
    LIMIT 200;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_concierge_conversations() TO authenticated;

-- 4. Enable RLS on both tables
ALTER TABLE public.concierge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notifications  ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (drop first to avoid duplicate errors)
DROP POLICY IF EXISTS "admin_read_all_conversations" ON public.concierge_conversations;
CREATE POLICY "admin_read_all_conversations"
    ON public.concierge_conversations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
            OR auth.uid() = user_id
        )
    );

DROP POLICY IF EXISTS "admin_read_all_notifications" ON public.platform_notifications;
CREATE POLICY "admin_read_all_notifications"
    ON public.platform_notifications FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

DROP POLICY IF EXISTS "admin_insert_notifications" ON public.platform_notifications;
CREATE POLICY "admin_insert_notifications"
    ON public.platform_notifications FOR INSERT
    WITH CHECK (true);
