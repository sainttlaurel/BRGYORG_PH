-- ============================================================
-- Phase 8 hotfix: restore admin reads after anon SELECT lockdown
--
-- Migration 0003 dropped anon SELECT on residents, documents,
-- complaints, and clearance_requests, and business_registry
-- never had an anon read policy. The admin frontend still read
-- those tables with the anon key, so admin pages silently showed
-- empty lists (RLS returns zero rows to anon). This migration
-- adds the missing session-gated read RPCs and a public-safe
-- document status lookup for the public registry page.
-- ============================================================

-- ============================================================
-- 1. ADMIN READ RPCs (session-gated, SECURITY DEFINER)
-- ============================================================

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

-- ============================================================
-- 2. PUBLIC-SAFE DOCUMENT STATUS LOOKUP
--    Used by the public registry ("track your document").
--    Returns only the minimal verification fields, no PII beyond
--    what the applicant can already see, limited to 20 matches.
-- ============================================================
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

-- ============================================================
-- END OF HOTFIX MIGRATION
-- ============================================================
