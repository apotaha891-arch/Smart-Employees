-- ============================================================
-- Stealth Hook Academy Database Schema (Fixed Admin Check Version)
-- ============================================================

-- 1. Academy Leads (Tracks everyone who enters the funnel)
CREATE TABLE IF NOT EXISTS public.academy_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    whatsapp TEXT,
    email TEXT,
    user_type TEXT, -- 'owner', 'agency', 'freelancer'
    industry TEXT,  -- 'real_estate', 'legal', 'retail', 'generic'
    status TEXT DEFAULT 'new', -- 'new', 'knockout_viewed', 'paid', 'training'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Academy Config (Dynamic Content for the Knockout stage)
CREATE TABLE IF NOT EXISTS public.academy_config (
    segment_key TEXT PRIMARY KEY, -- e.g. 'owner_real_estate'
    video_url TEXT,
    headline_ar TEXT,
    headline_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Academy Access (Tracks $20 payments)
CREATE TABLE IF NOT EXISTS public.academy_access (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id TEXT, -- Stripe session/charge ID
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.academy_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_access ENABLE ROW LEVEL SECURITY;

-- Clean old policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Public can insert leads" ON public.academy_leads;
DROP POLICY IF EXISTS "Admin can view leads" ON public.academy_leads;
DROP POLICY IF EXISTS "Public can view config" ON public.academy_config;
DROP POLICY IF EXISTS "Users can view own access" ON public.academy_access;

-- Re-create Policies with CORRECT Admin check
CREATE POLICY "Public can insert leads" ON public.academy_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view leads" ON public.academy_leads FOR SELECT 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('tayaran442000@gmail.com', 'sabah@gajha.com')
);

CREATE POLICY "Public can view config" ON public.academy_config FOR SELECT USING (true);

CREATE POLICY "Users can view own access" ON public.academy_access FOR SELECT 
USING (
    auth.uid() = user_id 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Insert initial seeds
INSERT INTO public.academy_config (segment_key, video_url, headline_ar, headline_en, description_ar, description_en)
VALUES 
('agency_real_estate', '', 'كيف تنشئ وكالة ذكاء اصطناعي للعقارات في 48 ساعة', 'How to build an AI Agency for Real Estate in 48h', 'هذا الفيديو مخصص لك لتعرف كيف تبدأ رحلتك مع العقارات.', 'This video shows you how to start your journey in Real Estate.'),
('owner_retail', '', 'وظف أول موظف رقمي لمتجرك بـ 20 دولار فقط', 'Hire your first Digital Employee for $20', 'تعلم كيف توفر 80% من تكاليف الدعم الفني.', 'Learn how to save 80% on support costs.'),
('generic', '', 'فرصة العمر: ابدأ بيزنس الوكلاء الأذكياء اليوم', 'Golden Opportunity: Start Smart Agents Business Today', 'فيديو يشرح الفكرة العامة والفرصة الحالية.', 'General overview of the current opportunity.')
ON CONFLICT (segment_key) DO NOTHING;
