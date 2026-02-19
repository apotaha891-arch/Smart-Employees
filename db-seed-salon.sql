-- ==================== SALON SEED DATA ====================
-- This script inserts a dummy salon configuration for testing.

-- 1. Insert a mock salon record.
INSERT INTO salon_configs (
    user_id,         -- Will need manual update or use existing user ID
    agent_name,
    specialty,
    tone,
    service_menu_url,
    working_hours,
    google_calendar_token,
    whatsapp_number, -- IMPORTANT: Replace with your actual Telegram/WhatsApp number for lookup
    is_active
) 
VALUES (
    auth.uid(),      -- Uses the current authenticated user (if running in SQL Editor as self)
    'سارة',           -- Agent Name
    'شامل',           -- Specialty
    'friendly',      -- Tone
    'https://example.com/menu.pdf', -- Mock Menu URL
    '{"start": "10:00", "end": "22:00", "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]}'::jsonb,
    'mock_calendar_token_123',
    '+966500000000', -- REPLACE THIS with your Telegram ID/Phone Number used in n8n Trigger
    TRUE             -- Set as Active
);

-- Note: Ensure that the whatsapp_number matches exactly what n8n receives from Telegram.
