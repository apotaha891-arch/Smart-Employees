-- ============================================================
-- Fix: Drop and recreate get_admin_concierge_conversations
-- with updated return type including guest fields
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop all existing versions of the function (both return types)
DROP FUNCTION IF EXISTS public.get_admin_concierge_conversations();

-- Step 2: Ensure guest columns exist on the table
ALTER TABLE concierge_conversations
    ADD COLUMN IF NOT EXISTS session_id TEXT;

ALTER TABLE concierge_conversations
    ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Step 3: Recreate the function with the correct, updated return type
CREATE OR REPLACE FUNCTION public.get_admin_concierge_conversations()
RETURNS TABLE (
    id          UUID,
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    user_id     UUID,
    session_id  TEXT,
    is_guest    BOOLEAN,
    user_email  TEXT,
    user_name   TEXT,
    messages    JSONB,
    last_message TEXT,
    metadata    JSONB,
    ticket_id   UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        cc.id,
        cc.created_at,
        cc.updated_at,
        cc.user_id,
        cc.session_id,
        cc.is_guest,
        p.email       AS user_email,
        p.full_name   AS user_name,
        cc.messages,
        cc.last_message,
        cc.metadata,
        cc.ticket_id
    FROM concierge_conversations cc
    LEFT JOIN profiles p ON cc.user_id = p.id
    ORDER BY cc.updated_at DESC;
END;
$$;

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_concierge_conversations() TO authenticated;
