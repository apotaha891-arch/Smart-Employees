-- ============================================================
-- 123_admin_support_rls_policies.sql
-- Comprehensive RLS fix: Allows Admins to read ALL client data
-- during support/impersonation sessions via SECURITY DEFINER RPCs.
-- This is the SINGLE SOURCE OF TRUTH for all support access.
-- ============================================================

-- ─── 1. ENTITIES ────────────────────────────────────────────
-- Admins need to find entity_id for a client to load bookings.

DROP POLICY IF EXISTS "admin_can_read_all_entities" ON public.entities;
CREATE POLICY "admin_can_read_all_entities"
ON public.entities FOR SELECT
USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_agency = true AND id = (
            SELECT agency_id FROM public.profiles WHERE id = entities.user_id
        )
    )
);

-- ─── 2. BOOKINGS ────────────────────────────────────────────
-- The bookings page filters by entity_id — Admin must be able to read them.

DROP POLICY IF EXISTS "admin_can_read_all_bookings" ON public.bookings;
CREATE POLICY "admin_can_read_all_bookings"
ON public.bookings FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = bookings.entity_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.entities e ON e.user_id = p.id
        WHERE e.id = bookings.entity_id AND p.agency_id = auth.uid()
    )
);

-- ─── 3. CUSTOMERS ────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_can_read_all_customers" ON public.customers;
CREATE POLICY "admin_can_read_all_customers"
ON public.customers FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = customers.entity_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.entities e ON e.user_id = p.id
        WHERE e.id = customers.entity_id AND p.agency_id = auth.uid()
    )
);

-- ─── 4. AGENTS ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_can_read_all_agents" ON public.agents;
CREATE POLICY "admin_can_read_all_agents"
ON public.agents FOR SELECT
USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agency = true
        AND auth.uid() = (SELECT agency_id FROM public.profiles WHERE id = agents.user_id)
    )
);

-- ─── 5. WALLET_CREDITS ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_can_read_all_wallets" ON public.wallet_credits;
CREATE POLICY "admin_can_read_all_wallets"
ON public.wallet_credits FOR SELECT
USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agency = true
        AND auth.uid() = (SELECT agency_id FROM public.profiles WHERE id = wallet_credits.user_id)
    )
);

-- ─── 6. PROFILES ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_can_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_can_read_all_profiles"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_agency = true)
        AND profiles.agency_id = auth.uid()
    )
);

-- ─── 7. TASKS ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_can_read_all_tasks" ON public.tasks;
CREATE POLICY "admin_can_read_all_tasks"
ON public.tasks FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.agents WHERE id = tasks.agent_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.agents ag
        JOIN public.profiles p ON p.id = ag.user_id
        WHERE ag.id = tasks.agent_id AND p.agency_id = auth.uid()
    )
);

-- ─── 8. INTEGRATIONS ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_can_read_all_integrations" ON public.integrations;
CREATE POLICY "admin_can_read_all_integrations"
ON public.integrations FOR SELECT
USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_agency = true
        AND auth.uid() = (SELECT agency_id FROM public.profiles WHERE id = integrations.user_id)
    )
);
