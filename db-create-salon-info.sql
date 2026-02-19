-- Create the salon_info table as requested
CREATE TABLE IF NOT EXISTS salon_info (
    id SERIAL PRIMARY KEY,
    services TEXT, -- Using TEXT as requested (or JSONB)
    prices JSONB, 
    working_hours TEXT,
    special_instructions TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the sample data
INSERT INTO salon_info (
    services, 
    prices, 
    working_hours, 
    special_instructions
) 
VALUES (
    'قص شعر، صبغة، مكياج، عناية بالبشرة', -- services
    '{"قص شعر": 100, "صبغة": 250, "مكياج": 150}'::jsonb, -- prices
    'من 10 صباحاً إلى 10 مساءً', -- working_hours
    'يرجى الحضور قبل الموعد بـ 10 دقائق.' -- special_instructions
);

-- Enable RLS (Optional, but good practice)
ALTER TABLE salon_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for n8n testing ease)
CREATE POLICY "Public Read Access" 
ON salon_info FOR SELECT 
USING (true);
