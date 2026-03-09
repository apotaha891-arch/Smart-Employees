-- ============================================================
-- Platform Synchronization & Advanced Agent Templates
-- ============================================================

-- 1. Update Platform Settings: SCETORS
INSERT INTO public.platform_settings (key, value)
VALUES ('system_sectors', '{
    "telecom_it": { "l": "اتصالات وتقنية", "e": "📡", "c": "#EF4444", "on": true },
    "banking": { "l": "بنوك ومالية", "e": "🏦", "c": "#8B5CF6", "on": true },
    "retail_ecommerce": { "l": "تجزئة ومتاجر", "e": "🛍", "c": "#10B981", "on": true },
    "call_center": { "l": "خدمات العملاء", "e": "🎧", "c": "#06B6D4", "on": true },
    "medical": { "l": "طبي وصحي", "e": "🩺", "c": "#3B82F6", "on": true },
    "beauty": { "l": "تجميل وعناية", "e": "🌸", "c": "#EC4899", "on": true },
    "restaurant": { "l": "مطاعم وضيافة", "e": "🍽", "c": "#F59E0B", "on": true },
    "real_estate": { "l": "عقارات", "e": "🏠", "c": "#D946EF", "on": true },
    "general": { "l": "خدمات عامة", "e": "🏢", "c": "#6B7280", "on": true }
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Update Platform Settings: ROLES
INSERT INTO public.platform_settings (key, value)
VALUES ('system_roles', '{
    "booking": { "l": "منسقة حجوزات", "c": "#8B5CF6" },
    "support": { "l": "خدمة عملاء", "c": "#10B981" },
    "sales": { "l": "مبيعات", "c": "#F59E0B" },
    "hr": { "l": "موارد بشرية", "c": "#3B82F6" },
    "email": { "l": "منسق بريد", "c": "#EC4899" },
    "followup": { "l": "متابعة", "c": "#06B6D4" }
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Clear and Refresh AI Agent Templates
DELETE FROM public.agent_templates;

INSERT INTO public.agent_templates 
(name, name_en, description, description_en, specialty, business_type, avatar, metadata)
VALUES 
-- Telecom & IT
('مهندس دعم تقني (تيليجرام)', 'Technical Support Engineer (Telegram)', 'خبير ذكاء اصطناعي لحل المشكلات التقنية وتوجيه العملاء.', 'AI expert for solving technical issues and guiding customers.', 'support', 'telecom_it', '📡', '{"platforms": ["telegram"]}'::jsonb),
('مستشار مبيعات سحابي', 'Cloud Sales Consultant', 'متخصص في شرح باقات الاستضافة والحلول السحابية وإغلاق الصفقات.', 'Specialist in explaining hosting plans and cloud solutions.', 'sales', 'telecom_it', '☁️', '{"platforms": ["telegram"]}'::jsonb),

-- Banking
('منسق علاقات عملاء بنكي', 'Banking Relationship Manager', 'يقدم معلومات القروض، البطاقات، ويحجز مواعيد الفروع.', 'Provides loan & card info and books branch appointments.', 'booking', 'banking', '🏦', '{"platforms": ["telegram"]}'::jsonb),
('مساعد الدعم المصرفي', 'Banking Support Assistant', 'للرد على الاستفسارات العامة وحل مشاكل الحسابات الأولية.', 'Answering general inquiries and initial account issues.', 'support', 'banking', '💳', '{"platforms": ["telegram"]}'::jsonb),

-- Retail & Ecommerce
('موظف مبيعات المتاجر', 'Store Sales Associate', 'يساعد العملاء في اختيار المنتجات المناسبة وتلقي الطلبات.', 'Assists customers in product selection and taking orders.', 'sales', 'retail_ecommerce', '🛍', '{"platforms": ["telegram"]}'::jsonb),
('منسق مرتجعات وطلبات', 'Orders & Returns Coordinator', 'يدير حالة الشحن وطلبات الاسترجاع بسلاسة.', 'Manages shipping status and return requests smoothly.', 'support', 'retail_ecommerce', '📦', '{"platforms": ["telegram"]}'::jsonb),

-- Call Center
('وكيل خدمة العملاء الذكي', 'Smart CS Agent', 'يتعامل مع حجم ضخم من الاستفسارات والشكاوى بدقة وكفاءة.', 'Handles high volume of inquiries and complaints efficiently.', 'support', 'call_center', '🎧', '{"platforms": ["telegram"]}'::jsonb),

-- Medical
('منسقة عيادة ذكية', 'Smart Clinic Coordinator', 'تحجز مواعيد الكشف والعمليات وتذكر المرضى.', 'Books appointments, surgeries and reminds patients.', 'booking', 'medical', '🩺', '{"platforms": ["telegram"]}'::jsonb),

-- Beauty
('خبيرة حجوزات الصالون', 'Salon Booking Expert', 'تنسق مواعيد الشعر والمكياج وتوزع الموظفات.', 'Coordinates hair/makeup appointments and staff allocation.', 'booking', 'beauty', '🌸', '{"platforms": ["telegram"]}'::jsonb),

-- Real Estate
('وكيل مبيعات عقاري', 'Real Estate Sales Agent', 'يعرض الوحدات المتاحة، يحجز جلسات المعاينة، ويجمع البيانات.', 'Displays available units, books viewings, and collects leads.', 'sales', 'real_estate', '🏠', '{"platforms": ["telegram"]}'::jsonb),

-- Shared Roles
('منسقة مقابلات أولية (HR)', 'Initial HR Interviewer', 'تقيم المتقدمين وتفرز السير الذاتية وتحدد مواعيد المقابلات.', 'Screening candidates, resume sorting and scheduling interviews.', 'hr', 'general', '👥', '{"platforms": ["telegram"]}'::jsonb),
('موظف متابعة العملاء', 'Customer Follow-up Agent', 'يتصل بالعملاء بعد البيع لضمان الرضا وجمع التقييمات.', 'Contacts customers post-sale to ensure satisfaction.', 'followup', 'general', '📞', '{"platforms": ["telegram"]}'::jsonb);
