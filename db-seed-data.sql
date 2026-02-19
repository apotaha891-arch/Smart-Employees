-- ============================================
-- Seed Data for Testing
-- ====================
-- This script adds sample data to all salon-related tables.
-- IMPORTANT: Run this in the Supabase SQL Editor.
-- ============================================

DO $$ 
DECLARE
    v_user_email TEXT := 'tayaran442000@gmail.com'; -- << UPDATE THIS TO YOUR REGISTERED EMAIL
    v_user_id UUID;
    v_salon_id UUID;
    v_service_hair_id UUID;
    v_service_nails_id UUID;
    v_customer_1_id UUID;
    v_customer_2_id UUID;
BEGIN
    -- 1. Get the user ID from auth.users based on email
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email LIMIT 1;
    
    -- Fallback: If email not found, try to get the first available user
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
        RAISE NOTICE 'Email % not found, falling back to first user in system.', v_user_email;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found in auth.users. Please register a user first.';
        RETURN;
    END IF;

    -- 2. Cleanup: Deactivate existing configs for this user and delete their services to ensure a clean seed
    UPDATE salon_configs SET is_active = false WHERE user_id = v_user_id;
    
    -- Cleanup: Delete old configs with NULL user_id that are causing n8n to fetch wrong data
    DELETE FROM salon_configs WHERE user_id IS NULL;

    -- 3. Create/Get Salon Config
    -- We try to find an existing one first to update it, or insert a new one
    SELECT id INTO v_salon_id FROM salon_configs WHERE user_id = v_user_id LIMIT 1;

    IF v_salon_id IS NULL THEN
        INSERT INTO salon_configs (user_id, agent_name, specialty, tone, is_active, working_hours)
        VALUES (v_user_id, 'نورة المتميزة', 'صالون الجمال الراقي', 'friendly', true, '{"start": "10:00", "end": "22:00"}')
        RETURNING id INTO v_salon_id;
    ELSE
        UPDATE salon_configs 
        SET agent_name = 'نورة المتميزة', 
            specialty = 'صالون الجمال الراقي', 
            is_active = true,
            working_hours = '{"start": "10:00", "end": "22:00"}'
        WHERE id = v_salon_id;
    END IF;

    -- 4. Clear existing services for this specific salon_id to avoid duplicates
    DELETE FROM salon_services WHERE salon_config_id = v_salon_id;

    -- 5. Create Services
    INSERT INTO salon_services (salon_config_id, service_name, price, duration_minutes, is_active)
    VALUES 
        (v_salon_id, 'قص شعر ستايل', 150.00, 45, true),
        (v_salon_id, 'صبغة اومبري', 350.00, 120, true),
        (v_salon_id, 'تنظيف بشرة ملكي', 200.00, 60, true),
        (v_salon_id, 'باديكير سبا', 180.00, 90, true);

    -- Get IDs for bookings
    SELECT id INTO v_service_hair_id FROM salon_services WHERE service_name = 'قص شعر ستايل' AND salon_config_id = v_salon_id LIMIT 1;
    SELECT id INTO v_service_nails_id FROM salon_services WHERE service_name = 'باديكير سبا' AND salon_config_id = v_salon_id LIMIT 1;

    -- 6. Create Customers
    INSERT INTO customers (salon_config_id, customer_name, customer_phone, instagram_id, last_service_date, notes)
    VALUES 
        (v_salon_id, 'سارة أحمد', '+966500000001', '@sara_beauty', NOW() - INTERVAL '5 days', 'تفضل اللون البني للصبغة'),
        (v_salon_id, 'ليلى محمد', '+966500000002', NULL, NOW() - INTERVAL '2 days', 'زبونة دائمة'),
        (v_salon_id, 'نورة العتيبي', '+966500000003', '@noura_vlog', NULL, 'مهتمة بالعناية بالبشرة')
    ON CONFLICT DO NOTHING;

    -- 7. Create Bookings
    INSERT INTO bookings (salon_config_id, customer_name, customer_phone, service_id, booking_date, booking_time, duration_minutes, status)
    VALUES 
        (v_salon_id, 'سارة أحمد', '+966500000001', v_service_hair_id, CURRENT_DATE + 1, '14:00', 45, 'confirmed'),
        (v_salon_id, 'ليلى محمد', '+966500000002', v_service_nails_id, CURRENT_DATE + 1, '16:30', 90, 'pending')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed data refreshed successfully for: %', (SELECT specialty FROM salon_configs WHERE id = v_salon_id);
END $$;
