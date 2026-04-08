-- ============================================================
-- 115_migrate_legacy_balances_and_profit_tracking.sql
-- 1. Migrates legacy total balance to the new 'topup' bucket.
-- 2. Adds financial tracking columns for Profit/Loss analysis.
-- ============================================================

BEGIN;

-- 1. DATA MIGRATION: 
-- Move existing total balance into topup_balance where buckets are currently zero.
-- This ensures that customers like "عيادة د. امتنان" see their 5,044 points correctly.
UPDATE public.wallet_credits
SET 
    topup_balance = balance,
    package_balance = 0
WHERE (package_balance = 0 AND topup_balance = 0 AND balance > 0);

-- 2. SCHEMA ENHANCEMENT:
-- Add revenue and cost tracking to the ledger
ALTER TABLE public.wallet_ledger 
ADD COLUMN IF NOT EXISTS usd_revenue DECIMAL(10,4) DEFAULT 0, -- Real money earned from Stripe
ADD COLUMN IF NOT EXISTS usd_cost    DECIMAL(10,4) DEFAULT 0; -- Technical cost (Tokens/API)

-- Add comment for admin clarity
COMMENT ON COLUMN public.wallet_ledger.usd_revenue IS 'Real money received in USD/SAR for top-ups or subscriptions.';
COMMENT ON COLUMN public.wallet_ledger.usd_cost IS 'Estimated material cost (OpenAI/Meta API) for this transaction.';

-- 3. INITIAL COST ESTIMATES (Updating existing deductions if possible)
-- We set a baseline cost of $0.0005 per point deducted for historical usage tracking
UPDATE public.wallet_ledger
SET usd_cost = ABS(amount) * 0.0005
WHERE amount < 0 AND usd_cost = 0;

COMMIT;
