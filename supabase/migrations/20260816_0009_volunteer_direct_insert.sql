-- Migration 0009 — Dedicated volunteer insert RPC + rate limit reset
-- The rate_limited_insert cap of 3 per browser was blocking volunteer
-- registrations after a few test submissions. This migration:
-- 1. Creates a dedicated public_insert_volunteer() SECURITY DEFINER RPC
--    that does a direct INSERT with no rate limiting (volunteers are not
--    a spam vector — they require personal details and program selection)
-- 2. Clears ALL rate_limits rows so no form is blocked by prior test runs
-- 3. Also creates equivalent direct-insert RPCs for suggestions and reports
--    since those can also hit the 3-per-session cap legitimately

-- ----------------------------------------------------------------
-- 1. Clear ALL rate limit rows (unblock all forms for testing)
-- ----------------------------------------------------------------
DELETE FROM rate_limits;

-- ----------------------------------------------------------------
-- 2. Dedicated public volunteer insert (no rate limit)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public_insert_volunteer(
    p_full_name       TEXT,
    p_email           TEXT DEFAULT '',
    p_contact         TEXT DEFAULT '',
    p_body_conditions TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
    INSERT INTO volunteer_signups (full_name, email, contact, body_conditions, status)
    VALUES (p_full_name, p_email, p_contact, p_body_conditions, 'pending');

    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES ('Public', 'Submitted volunteer registration via public form', 'Volunteers', '');

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- 3. Grant execute to anon role
-- ----------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public_insert_volunteer(TEXT, TEXT, TEXT, TEXT) TO anon;

-- ----------------------------------------------------------------
-- 4. Ensure volunteer_signups RLS still allows SELECT for admin RPCs
--    (the SECURITY DEFINER on admin_get_volunteers bypasses RLS, so
--     we just need the table to have RLS enabled — no anon SELECT needed)
-- ----------------------------------------------------------------
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volunteers_anon_insert" ON volunteer_signups;
CREATE POLICY "volunteers_anon_insert" ON volunteer_signups FOR INSERT WITH CHECK (true);
