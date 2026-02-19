-- Create services table for storing salon services catalog
CREATE TABLE IF NOT EXISTS salon_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_config_id UUID REFERENCES salon_configs(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage services for their own salon configs
CREATE POLICY "Users can view their own services" 
ON salon_services FOR SELECT 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own services" 
ON salon_services FOR INSERT 
WITH CHECK (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own services" 
ON salon_services FOR UPDATE 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own services" 
ON salon_services FOR DELETE 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

-- Insert sample services for testing
-- Note: Replace the salon_config_id with an actual ID from your salon_configs table
-- You can get this by running: SELECT id FROM salon_configs WHERE user_id = auth.uid() LIMIT 1;

-- Example insert (uncomment and update salon_config_id):
-- INSERT INTO salon_services (salon_config_id, service_name, price, duration_minutes, description) 
-- VALUES 
--     ('YOUR_SALON_CONFIG_ID_HERE', 'قص شعر', 150.00, 45, 'قص وتسريح شعر احترافي'),
--     ('YOUR_SALON_CONFIG_ID_HERE', 'صبغة', 250.00, 90, 'صبغة شعر كاملة'),
--     ('YOUR_SALON_CONFIG_ID_HERE', 'مكياج', 200.00, 60, 'مكياج مناسبات');
