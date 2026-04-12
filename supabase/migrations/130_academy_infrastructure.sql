-- Academy & Lead Tracking Infrastructure migration

-- 1. Create Academy Affiliates Table (Partner Accounts)
CREATE TABLE IF NOT EXISTS public.academy_affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    affiliate_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    commission_rate_fixed DECIMAL DEFAULT 10.00, -- Default $10 per sale/lead
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Academy Leads Table (Funnel Entrants)
CREATE TABLE IF NOT EXISTS public.academy_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    user_type TEXT CHECK (user_type IN ('owner', 'agency', 'affiliate')),
    industry TEXT,
    status TEXT DEFAULT 'knockout_viewed' CHECK (status IN ('knockout_viewed', 'partially_paid', 'paid', 'completed')),
    referrer_id UUID REFERENCES public.academy_affiliates(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Academy Config Table (Segmented Funnel Content)
CREATE TABLE IF NOT EXISTS public.academy_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_key TEXT UNIQUE NOT NULL, -- e.g., 'owner', 'agency', 'affiliate', 'generic'
    headline_ar TEXT,
    headline_en TEXT,
    video_url TEXT,
    cta_text_ar TEXT,
    cta_text_en TEXT,
    price DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.academy_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_config ENABLE ROW LEVEL SECURITY;

-- Policies for academy_leads
CREATE POLICY "Public can insert leads" ON public.academy_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and manage leads" ON public.academy_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policies for academy_affiliates
CREATE POLICY "Public can view active affiliates" ON public.academy_affiliates FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view their own affiliate status" ON public.academy_affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.academy_affiliates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policies for academy_config
CREATE POLICY "Public can view academy config" ON public.academy_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage academy config" ON public.academy_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Admin RPC for enriched leads view (Enables dashboard to see referrer info)
CREATE OR REPLACE FUNCTION public.get_admin_academy_leads()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    whatsapp TEXT,
    email TEXT,
    user_type TEXT,
    industry TEXT,
    status TEXT,
    referrer_code TEXT,
    referrer_name TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Security Check: Verify caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        l.id,
        l.full_name,
        l.whatsapp,
        l.email,
        l.user_type,
        l.industry,
        l.status,
        a.affiliate_code as referrer_code,
        p.full_name as referrer_name,
        l.created_at
    FROM public.academy_leads l
    LEFT JOIN public.academy_affiliates a ON l.referrer_id = a.id
    LEFT JOIN public.profiles p ON a.user_id = p.id
    ORDER BY l.created_at DESC;
END;
$$;

-- Seed initial generic config
INSERT INTO public.academy_config (segment_key, headline_ar, headline_en, video_url)
VALUES 
('generic', 'تم تجهيز خطتك التدريبية!', 'Your training plan is ready!', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('affiliate', 'ابدأ بربح 10$ عن كل تسجيل جديد!', 'Start blooming with $10 per signup!', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
ON CONFLICT (segment_key) DO NOTHING;

COMMENT ON TABLE public.academy_leads IS 'Captures potential customers and partners entering the 24Shift Academy funnel.';
