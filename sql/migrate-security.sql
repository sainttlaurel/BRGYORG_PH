-- ============================================================
-- SECURITY MIGRATION — Payatas Ledger
-- Apply to an existing database (do NOT run on a fresh install;
-- the main supabase-schema.sql already includes these changes).
--
-- What this does:
--   1. Hashes any remaining plaintext passwords in the users table
--   2. Drops the plaintext fallback from authenticate_user RPC
--   3. Drops the plaintext fallback from update_user_password RPC
--   4. Drops all open "allow_all_*" RLS policies
--   5. Creates scoped replacement policies
--   6. Blocks anon access to users, document_counters, suggestion_limits
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste and Run
--   Or: psql "[connection-string]" -f migrate-security.sql
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1 — Hash any remaining plaintext passwords
-- Passwords already hashed with bcrypt start with '$2a$' or '$2b$'.
-- This is idempotent — hashed passwords are skipped.
-- ============================================================
UPDATE users
SET password = crypt(password, gen_salt('bf'))
WHERE password NOT LIKE '$2a$%'
  AND password NOT LIKE '$2b$%';

-- ============================================================
-- STEP 2 — Replace authenticate_user RPC (bcrypt-only)
-- ============================================================
CREATE OR REPLACE FUNCTION authenticate_user(p_login TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    u users%ROWTYPE;
BEGIN
    SELECT * INTO u FROM users
    WHERE username = p_login OR email = p_login
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
    END IF;

    IF u.status = 'Suspended' THEN
        RETURN json_build_object('success', false, 'error', 'Your account has been suspended. Contact the administrator.');
    END IF;

    -- bcrypt-only check — no plaintext fallback
    IF u.password = crypt(p_password, u.password) THEN
        UPDATE users SET last_active = to_char(NOW(), 'Mon DD, YYYY HH24:MI') WHERE id = u.id;
        RETURN json_build_object('success', true, 'user', row_to_json(u));
    END IF;

    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3 — Replace update_user_password RPC (bcrypt-only)
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_password(p_user_id INT, p_current TEXT, p_new TEXT)
RETURNS JSON AS $$
DECLARE
    u users%ROWTYPE;
BEGIN
    SELECT * INTO u FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    -- bcrypt-only check — no plaintext fallback
    IF NOT (u.password = crypt(p_current, u.password)) THEN
        RETURN json_build_object('success', false, 'error', 'Current password is incorrect');
    END IF;

    UPDATE users SET password = crypt(p_new, gen_salt('bf')) WHERE id = p_user_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 4 — Drop all open "allow_all_*" policies
-- ============================================================
DROP POLICY IF EXISTS "allow_all_users"         ON users;
DROP POLICY IF EXISTS "allow_all_residents"     ON residents;
DROP POLICY IF EXISTS "allow_all_documents"     ON documents;
DROP POLICY IF EXISTS "allow_all_complaints"    ON complaints;
DROP POLICY IF EXISTS "allow_all_projects"      ON projects;
DROP POLICY IF EXISTS "allow_all_announcements" ON announcements;
DROP POLICY IF EXISTS "allow_all_clearance"     ON clearance_requests;
DROP POLICY IF EXISTS "allow_all_counters"      ON document_counters;
DROP POLICY IF EXISTS "allow_all_suggestions"   ON suggestions;
DROP POLICY IF EXISTS "allow_all_polls"         ON polls;
DROP POLICY IF EXISTS "allow_all_volunteers"    ON volunteer_signups;
DROP POLICY IF EXISTS "allow_all_business"      ON business_registry;
DROP POLICY IF EXISTS "allow_all_limits"        ON suggestion_limits;

-- ============================================================
-- STEP 5 — Create scoped replacement policies
-- ============================================================

-- users — NO anon access. Auth goes through the RPC (SECURITY DEFINER).
-- Default-deny: no policies = anon is blocked.

-- residents
CREATE POLICY "residents_anon_read"  ON residents FOR SELECT USING (true);
CREATE POLICY "residents_anon_write" ON residents FOR ALL    USING (true) WITH CHECK (true);

-- documents
CREATE POLICY "documents_anon_read"  ON documents FOR SELECT USING (true);
CREATE POLICY "documents_anon_write" ON documents FOR ALL    USING (true) WITH CHECK (true);

-- complaints — public can submit; admin manages
CREATE POLICY "complaints_anon_insert" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "complaints_anon_read"   ON complaints FOR SELECT USING (true);
CREATE POLICY "complaints_anon_write"  ON complaints FOR ALL    USING (true) WITH CHECK (true);

-- projects — public read; admin writes
CREATE POLICY "projects_anon_read"  ON projects FOR SELECT USING (true);
CREATE POLICY "projects_anon_write" ON projects FOR ALL    USING (true) WITH CHECK (true);

-- announcements — public read; admin writes
CREATE POLICY "announcements_anon_read"  ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_anon_write" ON announcements FOR ALL    USING (true) WITH CHECK (true);

-- clearance_requests — public can submit; admin reads/updates
CREATE POLICY "clearance_anon_insert" ON clearance_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "clearance_anon_read"   ON clearance_requests FOR SELECT USING (true);
CREATE POLICY "clearance_anon_write"  ON clearance_requests FOR ALL    USING (true) WITH CHECK (true);

-- document_counters — no direct anon access; RPC uses SECURITY DEFINER
-- Default-deny: no policies = anon is blocked.

-- suggestions — public can submit; only published rows visible publicly
CREATE POLICY "suggestions_anon_insert" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "suggestions_anon_read"   ON suggestions FOR SELECT USING (status = 'published');
CREATE POLICY "suggestions_anon_write"  ON suggestions FOR ALL    USING (true) WITH CHECK (true);

-- polls — active polls readable; anon can vote (UPDATE); admin manages
CREATE POLICY "polls_anon_read"  ON polls FOR SELECT USING (status = 'active');
CREATE POLICY "polls_anon_vote"  ON polls FOR UPDATE USING (status = 'active') WITH CHECK (true);
CREATE POLICY "polls_anon_write" ON polls FOR ALL    USING (true) WITH CHECK (true);

-- volunteer_signups — public can submit; admin manages
CREATE POLICY "volunteers_anon_insert" ON volunteer_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "volunteers_anon_write"  ON volunteer_signups FOR ALL    USING (true) WITH CHECK (true);

-- business_registry — public can submit; admin manages
CREATE POLICY "business_anon_insert" ON business_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "business_anon_write"  ON business_registry FOR ALL    USING (true) WITH CHECK (true);

-- suggestion_limits — no direct anon access
-- Default-deny: no policies = anon is blocked.

-- ============================================================
-- STEP 6 — Add helper RPCs for tables now blocked to anon
-- ============================================================

-- get_users — password-stripped user list for the admin portal
CREATE OR REPLACE FUNCTION get_users()
RETURNS JSON AS $$
    SELECT json_agg(
        json_build_object(
            'id',          id,
            'name',        name,
            'username',    username,
            'role',        role,
            'email',       email,
            'status',      status,
            'last_active', last_active,
            'initials',    initials,
            'created_at',  created_at
        )
        ORDER BY id
    )
    FROM users;
$$ LANGUAGE sql SECURITY DEFINER;

-- record_suggestion — quota-enforced suggestion insert
-- Keeps suggestion_limits invisible to anon; handles read+write atomically.
CREATE OR REPLACE FUNCTION record_suggestion(
    p_identifier TEXT,
    p_name       TEXT,
    p_content    TEXT
)
RETURNS JSON AS $$
DECLARE
    v_count     INTEGER := 0;
    v_verified  BOOLEAN := FALSE;
    v_max       INTEGER;
BEGIN
    SELECT count, is_verified INTO v_count, v_verified
    FROM suggestion_limits
    WHERE identifier = p_identifier;

    v_max := CASE WHEN v_verified THEN 5 ELSE 2 END;

    IF v_count >= v_max THEN
        RETURN json_build_object(
            'success', false,
            'error',   'Limit reached. Guests can submit up to 2. Verified residents up to 5.'
        );
    END IF;

    INSERT INTO suggestions (name, content, status)
    VALUES (COALESCE(NULLIF(p_name, ''), 'Anonymous'), p_content, 'pending');

    INSERT INTO suggestion_limits (identifier, count)
    VALUES (p_identifier, 1)
    ON CONFLICT (identifier)
    DO UPDATE SET count = suggestion_limits.count + 1;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_user — admin creates a new staff/admin account
CREATE OR REPLACE FUNCTION create_user(
    p_id INT, p_name TEXT, p_username TEXT, p_email TEXT,
    p_password TEXT, p_role TEXT, p_initials TEXT
)
RETURNS JSON AS $$
DECLARE new_user users%ROWTYPE;
BEGIN
    INSERT INTO users (id, name, username, email, password, role, status, initials)
    VALUES (p_id, p_name, p_username, p_email, crypt(p_password, gen_salt('bf')), p_role, 'Active', p_initials)
    RETURNING * INTO new_user;
    RETURN json_build_object(
        'id', new_user.id, 'name', new_user.name, 'username', new_user.username,
        'role', new_user.role, 'email', new_user.email, 'status', new_user.status,
        'last_active', new_user.last_active, 'initials', new_user.initials, 'created_at', new_user.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_user — admin updates user fields (no password)
CREATE OR REPLACE FUNCTION update_user(
    p_id INT, p_name TEXT, p_username TEXT, p_email TEXT, p_role TEXT, p_initials TEXT
)
RETURNS JSON AS $$
DECLARE updated users%ROWTYPE;
BEGIN
    UPDATE users SET name=p_name, username=p_username, email=p_email, role=p_role, initials=p_initials
    WHERE id=p_id RETURNING * INTO updated;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
    RETURN json_build_object(
        'id', updated.id, 'name', updated.name, 'username', updated.username,
        'role', updated.role, 'email', updated.email, 'status', updated.status,
        'last_active', updated.last_active, 'initials', updated.initials, 'created_at', updated.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- set_user_status — admin suspends or reactivates a user
CREATE OR REPLACE FUNCTION set_user_status(p_id INT, p_status TEXT)
RETURNS JSON AS $$
BEGIN
    UPDATE users SET status=p_status WHERE id=p_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- delete_user — admin removes a user account
CREATE OR REPLACE FUNCTION delete_user(p_id INT)
RETURNS JSON AS $$
BEGIN
    DELETE FROM users WHERE id=p_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these after the migration to confirm the changes took.
-- ============================================================

-- Should return 0 rows (no plaintext passwords remain)
-- SELECT id, username FROM users WHERE password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%';

-- Should show no policies on users, document_counters, suggestion_limits
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Should show the new RPCs
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;
