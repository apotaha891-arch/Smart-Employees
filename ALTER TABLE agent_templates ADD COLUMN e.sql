ALTER TABLE agent_templates ADD COLUMN employee_type TEXT DEFAULT 'general';
-- or
ALTER TABLE agents ADD COLUMN employee_type TEXT REFERENCES agent_templates(employee_type);