-- Add cost_per_request to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS cost_per_request INTEGER DEFAULT 1;

-- Update existing agents to have default cost of 1
UPDATE agents SET cost_per_request = 1 WHERE cost_per_request IS NULL;

-- (Optional) If we want specific types to be more expensive, we can update them here based on specialty
-- UPDATE agents SET cost_per_request = 3 WHERE specialty = 'Sales Specialist';
