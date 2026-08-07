CREATE TABLE IF NOT EXISTS admin_sessions (
    id          SERIAL PRIMARY KEY,
    token       TEXT UNIQUE NOT NULL,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '8 hours',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user  ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS poll_votes (
    id        SERIAL PRIMARY KEY,
    poll_id   UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_ip  TEXT NOT NULL,
    option_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (poll_id, voter_ip)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION authenticate_user(p_login TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    u users%ROWTYPE;
    v_token TEXT;
    v_session_id INT;
BEGIN
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

CREATE OR REPLACE FUNCTION validate_session(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    s admin_sessions%ROWTYPE;
    u users%ROWTYPE;
BEGIN
    SELECT * INTO s FROM admin_sessions
    WHERE token = p_token AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Session expired or invalid.');
    END IF;

    SELECT * INTO u FROM users WHERE id = s.user_id;
    IF NOT FOUND OR u.status = 'Suspended' THEN
        RETURN json_build_object('valid', false, 'error', 'User account inactive.');
    END IF;

    RETURN json_build_object(
        'valid', true,
        'user_id', s.user_id,
        'role', s.role,
        'expires_at', s.expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION end_session(p_token TEXT)
RETURNS JSON AS $$
BEGIN
    DELETE FROM admin_sessions WHERE token = p_token;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION require_session(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := validate_session(p_token);
    IF NOT (v_session->>'valid')::BOOLEAN THEN
        RAISE EXCEPTION 'Unauthorized: %', v_session->>'error';
    END IF;
    RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_document_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE documents SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated document %s status to %s', p_id, p_status), 'Documents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_blotter_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE complaints SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated blotter %s status to %s', p_id, p_status), 'Blotter', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_resident(
    p_token TEXT, p_id TEXT, p_data JSONB
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE residents
    SET
        fname     = COALESCE(p_data->>'fname', fname),
        lname     = COALESCE(p_data->>'lname', lname),
        purok     = COALESCE(p_data->>'purok', purok),
        contact   = COALESCE(p_data->>'contact', contact),
        address   = COALESCE(p_data->>'address', address),
        gender    = COALESCE(p_data->>'gender', gender),
        dob       = COALESCE(p_data->>'dob', dob),
        household = COALESCE(p_data->>'household', household),
        occupation = COALESCE(p_data->>'occupation', occupation),
        civil_status = COALESCE(p_data->>'civil_status', civil_status)
    WHERE id = p_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_resident(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM residents WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Deleted resident %s', p_id), 'Residents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_insert_announcement(
    p_token TEXT, p_id TEXT, p_title TEXT, p_category TEXT,
    p_content TEXT, p_date TEXT, p_priority TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO announcements (id, title, category, content, date, priority)
    VALUES (p_id, p_title, p_category, p_content, p_date, COALESCE(p_priority, 'normal'));
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Created announcement: %s', p_title), 'Announcements', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_announcement(
    p_token TEXT, p_id TEXT, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE announcements
    SET
        title    = COALESCE(p_data->>'title', title),
        category = COALESCE(p_data->>'category', category),
        content  = COALESCE(p_data->>'content', content),
        visible  = COALESCE((p_data->>'visible')::BOOLEAN, visible),
        priority = COALESCE(p_data->>'priority', priority)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated announcement: %s', p_id), 'Announcements', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_announcement(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM announcements WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Deleted announcement: %s', p_id), 'Announcements', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_insert_blotter(
    p_token TEXT, p_id TEXT, p_complainant TEXT, p_respondent TEXT,
    p_incident TEXT, p_date TEXT, p_time TEXT, p_location TEXT,
    p_summary TEXT, p_handler TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO complaints (id, complainant, respondent, category, date, time,
        location, description, handler, status)
    VALUES (p_id, p_complainant, p_respondent, p_incident, p_date, p_time,
        p_location, p_summary, p_handler, 'ongoing');
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Created blotter case'), 'Blotter',
        format('Complainant: %s, Incident: %s', p_complainant, p_incident));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_upsert_setting(
    p_token TEXT, p_key TEXT, p_value TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO settings (key, value) VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_poll(
    p_token TEXT, p_id TEXT, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE polls
    SET
        question   = COALESCE(p_data->>'question', question),
        options    = COALESCE((p_data->'options')::TEXT[], options),
        expires_at = COALESCE((p_data->>'expires_at')::TIMESTAMPTZ, expires_at),
        status     = COALESCE(p_data->>'status', status)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated poll: %s', p_id), 'Polls', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_insert_poll(
    p_token TEXT, p_question TEXT, p_options TEXT[],
    p_expires_at TIMESTAMPTZ, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO polls (question, options, expires_at, status)
    VALUES (p_question, p_options, p_expires_at, 'active');
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Created poll: %s', p_question), 'Polls', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_poll(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM polls WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Deleted poll: %s', p_id), 'Polls', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_reply_suggestion(
    p_token TEXT, p_id TEXT, p_admin_reply TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE suggestions SET admin_reply = p_admin_reply, status = 'published' WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Replied to suggestion: %s', p_id), 'Suggestions', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_suggestion_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE suggestions SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated suggestion %s status to %s', p_id, p_status), 'Suggestions', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_insert_official(
    p_token TEXT, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO officials (name, position, committee, contact, email, since, bio)
    VALUES (
        p_data->>'name', p_data->>'position', COALESCE(p_data->>'committee', ''),
        COALESCE(p_data->>'contact', ''), COALESCE(p_data->>'email', ''),
        COALESCE(p_data->>'since', ''), COALESCE(p_data->>'bio', '')
    );
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Created official: %s', p_data->>'name'), 'Officials', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_official(
    p_token TEXT, p_id INT, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE officials
    SET
        name      = COALESCE(p_data->>'name', name),
        position  = COALESCE(p_data->>'position', position),
        committee = COALESCE(p_data->>'committee', committee),
        contact   = COALESCE(p_data->>'contact', contact),
        email     = COALESCE(p_data->>'email', email),
        since     = COALESCE(p_data->>'since', since),
        bio       = COALESCE(p_data->>'bio', bio)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated official: %s', p_id), 'Officials', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_official(
    p_token TEXT, p_id INT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM officials WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Deleted official: %s', p_id), 'Officials', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_volunteer_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE volunteer_signups SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated volunteer %s status to %s', p_id, p_status), 'Volunteers', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_report_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE reports SET status = p_status, updated_at = NOW() WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated report %s status to %s', p_id, p_status), 'Reports', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_contact_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE contact_messages SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated contact msg %s status to %s', p_id, p_status), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_barangay_info(
    p_token TEXT, p_data JSONB
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE barangay_info SET
        name = COALESCE(p_data->>'name', name),
        municipality = COALESCE(p_data->>'municipality', municipality),
        captain = COALESCE(p_data->>'captain', captain),
        hotline = COALESCE(p_data->>'hotline', hotline),
        email = COALESCE(p_data->>'email', email),
        address = COALESCE(p_data->>'address', address),
        office_hours = COALESCE(p_data->>'office_hours', office_hours),
        vision = COALESCE(p_data->>'vision', vision),
        mission = COALESCE(p_data->>'mission', mission),
        seal_url = COALESCE(p_data->>'seal_url', seal_url)
    WHERE id = 1;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_service_fee(
    p_token TEXT, p_id INT, p_fee INT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE service_fees SET fee = p_fee WHERE id = p_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_clear_documents(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM documents;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_clear_residents(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM residents;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_contact_message(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM contact_messages WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Deleted contact message %s', p_id), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_contact_message_status(
    p_token TEXT, p_id TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE contact_messages SET status = p_status WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (p_logged_in_user, format('Updated contact msg %s status to %s', p_id, p_status), 'Contact', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INT AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cast_vote(
    p_poll_id TEXT, p_voter_ip TEXT, p_option_index INT
)
RETURNS JSON AS $$
DECLARE
    v_poll polls%ROWTYPE;
    v_existing INT;
BEGIN
    SELECT * INTO v_poll FROM polls WHERE id = p_poll_id AND status = 'active';
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Poll not found or not active.');
    END IF;

    SELECT COUNT(*) INTO v_existing FROM poll_votes
    WHERE poll_id = p_poll_id AND voter_ip = p_voter_ip;

    IF v_existing > 0 THEN
        RETURN json_build_object('success', false, 'error', 'Already voted.');
    END IF;

    INSERT INTO poll_votes (poll_id, voter_ip, option_index)
    VALUES (p_poll_id, p_voter_ip, p_option_index);

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'option_index', option_index,
        'count', COUNT(*)
    )) INTO v_result
    FROM poll_votes
    WHERE poll_id = p_poll_id
    GROUP BY option_index
    ORDER BY option_index;

    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW v_resident_public AS
SELECT
    id,
    fname || ' ' || lname AS full_name,
    purok,
    gender,
    occupation,
    civil_status
FROM residents
WHERE status = 'Active';

DROP POLICY IF EXISTS "residents_anon_write" ON residents;
DROP POLICY IF EXISTS "documents_anon_write" ON documents;
DROP POLICY IF EXISTS "complaints_anon_write" ON complaints;
DROP POLICY IF EXISTS "projects_anon_write" ON projects;
DROP POLICY IF EXISTS "announcements_anon_write" ON announcements;
DROP POLICY IF EXISTS "clearance_anon_write" ON clearance_requests;
DROP POLICY IF EXISTS "suggestions_anon_write" ON suggestions;
DROP POLICY IF EXISTS "polls_anon_write" ON polls;
DROP POLICY IF EXISTS "volunteers_anon_write" ON volunteer_signups;
DROP POLICY IF EXISTS "business_anon_write" ON business_registry;
DROP POLICY IF EXISTS "polls_anon_vote" ON polls;

CREATE TABLE IF NOT EXISTS rate_limits (
    identifier  TEXT NOT NULL,
    form_type   TEXT NOT NULL,
    count       INT NOT NULL DEFAULT 1,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (identifier, form_type)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION rate_limited_insert(
    p_identifier TEXT,
    p_form_type TEXT,
    p_table TEXT,
    p_data JSONB
)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER := 0;
    v_verified BOOLEAN := FALSE;
    v_max INTEGER := 3;
    v_sql TEXT;
BEGIN
    SELECT count, is_verified INTO v_count, v_verified
    FROM rate_limits
    WHERE identifier = p_identifier AND form_type = p_form_type;

    v_max := CASE WHEN v_verified THEN 10 ELSE 3 END;

    IF v_count >= v_max THEN
        RETURN json_build_object('success', false, 'error', 'Rate limit reached. Please try again later.');
    END IF;

    -- Dynamic insert into the target table
    EXECUTE format(
        'INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, %L)',
        p_table, p_table, p_data
    );

    INSERT INTO rate_limits (identifier, form_type, count)
    VALUES (p_identifier, p_form_type, 1)
    ON CONFLICT (identifier, form_type)
    DO UPDATE SET count = rate_limits.count + 1;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
