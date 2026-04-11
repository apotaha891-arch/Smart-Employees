-- 127_white_label_requests.sql

-- Create the table for manual white-label requests
CREATE TABLE IF NOT EXISTS white_label_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    brand_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#8B5CF6',
    custom_domain TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE white_label_requests ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own requests
DROP POLICY IF EXISTS "Users can view their own requests" ON white_label_requests;
CREATE POLICY "Users can view their own requests" ON white_label_requests
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can create their own requests
DROP POLICY IF EXISTS "Users can create their own requests" ON white_label_requests;
CREATE POLICY "Users can create their own requests" ON white_label_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Admins can see and update everything
DROP POLICY IF EXISTS "Admins can manage all requests" ON white_label_requests;
CREATE POLICY "Admins can manage all requests" ON white_label_requests
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        OR (auth.jwt() ->> 'email') IN ('tayaran442000@gmail.com', 'sabah@gajha.com')
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_white_label_requests_updated_at ON white_label_requests;
CREATE TRIGGER tr_white_label_requests_updated_at
    BEFORE UPDATE ON white_label_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
