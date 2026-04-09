-- ======================================================
-- 🛠️ الشامل لإصلاح أخطاء الهوية والاشتراك (نسخة محدثة)
-- انسخ هذا الكود بالكامل وضعه في SQL Editor في Supabase
-- وقُم بتشغيله (Run)
-- ======================================================

-- 1. إضافة كافة الأعمدة المفقودة لجدول profiles (لحل أخطاء 400)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_white_label_paid BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS white_label_sub_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free_tier';

-- 2. إنشاء جدول الإعدادات system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. تفعيل الحماية (RLS) لجدول الإعدادات
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access') THEN
        CREATE POLICY "Allow service role full access" ON public.system_settings FOR ALL USING (auth.role() = 'service_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read-only access') THEN
        CREATE POLICY "Allow authenticated read-only access" ON public.system_settings FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 4. إدراج السعر الافتراضي للـ White Label (استبدل المعرف عند الحاجة)
INSERT INTO public.system_settings (key, value, description)
VALUES ('agency_white_label_price_id', 'price_placeholder_wl_50', 'Stripe Price ID for White Label')
ON CONFLICT (key) DO NOTHING;

-- 5. إنشاء دالة get_branding_config (المحرك الأساسي)
CREATE OR REPLACE FUNCTION public.get_branding_config(
    p_domain    TEXT DEFAULT NULL,
    p_user_id   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_config     JSONB;
    v_agency_id  UUID;
BEGIN
    -- Resolve by domain
    IF p_domain IS NOT NULL AND p_domain <> '' THEN
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE custom_domain = p_domain AND is_agency = true
        LIMIT 1;
    END IF;

    -- Resolve by user
    IF v_config IS NULL AND p_user_id IS NOT NULL THEN
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE id = p_user_id AND is_agency = true;

        IF v_config IS NULL THEN
            SELECT p.agency_id, a.white_label_config INTO v_agency_id, v_config
            FROM public.profiles p
            JOIN public.profiles a ON a.id = p.agency_id
            WHERE p.id = p_user_id AND a.is_agency = true;
        END IF;
    END IF;

    -- Default fallback
    IF v_config IS NULL THEN
        RETURN jsonb_build_object(
            'is_custom', false,
            'brand_name', '24Shift',
            'logo_url', '/logo.png',
            'primary_color', '#8B5CF6',
            'hide_credits', false
        );
    END IF;

    RETURN jsonb_build_object(
        'is_custom', true,
        'agency_id', v_agency_id,
        'brand_name', COALESCE(v_config->>'brand_name', '24Shift'),
        'logo_url', COALESCE(v_config->>'logo_url', '/logo.png'),
        'primary_color', COALESCE(v_config->>'primary_color', '#8B5CF6'),
        'hide_credits', COALESCE((v_config->>'hide_credits')::boolean, false),
        'custom_domain', COALESCE(v_config->>'custom_domain', '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.get_branding_config(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_branding_config(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_branding_config(TEXT, UUID) TO service_role;
