-- Fix rate_limited_insert: add ORDER BY key to both string_agg calls so
-- the columns list and values list are always in the same deterministic order.
-- Without ORDER BY, string_agg returns results in an unspecified order which
-- can cause values to be inserted into the wrong columns, silently corrupting
-- rows or raising a type-mismatch error that the RPC returns as a success=false
-- JSON (swallowed by the frontend) instead of a Postgres error.

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
        RETURN json_build_object('success', false, 'error', 'Rate limit reached. Please try again later.');
    END IF;

    -- ORDER BY key guarantees cols and vals are built in the same order
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

    -- Audit public document / clearance submissions
    IF p_form_type IN ('document', 'clearance') THEN
        INSERT INTO audit_logs (user_name, action, module, details)
        VALUES (
            'Public',
            format('Submitted %s via public form', p_form_type),
            CASE WHEN p_form_type = 'document' THEN 'Documents' ELSE 'Clearance' END,
            ''
        );
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
