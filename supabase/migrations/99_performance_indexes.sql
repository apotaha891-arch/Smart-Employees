-- PERFORMANCE BOOST: DATABASE INDEXES (CORRECTED VERSION)
-- Error "user_id does not exist" handled by prioritizing salon_config_id and created_at.

-- 1. Bookings Table (Highly active)
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_config_id ON bookings(salon_config_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- 2. Agents Table (Employees tab)
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_salon_config_id ON agents(salon_config_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- 3. Customers Table (End-customers tab)
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_salon_config_id ON customers(salon_config_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customers_instagram ON customers(instagram_id);
CREATE INDEX IF NOT EXISTS idx_customers_telegram ON customers(telegram_id);

-- 4. Concierge Conversations (Chat history)
CREATE INDEX IF NOT EXISTS idx_concierge_updated_at ON concierge_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_session_id ON concierge_conversations(session_id);

-- 5. Profiles Table (Main Clients list)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Salon Configs (Core Settings)
CREATE INDEX IF NOT EXISTS idx_salon_configs_user_id ON salon_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_configs_created_at ON salon_configs(created_at DESC);
