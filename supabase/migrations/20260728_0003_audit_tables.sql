CREATE TABLE IF NOT EXISTS audit_logs (
    id           SERIAL PRIMARY KEY,
    user_name    TEXT NOT NULL DEFAULT 'unknown',
    action       TEXT NOT NULL,
    module       TEXT NOT NULL DEFAULT '',
    details      TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module  ON audit_logs(module);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS respondent VARCHAR(100) DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS time       VARCHAR(20)  DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location   TEXT         DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS handler    VARCHAR(100) DEFAULT '';

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS visible  BOOLEAN     DEFAULT TRUE;

CREATE OR REPLACE FUNCTION current_client_ip()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        NULLIF(
            split_part(
                current_setting('request.headers', true)::json ->> 'x-forwarded-for',
                ',', 1
            ),
            ''
        ),
        'unknown'
    );
$$;

CREATE OR REPLACE FUNCTION require_admin(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    IF v_session->>'role' != 'Admin' THEN
        RAISE EXCEPTION 'AUTH_FORBIDDEN: admin role required, got %', v_session->>'role';
    END IF;
    RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_users(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_admin(p_token);
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', id, 'name', name, 'username', username,
                'role', role, 'email', email, 'status', status,
                'last_active', last_active, 'initials', initials,
                'created_at', created_at
            ) ORDER BY id
        ) FROM users
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user(
    p_token TEXT, p_id INT, p_name TEXT, p_username TEXT, p_email TEXT,
    p_password TEXT, p_role TEXT, p_initials TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_user users%ROWTYPE;
BEGIN
    v_session := require_admin(p_token);
    INSERT INTO users (id, name, username, email, password, role, status, initials)
    VALUES (p_id, p_name, p_username, p_email, crypt(p_password, gen_salt('bf')), p_role, 'Active', p_initials)
    RETURNING * INTO v_user;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Created user %s (%s)', p_username, p_role), 'Users', '');
    RETURN json_build_object('id', v_user.id, 'name', v_user.name, 'username', v_user.username,
        'role', v_user.role, 'email', v_user.email, 'status', v_user.status,
        'last_active', v_user.last_active, 'initials', v_user.initials, 'created_at', v_user.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user(
    p_token TEXT, p_id INT, p_name TEXT, p_username TEXT, p_email TEXT,
    p_role TEXT, p_initials TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_user users%ROWTYPE;
BEGIN
    v_session := require_admin(p_token);
    UPDATE users SET name = p_name, username = p_username, email = p_email,
        role = p_role, initials = p_initials
    WHERE id = p_id RETURNING * INTO v_user;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Updated user %s', p_username), 'Users', '');
    RETURN json_build_object('id', v_user.id, 'name', v_user.name, 'username', v_user.username,
        'role', v_user.role, 'email', v_user.email, 'status', v_user.status,
        'last_active', v_user.last_active, 'initials', v_user.initials);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_status(p_token TEXT, p_id INT, p_status TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_admin(p_token);
    UPDATE users SET status = p_status WHERE id = p_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Set user %s status to %s', p_id, p_status), 'Users', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_user(p_token TEXT, p_id INT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_admin(p_token);
    DELETE FROM users WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (v_session->>'user_id', format('Deleted user %s', p_id), 'Users', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "residents_anon_read" ON residents;

DROP POLICY IF EXISTS "documents_anon_read" ON documents;

DROP POLICY IF EXISTS "complaints_anon_read" ON complaints;

DROP POLICY IF EXISTS "suggestions_anon_read" ON suggestions;
CREATE POLICY "suggestions_anon_read" ON suggestions FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "clearance_anon_read" ON clearance_requests;

DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION authenticate_user(p_login TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    u             users%ROWTYPE;
    v_ip          TEXT := current_client_ip();
    v_recent_fail INT;
    v_token       TEXT;
    v_session_id  INT;
BEGIN
    -- Rate limit: 5 failures per 15 minutes from same IP
    INSERT INTO login_attempts (ip_hash) VALUES (v_ip);

    SELECT COUNT(*) INTO v_recent_fail
    FROM login_attempts
    WHERE ip_hash = v_ip
      AND attempted_at > NOW() - INTERVAL '15 minutes';

    -- Delete old records to keep table lean
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour';

    IF v_recent_fail >= 5 THEN
        RETURN json_build_object('success', false, 'error', 'Too many login attempts. Try again in 15 minutes.');
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

        INSERT INTO audit_logs (user_name, action, module, details)
        VALUES (u.name, 'Login', 'Auth', format('User %s logged in from IP %s', u.username, v_ip));

        RETURN json_build_object(
            'success', true,
            'token', v_token,
            'user', row_to_json(u)
        );
    END IF;

    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS cast_vote(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION cast_vote(p_poll_id UUID, p_option_index INT)
RETURNS JSON AS $$
DECLARE
    v_hash TEXT := md5(current_client_ip());
    v_poll polls%ROWTYPE;
BEGIN
    SELECT * INTO v_poll FROM polls WHERE id = p_poll_id AND status = 'active';
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Poll not found or not active.');
    END IF;

    IF p_option_index < 0 OR p_option_index >= jsonb_array_length(v_poll.options) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid option index.');
    END IF;

    BEGIN
        INSERT INTO poll_votes (poll_id, voter_ip, option_index)
        VALUES (p_poll_id, v_hash, p_option_index);
    EXCEPTION WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'error', 'You have already voted on this poll.');
    END;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(json_build_object('option_index', option_index, 'count', COUNT(*)))
    INTO v_result
    FROM poll_votes
    WHERE poll_id = p_poll_id
    GROUP BY option_index
    ORDER BY option_index;

    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_clearance_status(
    p_control_number TEXT,
    p_verification_code TEXT
)
RETURNS JSON AS $$
DECLARE
    v_row clearance_requests%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM clearance_requests
    WHERE control_number = p_control_number
      AND verification_code = p_verification_code;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'found', false,
            'error', 'No matching request found. Check your control number and verification code.'
        );
    END IF;

    RETURN json_build_object(
        'found', true,
        'status', v_row.status,
        'doc_type', v_row.doc_type,
        'full_name', v_row.full_name,
        'created_at', v_row.created_at,
        'approved_at', v_row.approved_at,
        'rejected_at', v_row.rejected_at,
        'notes', v_row.notes
    );
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

CREATE OR REPLACE FUNCTION admin_get_contact_messages(p_token TEXT, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0)
RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(c ORDER BY c.created_at DESC)
        FROM (SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset) c);
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

CREATE OR REPLACE FUNCTION admin_get_reports(p_token TEXT, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0)
RETURNS JSON AS $$
BEGIN
    PERFORM require_session(p_token);
    RETURN (SELECT json_agg(r ORDER BY r.created_at DESC)
        FROM (SELECT * FROM reports ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset) r);
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
