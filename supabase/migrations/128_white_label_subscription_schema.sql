-- Migration 128: White Label Subscription Tracking
-- This identifies which agencies have paid for the $50/mo feature

-- 1. Add columns to track payment status and stripe subscription
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_white_label_paid BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS white_label_sub_id TEXT; -- Stripe subscription ID for WL feature

-- 2. Add comment for clarity
COMMENT ON COLUMN public.profiles.is_white_label_paid IS 'Tracks if the agency has a paid active subscription for the White Label (Hide Credits) feature.';

-- 3. Ensure RLS allows the user to read their own paid status
-- (Typically profiles already have read access for own records)
