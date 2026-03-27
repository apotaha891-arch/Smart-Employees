-- ============================================================
-- Fix: custom_requests table - add missing columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add contact fields if they don't exist
ALTER TABLE public.custom_requests
    ADD COLUMN IF NOT EXISTS business_type TEXT,
    ADD COLUMN IF NOT EXISTS required_tasks TEXT,
    ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'both',
    ADD COLUMN IF NOT EXISTS integrations TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- If the table doesn't exist at all, create it:
CREATE TABLE IF NOT EXISTS public.custom_requests (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    business_type   TEXT,
    required_tasks  TEXT,
    preferred_language TEXT DEFAULT 'both',
    integrations    TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    contact_email   TEXT,
    status          TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to INSERT requests
DROP POLICY IF EXISTS "Anyone can submit custom requests" ON public.custom_requests;
CREATE POLICY "Anyone can submit custom requests"
    ON public.custom_requests FOR INSERT
    WITH CHECK (true);

-- Only admins can read requests
DROP POLICY IF EXISTS "Admins can read custom requests" ON public.custom_requests;
CREATE POLICY "Admins can read custom requests"
    ON public.custom_requests FOR SELECT
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
