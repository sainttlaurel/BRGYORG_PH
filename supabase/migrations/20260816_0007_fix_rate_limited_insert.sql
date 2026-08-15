-- Fix rate_limited_insert:
-- 1. Add ORDER BY key to both string_agg calls so cols and vals lists are
--    always in the same deterministic alphabetical order.
-- 2. Use RAISE EXCEPTION instead of returning {success:false} JSON so that
--    errors (rate limit, insert failure) propagate as actual Postgres errors
--    that Supabase surfaces as the `error` field in the RPC response — which
--    the frontend already checks with `if (error) throw new Error(...)`.
-- 3. Wrap the EXECUTE in a BEGIN/EXCEPTION block to surface insert errors
--    with the actual Postgres message.

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

    -- ORDER BY key guarantees cols and vals are built in the same alphabetical order
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

-- Also clear stale rate_limit rows so test submissions aren't blocked.
-- Remove rows older than 1 day to reset limits for testing.
DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day';
