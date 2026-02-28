-- ============================================================
-- 24Shift TEMPLATES BILINGUAL UPDATE (Run in SQL Editor)
-- Adds English support to Agent Templates
-- ============================================================

-- 1. Add English columns to agent_templates table
ALTER TABLE IF EXISTS agent_templates ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE IF EXISTS agent_templates ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 2. Update the existing default Telegram template with English translations
UPDATE agent_templates
SET 
    name_en = 'Basic Telegram Booking Agent',
    description_en = 'A smart agent professionally trained to respond to clients via Telegram, capable of displaying services, booking appointments, and registering client data automatically.'
WHERE name = 'موظفة حجوزات تيليجرام الأساسية';
