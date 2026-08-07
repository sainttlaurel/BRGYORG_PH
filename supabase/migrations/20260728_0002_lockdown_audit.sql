CREATE OR REPLACE FUNCTION search_residents(p_query TEXT, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    v_pattern TEXT;
BEGIN
    v_pattern := '%' || COALESCE(p_query, '') || '%';

    RETURN (
        SELECT json_agg(row_to_json(t))
        FROM (
            SELECT
                id,
                fname || ' ' || lname AS full_name,
                purok,
                status,
                registered
            FROM residents
            WHERE status = 'Active'
              AND (fname || ' ' || lname ILIKE v_pattern OR id ILIKE v_pattern)
            ORDER BY lname, fname
            LIMIT p_limit OFFSET p_offset
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_residents(
    p_token TEXT, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    RETURN json_agg(r ORDER BY r.lname, r.fname)
    FROM (SELECT * FROM residents LIMIT p_limit OFFSET p_offset) r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_residents_count(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_count INT;
BEGIN
    v_session := require_session(p_token);
    SELECT COUNT(*) INTO v_count FROM residents;
    RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_documents(
    p_token TEXT, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    RETURN json_agg(d ORDER BY d.date DESC)
    FROM (SELECT * FROM documents ORDER BY date DESC LIMIT p_limit OFFSET p_offset) d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_documents_count(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_count INT;
BEGIN
    v_session := require_session(p_token);
    SELECT COUNT(*) INTO v_count FROM documents;
    RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_complaints(
    p_token TEXT, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    RETURN json_agg(c ORDER BY c.date DESC)
    FROM (SELECT * FROM complaints ORDER BY date DESC LIMIT p_limit OFFSET p_offset) c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_complaints_count(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_count INT;
BEGIN
    v_session := require_session(p_token);
    SELECT COUNT(*) INTO v_count FROM complaints;
    RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS login_attempts (
    ip_hash     TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_hash, attempted_at DESC);
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_login_rate_limit(p_ip_hash TEXT)
RETURNS JSON AS $$
DECLARE
    v_recent INT;
BEGIN
    -- Clean old entries
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '15 minutes';

    SELECT COUNT(*) INTO v_recent
    FROM login_attempts
    WHERE ip_hash = p_ip_hash AND attempted_at > NOW() - INTERVAL '15 minutes';

    IF v_recent >= 5 THEN
        RETURN json_build_object('allowed', false, 'error', 'Too many login attempts. Try again in 15 minutes.');
    END IF;

    INSERT INTO login_attempts (ip_hash) VALUES (p_ip_hash);
    RETURN json_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION authenticate_user(p_login TEXT, p_password TEXT, p_ip_hash TEXT DEFAULT '')
RETURNS JSON AS $$
DECLARE
    u users%ROWTYPE;
    v_token TEXT;
    v_session_id INT;
    v_rate_check JSON;
BEGIN
    IF p_ip_hash != '' THEN
        v_rate_check := check_login_rate_limit(p_ip_hash);
        IF NOT (v_rate_check->>'allowed')::BOOLEAN THEN
            RETURN json_build_object('success', false, 'error', v_rate_check->>'error');
        END IF;
    END IF;

    SELECT * INTO u FROM users
    WHERE username = p_login OR email = p_login
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
    END IF;

    IF u.status = 'Suspended' THEN
        RETURN json_build_object('success', false, 'error', 'Your account has been suspended.');
    END IF;

    IF u.password = crypt(p_password, u.password) THEN
        UPDATE users SET last_active = to_char(NOW(), 'Mon DD, YYYY HH24:MI') WHERE id = u.id;

        v_token := encode(gen_random_bytes(32), 'hex');

        INSERT INTO admin_sessions (token, user_id, role, expires_at)
        VALUES (v_token, u.id, u.role, NOW() + INTERVAL '8 hours')
        RETURNING id INTO v_session_id;

        RETURN json_build_object(
            'success', true,
            'token', v_token,
            'user', row_to_json(u)
        );
    END IF;

    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "settings_anon_read" ON settings;
CREATE POLICY "settings_anon_read" ON settings FOR SELECT USING (true);

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('residents','documents','complaints','projects',
            'announcements','clearance_requests','suggestions','polls',
            'volunteer_signups','business_registry','settings','barangay_info',
            'services','service_fees','contact_messages','reports')
          AND (policyname LIKE '%anon_write%' OR policyname LIKE '%_anon_update%')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
    END LOOP;
END;
$$;
