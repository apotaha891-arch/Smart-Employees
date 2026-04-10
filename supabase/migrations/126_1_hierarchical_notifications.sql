-- 126_hierarchical_notifications.sql
-- 🛠️ تفعيل نظام الإشعارات الهرمي المتكامل (عميل -> وكالة -> أدمن)

-- 1. إضافة عمود agency_id للجداول اللازمة (إذا لم يوجد)
ALTER TABLE public.client_notifications ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE public.customer_notifications ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE public.platform_notifications ADD COLUMN IF NOT EXISTS agency_id UUID;

-- 2. دالة ذكية لجلب الوكالة تلقائياً عند إدراج أي إشعار
CREATE OR REPLACE FUNCTION public.fn_populate_notification_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_agency_id UUID;
BEGIN
    -- البحث عن الوكالة المرتبطة بالمستخدم (سواء كان عميل أو صاحب منشأة)
    SELECT p.agency_id INTO v_agency_id 
    FROM public.profiles p 
    WHERE p.id = NEW.user_id;
    
    -- إذا كان المستخدم هو نفسه وكالة، نضع معرفه كـ agency_id
    IF v_agency_id IS NULL THEN
        SELECT p.id INTO v_agency_id 
        FROM public.profiles p 
        WHERE p.id = NEW.user_id AND p.is_agency = true;
    END IF;

    NEW.agency_id := v_agency_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ربط الدالة بجميع جداول الإشعارات عبر Triggers
DROP TRIGGER IF EXISTS tr_sync_client_notification_agency ON public.client_notifications;
CREATE TRIGGER tr_sync_client_notification_agency
    BEFORE INSERT ON public.client_notifications
    FOR EACH ROW EXECUTE FUNCTION public.fn_populate_notification_hierarchy();

DROP TRIGGER IF EXISTS tr_sync_customer_notification_agency ON public.customer_notifications;
CREATE TRIGGER tr_sync_customer_notification_agency
    BEFORE INSERT ON public.customer_notifications
    FOR EACH ROW EXECUTE FUNCTION public.fn_populate_notification_hierarchy();

DROP TRIGGER IF EXISTS tr_sync_platform_notification_agency ON public.platform_notifications;
CREATE TRIGGER tr_sync_platform_notification_agency
    BEFORE INSERT ON public.platform_notifications
    FOR EACH ROW EXECUTE FUNCTION public.fn_populate_notification_hierarchy();

-- 4. تحديث سجلات الإشعارات القديمة
UPDATE public.client_notifications cn SET agency_id = p.agency_id FROM public.profiles p WHERE cn.user_id = p.id AND cn.agency_id IS NULL;
UPDATE public.customer_notifications cn SET agency_id = p.agency_id FROM public.profiles p WHERE cn.user_id = p.id AND cn.agency_id IS NULL;

-- 5. تحديث سياسات الحماية (RLS) لكل الجداول لتدعم الهرمية
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['client_notifications', 'customer_notifications', 'platform_notifications']) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Hierarchical view policy" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Agencies can view their client notifications" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own notifications" ON public.%I', t);
        EXECUTE format('
            CREATE POLICY "Hierarchical view policy" ON public.%I
            FOR SELECT TO authenticated
            USING (
                user_id = auth.uid() 
                OR agency_id = auth.uid()
                OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''admin''
            )', t);
    END LOOP;
END $$;

-- 6. منح الصلاحيات
GRANT SELECT, UPDATE ON public.client_notifications TO authenticated;
GRANT SELECT, UPDATE ON public.customer_notifications TO authenticated;
GRANT SELECT, UPDATE ON public.platform_notifications TO authenticated;
