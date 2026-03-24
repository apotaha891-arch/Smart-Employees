-- Migration: 19_blog_settings.sql
-- Description: Create settings table for global blog banners

CREATE TABLE IF NOT EXISTS public.blog_settings (
    id INT PRIMARY KEY DEFAULT 1,
    banner_image_en TEXT,
    banner_image_ar TEXT,
    banner_link TEXT DEFAULT '/salon-setup',
    banner_text_en TEXT DEFAULT 'Ready to hire your first AI Agent?',
    banner_text_ar TEXT DEFAULT 'هل أنت جاهز لتوظيف أول موظف ذكاء اصطناعي؟',
    banner_subtext_en TEXT DEFAULT 'Automate your business 24/7 with 24Shift.',
    banner_subtext_ar TEXT DEFAULT 'أتمتة عملك على مدار الساعة مع 24Shift.',
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_row CHECK (id = 1)
);

-- Initial settings
INSERT INTO public.blog_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog settings" ON public.blog_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update blog settings" ON public.blog_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
