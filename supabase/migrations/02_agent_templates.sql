-- ============================================================
-- 24Shift Agent Templates Migration
-- ============================================================

-- 1. Create Agent Templates Table
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    specialty TEXT, -- e.g. booking, support, sales
    business_type TEXT, -- e.g. beauty, medical, restaurant
    metadata JSONB DEFAULT '{}'::jsonb, -- specialized settings or default apps
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active templates (for clients to browse)
CREATE POLICY "Anyone can view active templates" ON agent_templates
    FOR SELECT USING ( is_active = true );

-- Allow admins to manage all templates
CREATE POLICY "Admins can manage templates" ON agent_templates
    FOR ALL USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- Update adminService or RPCs if needed to handle templates
-- For now, direct table access with RLS for admins is sufficient.
