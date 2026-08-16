-- ============================================================
-- Migration 0008 — Missing tables, RLS policies, and fixes
-- Run this in Supabase SQL Editor to fix all broken public forms
-- ============================================================

-- ------------------------------------------------------------
-- 1. reports table (was never created in tracked migrations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id               TEXT         PRIMARY KEY,
    category         TEXT         NOT NULL DEFAULT '',
    description      TEXT         NOT NULL DEFAULT '',
    location         TEXT         NOT NULL DEFAULT '',
    urgency          TEXT         NOT NULL DEFAULT 'low',
    reporter_name    TEXT         DEFAULT '',
    reporter_contact TEXT         DEFAULT '',
    status           TEXT         NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_anon_insert" ON reports;
CREATE POLICY "reports_anon_insert" ON reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reports_anon_select" ON reports;
CREATE POLICY "reports_anon_select" ON reports FOR SELECT USING (true);

-- Allow status updates via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "reports_anon_update" ON reports;
CREATE POLICY "reports_anon_update" ON reports FOR UPDATE USING (true) WITH CHECK (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_reports_updated_at();

-- ------------------------------------------------------------
-- 2. contact_messages table (was never created in tracked migrations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    name       TEXT         NOT NULL DEFAULT '',
    email      TEXT         NOT NULL DEFAULT '',
    subject    TEXT         NOT NULL DEFAULT '',
    message    TEXT         NOT NULL DEFAULT '',
    status     TEXT         NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_anon_insert" ON contact_messages;
CREATE POLICY "contact_messages_anon_insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Admin reads go through SECURITY DEFINER RPC — no anon SELECT needed

-- ------------------------------------------------------------
-- 3. officials table — ensure it exists with correct columns
--    (referenced in admin panel but DDL may be missing)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS officials (
    id        SERIAL       PRIMARY KEY,
    name      VARCHAR(200) NOT NULL,
    position  VARCHAR(100) NOT NULL DEFAULT '',
    committee VARCHAR(100) DEFAULT '',
    contact   VARCHAR(50)  DEFAULT '',
    email     VARCHAR(255) DEFAULT '',
    since     VARCHAR(20)  DEFAULT '',
    bio       TEXT         DEFAULT '',
    image     TEXT         DEFAULT ''
);

ALTER TABLE officials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "officials_anon_read" ON officials;
CREATE POLICY "officials_anon_read" ON officials FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 4. settings table — ensure it exists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT ''
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_anon_read" ON settings;
CREATE POLICY "settings_anon_read" ON settings FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 5. barangay_info table — ensure it exists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barangay_info (
    id           SERIAL      PRIMARY KEY,
    name         TEXT        DEFAULT 'Barangay Payatas',
    municipality TEXT        DEFAULT 'Quezon City',
    province     TEXT        DEFAULT 'Metro Manila',
    region       TEXT        DEFAULT 'NCR',
    captain      TEXT        DEFAULT '',
    established  TEXT        DEFAULT '',
    population   INT         DEFAULT 0,
    households   INT         DEFAULT 0,
    area         TEXT        DEFAULT '',
    hotline      TEXT        DEFAULT '',
    emergency    TEXT        DEFAULT '',
    email        TEXT        DEFAULT '',
    address      TEXT        DEFAULT '',
    office_hours TEXT        DEFAULT '',
    vision       TEXT        DEFAULT '',
    mission      TEXT        DEFAULT '',
    history      TEXT        DEFAULT '',
    seal_url     TEXT        DEFAULT ''
);

ALTER TABLE barangay_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barangay_info_anon_read" ON barangay_info;
CREATE POLICY "barangay_info_anon_read" ON barangay_info FOR SELECT USING (true);

-- Seed default row if empty
INSERT INTO barangay_info (id, name, municipality, province, region)
VALUES (1, 'Barangay Payatas', 'Quezon City', 'Metro Manila', 'NCR')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. services table — ensure it exists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id           SERIAL       PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         DEFAULT '',
    icon         VARCHAR(50)  DEFAULT 'FileText',
    duration     VARCHAR(50)  DEFAULT '',
    fee          VARCHAR(30)  DEFAULT '',
    requirements JSONB        DEFAULT '[]'
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_anon_read" ON services;
CREATE POLICY "services_anon_read" ON services FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 7. volunteer_signups — ensure status has default + RLS INSERT
-- ------------------------------------------------------------
ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

DROP POLICY IF EXISTS "volunteers_anon_insert" ON volunteer_signups;
CREATE POLICY "volunteers_anon_insert" ON volunteer_signups FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- 8. suggestions — ensure RLS INSERT exists
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "suggestions_anon_insert" ON suggestions;
CREATE POLICY "suggestions_anon_insert" ON suggestions FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. business_registry — ensure RLS INSERT exists
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "business_anon_insert" ON business_registry;
CREATE POLICY "business_anon_insert" ON business_registry FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- 10. clearance_requests — ensure RLS INSERT exists
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "clearance_anon_insert" ON clearance_requests;
CREATE POLICY "clearance_anon_insert" ON clearance_requests FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- 11. Fix rate_limited_insert — final version with ORDER BY key
--     and RAISE EXCEPTION for proper error propagation
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION rate_limited_insert(
    p_identifier TEXT,
    p_form_type  TEXT,
    p_table      TEXT,
    p_data       JSONB
)
RETURNS JSON AS $$
DECLARE
    v_count    INTEGER := 0;
    v_verified BOOLEAN := FALSE;
    v_max      INTEGER := 3;
    v_cols     TEXT;
    v_vals     TEXT;
BEGIN
    SELECT count, is_verified INTO v_count, v_verified
    FROM rate_limits
    WHERE identifier = p_identifier AND form_type = p_form_type;

    v_max := CASE WHEN v_verified THEN 10 ELSE 3 END;

    IF v_count >= v_max THEN
        RAISE EXCEPTION 'Rate limit reached. Please try again later.';
    END IF;

    -- ORDER BY key guarantees cols and vals are always in the same alphabetical order
    SELECT
        string_agg(format('%I', key)  , ', ' ORDER BY key),
        string_agg(format('%L', value), ', ' ORDER BY key)
    INTO v_cols, v_vals
    FROM jsonb_each_text(p_data);

    EXECUTE format('INSERT INTO %I (%s) VALUES (%s)', p_table, v_cols, v_vals);

    INSERT INTO rate_limits (identifier, form_type, count)
    VALUES (p_identifier, p_form_type, 1)
    ON CONFLICT (identifier, form_type)
    DO UPDATE SET count = rate_limits.count + 1;

    IF p_form_type IN ('document', 'clearance', 'report', 'volunteer', 'suggestion', 'contact', 'business') THEN
        INSERT INTO audit_logs (user_name, action, module, details)
        VALUES ('Public', format('Submitted %s via public form', p_form_type), initcap(p_form_type), '');
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 12. Clear stale rate limit rows so blocked test submissions work
-- ------------------------------------------------------------
DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day';

-- ------------------------------------------------------------
-- 13. admin_update_report_status — ensure it exists
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_update_report_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT DEFAULT 'System'
)
RETURNS JSON AS $$
DECLARE v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE reports SET status = p_status, updated_at = NOW() WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated report %s status to %s', p_id, p_status), 'Concerns', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 14. admin_delete_contact_message / admin_update_contact_message_status
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_delete_contact_message(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT DEFAULT 'System'
)
RETURNS JSON AS $$
DECLARE v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM contact_messages WHERE id::TEXT = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Deleted contact message %s', p_id), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_contact_message_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT DEFAULT 'System'
)
RETURNS JSON AS $$
DECLARE v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE contact_messages SET status = p_status WHERE id::TEXT = p_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
