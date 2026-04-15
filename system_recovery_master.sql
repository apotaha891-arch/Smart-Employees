-- ============================================
-- STEP 2: REBUILD (Run AFTER Step 1 succeeds)
-- ============================================

BEGIN;

-- FIX PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic';

-- SYNC EMAILS
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- CREATE THE UNIFIED TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.master_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_is_agency BOOLEAN;
BEGIN
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
    v_is_agency := COALESCE((new.raw_user_meta_data->>'is_agency')::boolean, false);

    INSERT INTO public.profiles (id, email, full_name, role, subscription_tier, is_agency, created_at, updated_at)
    VALUES (new.id, new.email, v_full_name, 'customer', 'basic', v_is_agency, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        updated_at = NOW();

    INSERT INTO public.wallet_credits (user_id, balance)
    VALUES (new.id, 2000)
    ON CONFLICT (user_id) DO UPDATE SET 
        balance = GREATEST(public.wallet_credits.balance, 2000);

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATTACH NEW UNIFIED TRIGGER
CREATE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.master_handle_new_user();

-- ELEVATE OWNER TO ADMIN
UPDATE public.profiles 
SET role = 'admin', is_agency = true 
WHERE email = 'cubes4solutions@gmail.com';

-- SEED BLOG POSTS
INSERT INTO public.blog_posts (
  slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar, 
  featured_image, status, category, published_at
) VALUES 
(
  'ai-medical-appointment-scheduling',
  'The Future of Medical Appointments: How AI is Transforming Healthcare',
  'مستقبل المواعيد الطبية: كيف يغير الذكاء الاصطناعي جدولة الرعاية الصحية',
  'Discover how AI agents are reducing patient wait times.',
  'اكتشف كيف يقلل الذكاء الاصطناعي من أوقات انتظار المرضى.',
  '<h2>The Rise of the Digital Health Assistant</h2><p>In modern healthcare, efficiency is critical. With 24Shift Digital Employees, clinics can automate patient inquiries 24/7.</p>',
  '<h2>صعود المساعد الرقمي الصحي</h2><p>في الرعاية الصحية الحديثة، الكفاءة لا تقل أهمية. مع موظفي 24Shift الرقميين، تستطيع العيادات أتمتة الاستفسارات.</p>',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000',
  'published', 'Medical', NOW()
),
(
  'real-estate-ai-virtual-agent',
  '24/7 Real Estate: Why Your Agency Needs a Digital Employee',
  'عقارات على مدار الساعة: لماذا تحتاج وكالتك إلى موظف رقمي',
  'Boost property inquiries with AI agents that never sleep.',
  'عزز استفسارات العقارات مع وكلاء لا ينامون أبدًا.',
  '<h2>Automated Lead Qualification</h2><p>Real estate is fast-paced. A Real Estate Virtual Agent ensures every inquiry is captured instantly.</p>',
  '<h2>تأهيل تلقائي للعملاء</h2><p>العقارات صناعة سريعة. يضمن الوكيل الافتراضي التقاط كل استفسار على الفور.</p>',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000',
  'published', 'Real Estate', NOW()
),
(
  'future-digital-employees-business-automation',
  'Digital Employees: The Business Revolution You Cannot Ignore',
  'الموظفون الرقميون: ثورة الأعمال التي لا يمكنك تجاهلها',
  'Explore how Digital Employees are redefining business automation.',
  'استكشف كيف يعيد الموظفون الرقميون تعريف أتمتة الأعمال.',
  '<h2>The New Workforce is Digital</h2><p>AI Agents from 24Shift provide Omni-channel support, ensuring your brand is present wherever your customers are.</p>',
  '<h2>القوى العاملة الجديدة رقمية</h2><p>يوفر وكلاء 24Shift دعماً متعدد القنوات، مما يضمن تواجد علامتك التجارية أينما كان عملاؤك.</p>',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000',
  'published', 'Technology', NOW()
),
(
  'beauty-salon-booking-ai',
  'Beyond Bookings: The Rise of AI Concierge in Beauty Salons',
  'ما وراء الحجوزات: صعود المساعد الرقمي في صالونات التجميل',
  'How AI concierges are creating a premium salon experience.',
  'كيف يخلق المساعد الرقمي تجربة مميزة في صالونات التجميل.',
  '<h2>Elevate Your Customer Experience</h2><p>A Salon Booking AI acts as a professional concierge for your brand, handling bookings 24/7.</p>',
  '<h2>ارتقِ بتجربة عملائك</h2><p>يعمل الذكاء الاصطناعي ككونسيرج محترف لعلامتك، يتعامل مع الحجوزات على مدار الساعة.</p>',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000',
  'published', 'Beauty', NOW()
),
(
  'restaurant-table-reservations-ai',
  'Never Miss a Table: AI-Powered Reservations for Modern Restaurants',
  'لا تفقد طاولة: حجوزات مدعومة بالذكاء الاصطناعي للمطاعم الحديثة',
  'Automate table bookings to keep your restaurant full.',
  'أتمتة حجوزات الطاولات للحفاظ على انشغال مطعمك.',
  '<h2>Seamless Dining with Conversational AI</h2><p>With 24Shift, guests can book tables via WhatsApp or Telegram instantly.</p>',
  '<h2>تجربة طعام سلسة</h2><p>مع 24Shift، يمكن للضيوف حجز الطاولات عبر واتساب أو تيليجرام فوراً.</p>',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000',
  'published', 'Restaurant', NOW()
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- VERIFY
SELECT 
  (SELECT count(*) FROM auth.users) as auth_users,
  (SELECT count(*) FROM profiles) as profiles,
  (SELECT count(*) FROM blog_posts WHERE status = 'published') as published_posts,
  (SELECT role FROM profiles WHERE email = 'cubes4solutions@gmail.com') as your_role;
