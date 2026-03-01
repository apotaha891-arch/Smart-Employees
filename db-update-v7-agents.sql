-- db-update-v7-agents.sql
-- Run this in your Supabase SQL Editor to fix the missing columns in the 'agents' table

ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS branding_tone TEXT DEFAULT 'professional';

-- Ensure agents table has metadata column as well, just in case
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
