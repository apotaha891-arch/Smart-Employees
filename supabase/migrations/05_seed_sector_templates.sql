-- ============================================================
-- 24Shift SEED SECTOR-SPECIFIC TEMPLATES
-- Run in Supabase SQL Editor to populate templates
-- ============================================================

-- This script inserts the base Telegram Booking Agent tailored for each sector.
-- By having a row for each sector, clients in that sector will see "their" specific agent.

INSERT INTO agent_templates 
(name, name_en, description, description_en, specialty, business_type, metadata)
VALUES 
-- 1. Beauty Sector
(
    'منسقة حجوزات التجميل (تيليجرام)',
    'Beauty Booking Coordinator (Telegram)',
    'موظفة متخصصة في استقبال عميلات الصالون، عرض الخدمات (شعر، أظافر، مكياج)، وجدولة المواعيد بدقة عبر تيليجرام.',
    'A specialized agent for greeting salon clients, displaying services (hair, nails, makeup), and precisely scheduling appointments via Telegram.',
    'booking',
    'beauty',
    '{"platforms": ["telegram"], "default_apps": ["reminder", "sms_notify"], "system_prompt": "أنت منسقة حجوزات لصالون تجميل راقي...", "webhook_required": true}'::jsonb
),

-- 2. Medical Sector
(
    'منسق المواعيد الطبية (تيليجرام)',
    'Medical Appointments Coordinator (Telegram)',
    'مساعد طبي رقمي لترتيب مواعيد العيادة، توجيه المرضى للأقسام المناسبة، وتأكيد الحجوزات عبر تيليجرام.',
    'A digital medical assistant for organizing clinic appointments, guiding patients to appropriate departments, and confirming bookings via Telegram.',
    'booking',
    'medical',
    '{"platforms": ["telegram"], "default_apps": ["reminder"], "system_prompt": "أنت منسق مواعيد لعيادة طبية احترافية...", "webhook_required": true}'::jsonb
),

-- 3. Restaurant Sector
(
    'مستقبل طلبات المطعم (تيليجرام)',
    'Restaurant Order Taker (Telegram)',
    'موظف ذكي لاستعراض قائمة الطعام (المنيو)، تلقي طلبات التوصيل أو الاستلام، وتنظيم حجوزات الطاولات عبر تيليجرام.',
    'A smart agent for displaying the menu, taking delivery or pickup orders, and organizing table reservations via Telegram.',
    'booking',
    'restaurant',
    '{"platforms": ["telegram"], "default_apps": ["sms_notify"], "system_prompt": "أنت مستقبل طلبات في مطعم متميز...", "webhook_required": true}'::jsonb
),

-- 4. General Sector (Business/Other)
(
    'المساعد الإداري للحجوزات (تيليجرام)',
    'Administrative Booking Assistant (Telegram)',
    'مساعد إداري عام لجدولة الاجتماعات، الرد على الاستفسارات العامة، واستقبال طلبات العملاء عبر تيليجرام.',
    'A general administrative assistant for scheduling meetings, answering general inquiries, and receiving client requests via Telegram.',
    'booking',
    'general',
    '{"platforms": ["telegram"], "default_apps": ["reminder"], "system_prompt": "أنت مساعد إداري مسؤول عن جدولة المواعيد والاجتماعات...", "webhook_required": true}'::jsonb
);
