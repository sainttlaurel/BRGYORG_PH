-- ============================================================
-- Phase 8: Close audit-logging gaps + RPCs for new tables
--
-- - Generic admin_log_action() audit helper (client callable)
-- - Audit logging added to settings/barangay-info/service-fee/
--   clear-documents/clear-residents/update-resident RPCs
-- - New SECURITY DEFINER RPCs for resident insert, document
--   insert, business_registry, projects, clearance_requests
-- - Public document/clearance submissions now audited as 'Public'
-- ============================================================

-- ============================================================
-- 1. GENERIC AUDIT HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION admin_log_action(
    p_token TEXT,
    p_user_name TEXT,
    p_action TEXT,
    p_module TEXT DEFAULT '',
    p_details TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_user_name, ''), 'System'), p_action, p_module, COALESCE(p_details, ''));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. RESIDENT RPCs
-- ============================================================

-- Update resident (adds audit logging)
CREATE OR REPLACE FUNCTION admin_update_resident(
    p_token TEXT, p_id TEXT, p_data JSONB, p_logged_in_user TEXT
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
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated resident %s', p_id), 'Residents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert resident (was a direct anon insert — now session-gated + audited)
CREATE OR REPLACE FUNCTION admin_insert_resident(
    p_token TEXT, p_id TEXT, p_fname TEXT, p_lname TEXT, p_purok TEXT,
    p_contact TEXT, p_address TEXT, p_gender TEXT, p_dob TEXT,
    p_household TEXT, p_occupation TEXT, p_civil_status TEXT,
    p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO residents (
        id, fname, lname, purok, contact, address, gender, dob,
        household, occupation, civil_status
    ) VALUES (
        p_id, p_fname, p_lname, p_purok,
        COALESCE(NULLIF(p_contact, ''), 'N/A'),
        COALESCE(NULLIF(p_address, ''), 'Barangay Payatas'),
        COALESCE(NULLIF(p_gender, ''), 'N/A'),
        COALESCE(NULLIF(p_dob, ''), 'N/A'),
        COALESCE(p_household, ''), COALESCE(p_occupation, ''),
        COALESCE(NULLIF(p_civil_status, ''), 'Single')
    );
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Created resident %s (%s %s)', p_id, p_fname, p_lname),
            'Residents', format('Purok: %s', COALESCE(p_purok, '')));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. DOCUMENT INSERT RPC (admin-created requests)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_insert_document(
    p_token TEXT, p_id TEXT, p_resident TEXT, p_type TEXT, p_purpose TEXT,
    p_date TEXT, p_contact TEXT, p_status TEXT, p_id_upload TEXT,
    p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO documents (id, resident, type, purpose, date, contact, status, id_upload)
    VALUES (p_id, p_resident, p_type, p_purpose, p_date,
            COALESCE(p_contact, ''), COALESCE(p_status, 'Pending'),
            COALESCE(p_id_upload, ''));
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Created document request %s (%s)', p_id, p_type),
            'Documents', format('Resident: %s', p_resident));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. SETTINGS / PROFILE / FEES (add audit logging)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_upsert_setting(
    p_token TEXT, p_key TEXT, p_value TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO settings (key, value) VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated setting %s', p_key), 'Settings',
            format('Value: %s', p_value));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_barangay_info(
    p_token TEXT, p_data JSONB, p_logged_in_user TEXT
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
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            'Updated barangay profile', 'Settings', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_service_fee(
    p_token TEXT, p_id INT, p_fee INT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
    v_service TEXT;
BEGIN
    v_session := require_session(p_token);
    SELECT service INTO v_service FROM service_fees WHERE id = p_id;
    UPDATE service_fees SET fee = p_fee WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated service fee %s to %s', COALESCE(v_service, format('id %s', p_id)), p_fee),
            'Settings', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Danger zone actions (add audit logging)
CREATE OR REPLACE FUNCTION admin_clear_documents(p_token TEXT, p_logged_in_user TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM documents;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            'Cleared all document requests', 'Documents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_clear_residents(p_token TEXT, p_logged_in_user TEXT)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM residents;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            'Cleared all residents', 'Residents', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. BUSINESS REGISTRY RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_insert_business(
    p_token TEXT, p_name TEXT, p_owner TEXT, p_category TEXT,
    p_contact TEXT, p_address TEXT, p_description TEXT,
    p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO business_registry (name, owner, category, contact, address, description, status)
    VALUES (p_name, p_owner, p_category,
            COALESCE(p_contact, ''), COALESCE(p_address, ''),
            COALESCE(p_description, ''), 'pending');
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Registered business %s', p_name), 'Business',
            format('Owner: %s', p_owner));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_business(
    p_token TEXT, p_id UUID, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE business_registry SET
        name = COALESCE(p_data->>'name', name),
        owner = COALESCE(p_data->>'owner', owner),
        category = COALESCE(p_data->>'category', category),
        contact = COALESCE(p_data->>'contact', contact),
        address = COALESCE(p_data->>'address', address),
        description = COALESCE(p_data->>'description', description),
        status = COALESCE(p_data->>'status', status)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated business %s', p_id), 'Business', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_business(
    p_token TEXT, p_id UUID, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM business_registry WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Deleted business %s', p_id), 'Business', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. PROJECTS RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_insert_project(
    p_token TEXT, p_id TEXT, p_title TEXT, p_category TEXT,
    p_budget BIGINT, p_progress INT, p_description TEXT,
    p_target_date TEXT, p_status TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    INSERT INTO projects (id, title, category, budget, progress, description, target_date, status)
    VALUES (p_id, p_title, p_category,
            COALESCE(p_budget, 0),
            LEAST(GREATEST(COALESCE(p_progress, 0), 0), 100),
            COALESCE(p_description, ''), COALESCE(p_target_date, ''),
            COALESCE(p_status, 'Planned'));
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Created project %s (%s)', p_id, p_title), 'Projects', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_project(
    p_token TEXT, p_id TEXT, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE projects SET
        title = COALESCE(p_data->>'title', title),
        category = COALESCE(p_data->>'category', category),
        status = COALESCE(p_data->>'status', status),
        budget = COALESCE((p_data->>'budget')::BIGINT, budget),
        progress = LEAST(GREATEST(COALESCE((p_data->>'progress')::INT, progress), 0), 100),
        description = COALESCE(p_data->>'description', description),
        target_date = COALESCE(p_data->>'target_date', target_date)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated project %s', p_id), 'Projects', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_project(
    p_token TEXT, p_id TEXT, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    DELETE FROM projects WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Deleted project %s', p_id), 'Projects', '');
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. CLEARANCE REQUESTS RPC
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_clearance_request(
    p_token TEXT, p_id UUID, p_data JSONB, p_logged_in_user TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    UPDATE clearance_requests SET
        resident_id = COALESCE(p_data->>'resident_id', resident_id),
        full_name = COALESCE(p_data->>'full_name', full_name),
        address = COALESCE(p_data->>'address', address),
        purpose = COALESCE(p_data->>'purpose', purpose),
        doc_type = COALESCE(p_data->>'doc_type', doc_type),
        contact = COALESCE(p_data->>'contact', contact),
        status = COALESCE(p_data->>'status', status),
        notes = COALESCE(p_data->>'notes', notes),
        remarks = COALESCE(p_data->>'remarks', remarks),
        approved_at = COALESCE((p_data->>'approved_at')::TIMESTAMPTZ, approved_at),
        rejected_at = COALESCE((p_data->>'rejected_at')::TIMESTAMPTZ, rejected_at)
    WHERE id = p_id;
    INSERT INTO audit_logs (user_name, action, module, details)
    VALUES (COALESCE(NULLIF(p_logged_in_user, ''), 'System'),
            format('Updated clearance request %s (%s)', p_id, COALESCE(p_data->>'status', '')), 'Clearance',
            COALESCE(p_data->>'notes', ''));
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. RATE_LIMITED_INSERT — audit public document/clearance creates
-- ============================================================
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

    -- Audit public document / clearance submissions
    IF p_form_type IN ('document', 'clearance') THEN
        INSERT INTO audit_logs (user_name, action, module, details)
        VALUES ('Public',
                format('Submitted %s via public form', p_form_type),
                CASE WHEN p_form_type = 'document' THEN 'Documents' ELSE 'Clearance' END,
                '');
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF PHASE 8 MIGRATION
-- ============================================================
