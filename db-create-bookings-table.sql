-- Create bookings table for internal appointment management
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_config_id UUID REFERENCES salon_configs(id) ON DELETE CASCADE,
    service_id UUID REFERENCES salon_services(id) ON DELETE SET NULL,
    
    -- Customer Information
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_notes TEXT,
    
    -- Booking Details
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Status Management
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'whatsapp_bot', -- 'whatsapp_bot', 'manual', 'web'
    
    -- Prevent double booking (same salon, same time slot)
    CONSTRAINT unique_booking UNIQUE (salon_config_id, booking_date, booking_time)
);

-- Create index for faster queries
CREATE INDEX idx_bookings_salon_date ON bookings(salon_config_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage bookings for their own salon
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own bookings" 
ON bookings FOR INSERT 
WITH CHECK (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own bookings" 
ON bookings FOR UPDATE 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own bookings" 
ON bookings FOR DELETE 
USING (
    salon_config_id IN (
        SELECT id FROM salon_configs WHERE user_id = auth.uid()
    )
);

-- Allow n8n to insert bookings (public access for webhook)
-- Note: You may want to create a service role for this instead
CREATE POLICY "Allow public booking creation" 
ON bookings FOR INSERT 
WITH CHECK (true);

-- Sample data insert (uncomment and update salon_config_id and service_id)
-- INSERT INTO bookings (salon_config_id, service_id, customer_name, customer_phone, booking_date, booking_time, duration_minutes, status) 
-- VALUES 
--     ('YOUR_SALON_CONFIG_ID', 'YOUR_SERVICE_ID', 'فاطمة أحمد', '+966501234567', '2026-02-15', '14:00', 45, 'confirmed'),
--     ('YOUR_SALON_CONFIG_ID', 'YOUR_SERVICE_ID', 'نورة محمد', '+966507654321', '2026-02-15', '15:00', 90, 'pending');
