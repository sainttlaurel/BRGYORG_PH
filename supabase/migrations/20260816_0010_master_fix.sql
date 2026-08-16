-- ================================================================
-- MASTER FIX MIGRATION — Run this ONCE in Supabase SQL Editor
-- Fixes ALL known issues across every public form and admin page
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. MISSING TABLES
-- ================================================================

-- reports (was missing from all prior tracked migrations)
CREATE TABLE IF NOT EXISTS reports (
    id               TEXT        PRIMARY KEY,
    category         TEXT        NOT NULL DEFAULT '',
    description      TEXT        NOT NULL DEFAULT '',
    location         TEXT        NOT NULL DEFAULT '',
    urgency          TEXT        NOT NULL DEFAULT 'low',
    reporter_name    TEXT        DEFAULT '',
    reporter_contact TEXT        DEFAULT '',
    status           TEXT        NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- contact_messages (was missing from all prior tracked migrations)
CREATE TABLE IF NOT EXISTS contact_messages (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name       TEXT        NOT NULL DEFAULT '',
    email      TEXT        NOT NULL DEFAULT '',
    subject    TEXT        NOT NULL DEFAULT '',
    message    TEXT        NOT NULL DEFAULT '',
    status     TEXT        NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- officials
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

-- settings
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

-- service_fees (referenced by admin_update_service_fee but never created)
CREATE TABLE IF NOT EXISTS service_fees (
    id      SERIAL PRIMARY KEY,
    service TEXT   NOT NULL,
    fee     INT    NOT NULL DEFAULT 0
);

-- barangay_info
CREATE TABLE IF NOT EXISTS barangay_info (
    id           SERIAL PRIMARY KEY,
    name         TEXT DEFAULT 'Barangay Payatas',
    municipality TEXT DEFAULT 'Quezon City',
    province     TEXT DEFAULT 'Metro Manila',
    region       TEXT DEFAULT 'NCR',
    captain      TEXT DEFAULT '',
    established  TEXT DEFAULT '',
    population   INT  DEFAULT 0,
    households   INT  DEFAULT 0,
    area         TEXT DEFAULT '',
    hotline      TEXT DEFAULT '',
    emergency    TEXT DEFAULT '',
    email        TEXT DEFAULT '',
    address      TEXT DEFAULT '',
    office_hours TEXT DEFAULT '',
    vision       TEXT DEFAULT '',
    mission      TEXT DEFAULT '',
    history      TEXT DEFAULT '',
    seal_url     TEXT DEFAULT ''
);
INSERT INTO barangay_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- services
CREATE TABLE IF NOT EXISTS services (
    id           SERIAL       PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         DEFAULT '',
    icon         VARCHAR(50)  DEFAULT 'FileText',
    duration     VARCHAR(50)  DEFAULT '',
    fee          VARCHAR(30)  DEFAULT '',
    requirements JSONB        DEFAULT '[]'
);

-- ================================================================
-- 2. ALTER EXISTING TABLES — add missing columns
-- ================================================================
ALTER TABLE residents           ADD COLUMN IF NOT EXISTS household    TEXT DEFAULT '';
ALTER TABLE residents           ADD COLUMN IF NOT EXISTS occupation   TEXT DEFAULT '';
ALTER TABLE residents           ADD COLUMN IF NOT EXISTS civil_status TEXT DEFAULT '';
ALTER TABLE documents           ADD COLUMN IF NOT EXISTS id_upload    TEXT DEFAULT '';
ALTER TABLE complaints          ADD COLUMN IF NOT EXISTS respondent   VARCHAR(100) DEFAULT '';
ALTER TABLE complaints          ADD COLUMN IF NOT EXISTS time         VARCHAR(20)  DEFAULT '';
ALTER TABLE complaints          ADD COLUMN IF NOT EXISTS location     TEXT DEFAULT '';
ALTER TABLE complaints          ADD COLUMN IF NOT EXISTS handler      VARCHAR(100) DEFAULT '';
ALTER TABLE announcements       ADD COLUMN IF NOT EXISTS priority     VARCHAR(20) DEFAULT 'normal';
ALTER TABLE announcements       ADD COLUMN IF NOT EXISTS visible      BOOLEAN     DEFAULT TRUE;
ALTER TABLE volunteer_signups   ADD COLUMN IF NOT EXISTS status       TEXT        DEFAULT 'pending';

-- ================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ================================================================
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE barangay_info     ENABLE ROW LEVEL SECURITY;
ALTER TABLE services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_fees      ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 4. RLS POLICIES — drop stale, recreate clean
-- ================================================================

-- Drop all existing anon-write / anon-read policies to start clean
DO $$ DECLARE rec RECORD; BEGIN
  FOR rec IN (
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE tablename IN (
      'residents','documents','complaints','projects','announcements',
      'clearance_requests','suggestions','polls','volunteer_signups',
      'business_registry','settings','barangay_info','services',
      'contact_messages','reports','officials','audit_logs'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

-- Public READ policies (anon can SELECT)
CREATE POLICY "anon_read" ON announcements       FOR SELECT USING (true);
CREATE POLICY "anon_read" ON polls               FOR SELECT USING (status = 'active');
CREATE POLICY "anon_read" ON projects            FOR SELECT USING (true);
CREATE POLICY "anon_read" ON officials           FOR SELECT USING (true);
CREATE POLICY "anon_read" ON settings            FOR SELECT USING (true);
CREATE POLICY "anon_read" ON barangay_info       FOR SELECT USING (true);
CREATE POLICY "anon_read" ON services            FOR SELECT USING (true);
CREATE POLICY "anon_read" ON reports             FOR SELECT USING (true);
CREATE POLICY "anon_read" ON suggestions         FOR SELECT USING (status = 'published');

-- Public INSERT policies (anon can INSERT via rate_limited_insert SECURITY DEFINER)
CREATE POLICY "anon_insert" ON documents         FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON reports           FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON contact_messages  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON suggestions       FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON volunteer_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON business_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON clearance_requests FOR INSERT WITH CHECK (true);

-- Polls update (cast_vote uses SECURITY DEFINER so this is backup)
CREATE POLICY "anon_vote" ON polls FOR UPDATE USING (status = 'active') WITH CHECK (true);

-- Audit logs: admin reads via RPC (SECURITY DEFINER bypasses RLS)
-- No anon SELECT on audit_logs, residents, documents, complaints, clearance_requests

-- ================================================================
-- 5. TRIGGERS
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- 6. INDEXES (idempotent)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created    ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created    ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status     ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_time   ON rate_limits(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_module       ON audit_logs(module);

-- ================================================================
-- 7. CLEAR RATE LIMITS (unblock all forms)
-- ================================================================
DELETE FROM rate_limits;

-- ================================================================
-- 8. rate_limited_insert — FINAL definitive version
--    ORDER BY key on both string_agg + RAISE EXCEPTION on failure
-- ================================================================
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
    v_max      INTEGER := 10;
    v_cols     TEXT;
    v_vals     TEXT;
BEGIN
    SELECT count, is_verified INTO v_count, v_verified
    FROM rate_limits
    WHERE identifier = p_identifier AND form_type = p_form_type;

    -- Raise limit to 10 unverified (was 3 — too low for testing + real use)
    v_max := CASE WHEN v_verified THEN 50 ELSE 10 END;

    IF v_count >= v_max THEN
        RAISE EXCEPTION 'Rate limit reached. Please try again later.';
    END IF;

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

    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES ('Public',
            format('Submitted %s via public form', p_form_type),
            initcap(p_form_type), '');

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 9. public_insert_volunteer — dedicated RPC, no rate limit
-- ================================================================
CREATE OR REPLACE FUNCTION public_insert_volunteer(
    p_full_name       TEXT,
    p_email           TEXT DEFAULT '',
    p_contact         TEXT DEFAULT '',
    p_body_conditions TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
    INSERT INTO volunteer_signups
        (full_name, email, contact, body_conditions, status)
    VALUES
        (p_full_name, COALESCE(p_email,''), COALESCE(p_contact,''),
         COALESCE(p_body_conditions,''), 'pending');

    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES ('Public', 'Submitted volunteer registration', 'Volunteers', '');

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public_insert_volunteer(TEXT, TEXT, TEXT, TEXT) TO anon;

-- ================================================================
-- 10. ADMIN READ RPCs — ensure all exist
-- ================================================================
CREATE OR REPLACE FUNCTION admin_get_suggestions(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
            FROM (SELECT * FROM suggestions ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_volunteers(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
            FROM (SELECT * FROM volunteer_signups ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_reports(
    p_token TEXT, p_limit INT DEFAULT 200, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
            FROM (SELECT * FROM reports ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_reports_count(p_token TEXT)
RETURNS JSON AS $$
DECLARE v_count INT;
BEGIN
    PERFORM require_session(p_token);
    SELECT COUNT(*) INTO v_count FROM reports;
    RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_contact_messages(
    p_token TEXT, p_limit INT DEFAULT 200, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(c ORDER BY c.created_at DESC)
            FROM (SELECT * FROM contact_messages ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) c);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_contact_messages_count(p_token TEXT)
RETURNS JSON AS $$
DECLARE v_count INT;
BEGIN
    PERFORM require_session(p_token);
    SELECT COUNT(*) INTO v_count FROM contact_messages;
    RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 11. ADMIN WRITE RPCs — ensure all exist with correct signatures
-- ================================================================

CREATE OR REPLACE FUNCTION admin_update_report_status(
    p_token TEXT, p_id TEXT, p_status TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE reports SET status = p_status, updated_at = NOW() WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated report %s → %s', p_id, p_status), 'Concerns', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_contact_message(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    DELETE FROM contact_messages WHERE id = p_id::UUID;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Deleted contact message %s', p_id), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_contact_message_status(
    p_token TEXT, p_id TEXT, p_status TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE contact_messages SET status = p_status WHERE id = p_id::UUID;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated contact message %s → %s', p_id, p_status), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_volunteer_status(
    p_token TEXT, p_id TEXT, p_status TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE volunteer_signups SET status = p_status WHERE id = p_id::UUID;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated volunteer %s → %s', p_id, p_status), 'Volunteers', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_suggestion_status(
    p_token TEXT, p_id TEXT, p_status TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE suggestions SET status = p_status WHERE id = p_id::UUID;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated suggestion %s → %s', p_id, p_status), 'Suggestions', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_reply_suggestion(
    p_token TEXT, p_id TEXT, p_admin_reply TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE suggestions SET admin_reply = p_admin_reply, status = 'published'
    WHERE id = p_id::UUID;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Replied to suggestion %s', p_id), 'Suggestions', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_officials(p_token TEXT)
RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(o ORDER BY o.id) FROM officials o);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_settings(p_token TEXT)
RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(s ORDER BY s.key) FROM settings s);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_barangay_info(p_token TEXT)
RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT row_to_json(b) FROM barangay_info b WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_upsert_setting(
    p_token TEXT, p_key TEXT, p_value TEXT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    INSERT INTO settings (key, value) VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated setting %s', p_key), 'Settings', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_barangay_info(
    p_token TEXT, p_data JSONB,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE barangay_info SET
        name         = COALESCE(p_data->>'name',         name),
        municipality = COALESCE(p_data->>'municipality', municipality),
        captain      = COALESCE(p_data->>'captain',      captain),
        hotline      = COALESCE(p_data->>'hotline',      hotline),
        emergency    = COALESCE(p_data->>'emergency',    emergency),
        email        = COALESCE(p_data->>'email',        email),
        address      = COALESCE(p_data->>'address',      address),
        office_hours = COALESCE(p_data->>'office_hours', office_hours),
        vision       = COALESCE(p_data->>'vision',       vision),
        mission      = COALESCE(p_data->>'mission',      mission),
        history      = COALESCE(p_data->>'history',      history),
        seal_url     = COALESCE(p_data->>'seal_url',     seal_url)
    WHERE id = 1;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            'Updated barangay profile', 'Settings', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_service_fee(
    p_token TEXT, p_id INT, p_fee INT,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
DECLARE v_service TEXT;
BEGIN
    PERFORM require_session(p_token);
    SELECT service INTO v_service FROM service_fees WHERE id = p_id;
    UPDATE service_fees SET fee = p_fee WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated fee for %s to %s', COALESCE(v_service, p_id::TEXT), p_fee),
            'Settings', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_log_action(
    p_token TEXT, p_user_name TEXT, p_action TEXT,
    p_module TEXT DEFAULT '', p_details TEXT DEFAULT ''
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_user_name,''),'System'),
            p_action, p_module, COALESCE(p_details,''));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 12. CLEARANCE + BUSINESS + PROJECT RPCs (ensure clean versions)
-- ================================================================
CREATE OR REPLACE FUNCTION admin_get_clearance_requests(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
            FROM (SELECT * FROM clearance_requests ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_clearance_request(
    p_token TEXT, p_id UUID, p_data JSONB,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE clearance_requests SET
        status      = COALESCE(p_data->>'status',      status),
        notes       = COALESCE(p_data->>'notes',       notes),
        remarks     = COALESCE(p_data->>'remarks',     remarks),
        approved_at = CASE WHEN p_data->>'status' = 'approved'
                           THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN p_data->>'status' = 'rejected'
                           THEN NOW() ELSE rejected_at END
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated clearance %s → %s', p_id, COALESCE(p_data->>'status','')),
            'Clearance', COALESCE(p_data->>'notes',''));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_business_registry(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
            FROM (SELECT * FROM business_registry ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_insert_business(
    p_token TEXT, p_name TEXT, p_owner TEXT, p_category TEXT,
    p_contact TEXT DEFAULT '', p_address TEXT DEFAULT '',
    p_description TEXT DEFAULT '', p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    INSERT INTO business_registry (name, owner, category, contact, address, description, status)
    VALUES (p_name, p_owner, p_category,
            COALESCE(p_contact,''), COALESCE(p_address,''),
            COALESCE(p_description,''), 'pending');
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Registered business: %s', p_name), 'Business',
            format('Owner: %s', p_owner));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_business(
    p_token TEXT, p_id UUID, p_data JSONB,
    p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    UPDATE business_registry SET
        name        = COALESCE(p_data->>'name',        name),
        owner       = COALESCE(p_data->>'owner',       owner),
        category    = COALESCE(p_data->>'category',    category),
        contact     = COALESCE(p_data->>'contact',     contact),
        address     = COALESCE(p_data->>'address',     address),
        description = COALESCE(p_data->>'description', description),
        status      = COALESCE(p_data->>'status',      status)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Updated business %s', p_id), 'Business', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_business(
    p_token TEXT, p_id UUID, p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    DELETE FROM business_registry WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            format('Deleted business %s', p_id), 'Business', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 13. DOCUMENT / RESIDENT / BLOTTER / ANNOUNCEMENT RPCs (clean)
-- ================================================================
CREATE OR REPLACE FUNCTION admin_get_documents(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(d ORDER BY d.created_at DESC)
            FROM (SELECT * FROM documents ORDER BY created_at DESC
                  LIMIT p_limit OFFSET p_offset) d);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_residents(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.lname, r.fname)
            FROM (SELECT * FROM residents LIMIT p_limit OFFSET p_offset) r);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_complaints(
    p_token TEXT, p_limit INT DEFAULT 500, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(c ORDER BY c.date DESC)
            FROM (SELECT * FROM complaints ORDER BY date DESC
                  LIMIT p_limit OFFSET p_offset) c);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_clear_documents(
    p_token TEXT, p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    DELETE FROM documents;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            'Cleared all document requests', 'Documents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_clear_residents(
    p_token TEXT, p_logged_in_user TEXT DEFAULT 'System'
) RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    DELETE FROM residents;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user,''),'System'),
            'Cleared all residents', 'Residents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 14. PUBLIC SEARCH RPCs (no auth required)
-- ================================================================
CREATE OR REPLACE FUNCTION get_document_status(p_query TEXT)
RETURNS TABLE (
    id TEXT, resident VARCHAR, type VARCHAR,
    purpose TEXT, status VARCHAR, date VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.resident, d.type, d.purpose, d.status, d.date
    FROM documents d
    WHERE d.id ILIKE '%' || p_query || '%'
       OR d.resident ILIKE '%' || p_query || '%'
    ORDER BY d.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_clearance_status(
    p_control_number TEXT, p_verification_code TEXT
) RETURNS JSON AS $$
DECLARE v_row clearance_requests%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM clearance_requests
    WHERE control_number = p_control_number
      AND verification_code = p_verification_code;

    IF NOT FOUND THEN
        RETURN json_build_object('found', false,
            'error', 'No matching request found. Check your control number and verification code.');
    END IF;

    RETURN json_build_object(
        'found',       true,
        'status',      v_row.status,
        'doc_type',    v_row.doc_type,
        'full_name',   v_row.full_name,
        'created_at',  v_row.created_at,
        'approved_at', v_row.approved_at,
        'rejected_at', v_row.rejected_at,
        'notes',       v_row.notes
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_residents(
    p_query TEXT, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
) RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(t))
        FROM (
            SELECT id,
                   fname || ' ' || lname AS full_name,
                   purok, status, registered
            FROM residents
            WHERE status = 'Active'
              AND (fname || ' ' || lname ILIKE '%' || p_query || '%'
                   OR id ILIKE '%' || p_query || '%')
            ORDER BY lname, fname
            LIMIT p_limit OFFSET p_offset
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 15. CAST_VOTE — final version (UUID poll_id, IP-based dedup)
-- ================================================================
DROP FUNCTION IF EXISTS cast_vote(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS cast_vote(TEXT, INT);

CREATE OR REPLACE FUNCTION cast_vote(p_poll_id UUID, p_option_index INT)
RETURNS JSON AS $$
DECLARE
    v_hash TEXT;
    v_poll polls%ROWTYPE;
BEGIN
    v_hash := md5(COALESCE(
        NULLIF(split_part(
            current_setting('request.headers', true)::json ->> 'x-forwarded-for',
            ',', 1), ''),
        'unknown'));

    SELECT * INTO v_poll FROM polls WHERE id = p_poll_id AND status = 'active';
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Poll not found or not active.');
    END IF;

    IF p_option_index < 0 OR p_option_index >= jsonb_array_length(v_poll.options) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid option.');
    END IF;

    BEGIN
        INSERT INTO poll_votes (poll_id, voter_ip, option_index)
        VALUES (p_poll_id, v_hash, p_option_index);
    EXCEPTION WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'error', 'You have already voted.');
    END;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 16. USER MANAGEMENT RPCs (token-gated, Admin only)
-- ================================================================
CREATE OR REPLACE FUNCTION get_users(p_token TEXT)
RETURNS JSON AS $$
BEGIN
    PERFORM require_admin(p_token);
    RETURN (SELECT json_agg(json_build_object(
        'id', id, 'name', name, 'username', username, 'role', role,
        'email', email, 'status', status, 'last_active', last_active,
        'initials', initials, 'created_at', created_at
    ) ORDER BY id) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user(
    p_token TEXT, p_id INT, p_name TEXT, p_username TEXT,
    p_email TEXT, p_password TEXT, p_role TEXT, p_initials TEXT
) RETURNS JSON AS $$
DECLARE v_session JSON; v_user users%ROWTYPE;
BEGIN
    v_session := require_admin(p_token);
    INSERT INTO users (id, name, username, email, password, role, status, initials)
    VALUES (p_id, p_name, p_username, p_email,
            crypt(p_password, gen_salt('bf')), p_role, 'Active', p_initials)
    RETURNING * INTO v_user;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id',
            format('Created user %s (%s)', p_username, p_role), 'Users', '');
    RETURN row_to_json(v_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user(
    p_token TEXT, p_id INT, p_name TEXT, p_username TEXT,
    p_email TEXT, p_role TEXT, p_initials TEXT
) RETURNS JSON AS $$
DECLARE v_session JSON; v_user users%ROWTYPE;
BEGIN
    v_session := require_admin(p_token);
    UPDATE users SET name = p_name, username = p_username, email = p_email,
        role = p_role, initials = p_initials
    WHERE id = p_id RETURNING * INTO v_user;
    IF NOT FOUND THEN RETURN json_build_object('success',false,'error','User not found'); END IF;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Updated user %s', p_username), 'Users', '');
    RETURN row_to_json(v_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_status(p_token TEXT, p_id INT, p_status TEXT)
RETURNS JSON AS $$
DECLARE v_session JSON;
BEGIN
    v_session := require_admin(p_token);
    UPDATE users SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id',
            format('Set user %s status → %s', p_id, p_status), 'Users', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_user(p_token TEXT, p_id INT)
RETURNS JSON AS $$
DECLARE v_session JSON;
BEGIN
    v_session := require_admin(p_token);
    DELETE FROM users WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Deleted user %s', p_id), 'Users', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 17. SEED DATA — only insert if tables are empty
-- ================================================================

-- barangay_info seed
INSERT INTO barangay_info (
    id, name, municipality, province, region, captain, established,
    population, households, area, hotline, emergency, email, address,
    office_hours, vision, mission, history
) VALUES (
    1, 'Barangay Payatas', 'Quezon City', 'Metro Manila', 'NCR',
    'Hon. Maria Santos Cruz', '1945', 12458, 3125, '2.4 sq km',
    '+63 2 8123 4567', '911', 'payatas.ledger@qc.gov.ph',
    'Litex Road, Barangay Payatas, QC 1119',
    'Monday – Friday, 8:00 AM – 5:00 PM',
    'A progressive, peaceful, and prosperous barangay.',
    'To deliver efficient and transparent public service.',
    'Barangay Payatas is located along Litex Road, Quezon City.'
) ON CONFLICT (id) DO NOTHING;

-- services seed (if empty)
INSERT INTO services (title, description, icon, duration, fee, requirements)
SELECT * FROM (VALUES
  ('Barangay Clearance','Official certification of residency in good standing','FileCheck','30 mins','₱50','["Valid ID","Proof of Residency"]'),
  ('Barangay Certificate','General certificate for employment, school, etc.','Award','30 mins','₱30','["Valid ID","Purpose Statement"]'),
  ('Certificate of Indigency','Proof of financial status for assistance','Heart','1 hour','Free','["Valid ID","Proof of Income"]'),
  ('Certificate of Residency','Confirms legitimate residency in the barangay','Home','30 mins','₱30','["Valid ID","Utility Bill"]'),
  ('Business Clearance','Required for business permit renewal','Briefcase','2-3 days','₱200','["DTI/SEC Registration","Tax Clearance"]'),
  ('Blotter Report','Official record of incidents or disputes','Shield','1-2 hours','Free','["Valid ID","Written Complaint"]'),
  ('Good Moral Certificate','Attests good character and moral standing','Star','1 hour','₱50','["Valid ID","2 Endorsement Letters"]'),
  ('Certification for Solo Parent','Recognition as solo parent for government benefits','Users','3-5 days','Free','["Birth Certificate","Death Certificate if widowed"]')
) AS v(title, description, icon, duration, fee, requirements)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- ================================================================
-- 18. REALTIME — enable for all public-submission tables
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE clearance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE business_registry;
ALTER PUBLICATION supabase_realtime ADD TABLE contact_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE volunteer_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE officials;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- ================================================================
-- DONE — all tables, policies, RPCs, and triggers are now in sync
-- ================================================================
