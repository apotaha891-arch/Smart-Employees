-- 1. Create meta_notifications table for webhook storage
CREATE TABLE IF NOT EXISTS meta_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT, -- 'whatsapp' or 'instagram'
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add BYOT columns to entities table
-- These allow customers to store their own Meta credentials for Hassle-Free connections.
-- Some fields may already exist, adding missing ones.
ALTER TABLE entities ADD COLUMN IF NOT EXISTS whatsapp_waba_id TEXT;
ALTER TABLE entities ADD COLUMN IF NOT EXISTS instagram_account_id TEXT;
ALTER TABLE entities ADD COLUMN IF NOT EXISTS instagram_token TEXT;

-- 3. Enable RLS for meta_notifications (optional but recommended)
ALTER TABLE meta_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for users to see their own notifications
-- Users can only see notifications that belong to their UUID
CREATE POLICY "Users can view their own meta notifications" 
ON meta_notifications FOR SELECT 
USING (auth.uid() = user_id);
