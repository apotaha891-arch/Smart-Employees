-- Create Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'blog' -- To track where they signed up
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow Public Signups (Insert only)
CREATE POLICY "Enable insert for everyone" ON public.newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

-- Allow Admins to read/manage
CREATE POLICY "Enable all for admins only" ON public.newsletter_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Comment for metadata
COMMENT ON TABLE public.newsletter_subscriptions IS 'Stores email subscriptions for the platform newsletter.';
