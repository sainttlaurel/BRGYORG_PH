CREATE OR REPLACE FUNCTION admin_get_clearance_requests(
    p_token TEXT, p_limit INT DEFAULT 200, p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    RETURN json_agg(r ORDER BY r.created_at DESC)
    FROM (SELECT * FROM clearance_requests
          ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset) r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_business_registry(
    p_token TEXT, p_limit INT DEFAULT 200, p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_session JSON;
BEGIN
    v_session := require_session(p_token);
    RETURN json_agg(r ORDER BY r.created_at DESC)
    FROM (SELECT * FROM business_registry
          ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset) r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_document_status(p_query TEXT)
RETURNS TABLE (
    id      VARCHAR,
    resident VARCHAR,
    type    VARCHAR,
    purpose TEXT,
    status  VARCHAR,
    date    VARCHAR
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
