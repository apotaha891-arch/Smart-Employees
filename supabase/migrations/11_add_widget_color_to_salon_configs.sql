-- Add widget_color column for the website chatbot customization

ALTER TABLE salon_configs 
ADD COLUMN IF NOT EXISTS widget_color TEXT DEFAULT '#8B5CF6';
