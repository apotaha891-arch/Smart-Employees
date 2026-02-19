-- ============================================
-- Customers Table Setup
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_config_id UUID REFERENCES salon_configs(id) ON DELETE CASCADE,
    
    -- Identity Fields
    customer_name TEXT,
    customer_phone TEXT, -- Format: +966XXXXXXXXX
    instagram_id TEXT,
    telegram_id TEXT,
    
    -- Metadata
    last_service_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_salon ON customers(salon_config_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customers_instagram ON customers(instagram_id);
CREATE INDEX IF NOT EXISTS idx_customers_telegram ON customers(telegram_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own customers" 
ON customers FOR SELECT 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their own customers" 
ON customers FOR ALL 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

-- Allow public identity lookup and upsert for n8n (webhook)
CREATE POLICY "Allow public identity matching" 
ON customers FOR SELECT 
USING (true);

CREATE POLICY "Allow public customer upsert" 
ON customers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public customer updates" 
ON customers FOR UPDATE 
USING (true);

-- ============================================
-- End of Customers Table Setup
-- ============================================
