-- Migration: 23_expand_blog_settings.sql
-- Description: Expand blog_settings to support 3 independent ad slots

-- 1. Add fields for Top Banner
ALTER TABLE public.blog_settings 
ADD COLUMN IF NOT EXISTS top_banner_text_en TEXT DEFAULT 'Premium AI Solutions for Your Business',
ADD COLUMN IF NOT EXISTS top_banner_text_ar TEXT DEFAULT 'حلول الذكاء الاصطناعي المتميزة لعملك',
ADD COLUMN IF NOT EXISTS top_banner_subtext_en TEXT DEFAULT 'Hire your 24/7 digital employee today.',
ADD COLUMN IF NOT EXISTS top_banner_subtext_ar TEXT DEFAULT 'وظف موظفك الرقمي على مدار الساعة اليوم.',
ADD COLUMN IF NOT EXISTS top_banner_link TEXT DEFAULT '/salon-setup',
ADD COLUMN IF NOT EXISTS top_is_active BOOLEAN DEFAULT true;

-- 2. Add fields for Sidebar Banner
ALTER TABLE public.blog_settings 
ADD COLUMN IF NOT EXISTS sidebar_banner_text_en TEXT DEFAULT 'Ready to Scale?',
ADD COLUMN IF NOT EXISTS sidebar_banner_text_ar TEXT DEFAULT 'هل أنت مستعد للتوسع؟',
ADD COLUMN IF NOT EXISTS sidebar_banner_subtext_en TEXT DEFAULT 'Our AI agents handle bookings, support and sales.',
ADD COLUMN IF NOT EXISTS sidebar_banner_subtext_ar TEXT DEFAULT 'موظفونا الآليون يتعاملون مع الحجوزات والدعم والمبيعات.',
ADD COLUMN IF NOT EXISTS sidebar_banner_link TEXT DEFAULT '/salon-setup',
ADD COLUMN IF NOT EXISTS sidebar_is_active BOOLEAN DEFAULT true;

-- 3. Add fields for Content Banner
ALTER TABLE public.blog_settings 
ADD COLUMN IF NOT EXISTS content_banner_text_en TEXT DEFAULT 'Join the Future of Work',
ADD COLUMN IF NOT EXISTS content_banner_text_ar TEXT DEFAULT 'انضم إلى مستقبل العمل',
ADD COLUMN IF NOT EXISTS content_banner_subtext_en TEXT DEFAULT 'Streamline your operations with 24Shift AI.',
ADD COLUMN IF NOT EXISTS content_banner_subtext_ar TEXT DEFAULT 'قم بتبسيط عملياتك مع ذكاء 24Shift الاصطناعي.',
ADD COLUMN IF NOT EXISTS content_banner_link TEXT DEFAULT '/salon-setup',
ADD COLUMN IF NOT EXISTS content_is_active BOOLEAN DEFAULT true;

-- Update existing row with defaults if necessary
UPDATE public.blog_settings SET 
    top_is_active = true, 
    sidebar_is_active = true, 
    content_is_active = true 
WHERE id = 1;
