-- 126_hierarchical_notifications.sql
-- 🛠️ تفعيل نظام الإشعارات الهرمي (عميل -> وكالة -> أدمن)

-- 1. إضافة عمود agency_id لجدول الإشعارات
ALTER TABLE public.client_notifications ADD COLUMN IF NOT EXISTS agency_id UUID;

-- 2. إنشاء دالة لجلب الوكالة تلقائياً عند إدراج إشعار
CREATE OR REPLACE FUNCTION public.fn_populate_notification_agency()
RETURNS TRIGGER AS $$
DECLARE
    v_agency_id UUID;
BEGIN
    -- البحث عن الوكالة المرتبطة بالمستخدم (العميل)
    SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = NEW.user_id;
    
    -- إذا كان المستخدم هو نفسه وكالة، نضع معرفه كـ agency_id
    IF v_agency_id IS NULL THEN
        SELECT id INTO v_agency_id FROM public.profiles WHERE id = NEW.user_id AND is_agency = true;
    END IF;

    NEW.agency_id := v_agency_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء التريجر (Trigger) لتفعيل الربط التلقائي
DROP TRIGGER IF EXISTS tr_sync_notification_agency ON public.client_notifications;
CREATE TRIGGER tr_sync_notification_agency
    BEFORE INSERT ON public.client_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_populate_notification_agency();

-- 4. تحديث سجلات الإشعارات القديمة (اختياري - لضمان ظهور البيانات السابقة)
UPDATE public.client_notifications cn
SET agency_id = p.agency_id
FROM public.profiles p
WHERE cn.user_id = p.id AND cn.agency_id IS NULL;

-- 5. تحديث سياسات الحماية (RLS) للسماح للوكالة بالاستعلام
DROP POLICY IF EXISTS "Agencies can view their client notifications" ON public.client_notifications;
CREATE POLICY "Agencies can view their client notifications"
    ON public.client_notifications
    FOR SELECT
    TO authenticated
    USING (
        agency_id = auth.uid() 
        OR user_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- منح الصلاحيات اللازمة للعمود الجديد
GRANT SELECT, UPDATE ON public.client_notifications TO authenticated;
GRANT SELECT, UPDATE ON public.client_notifications TO service_role;
