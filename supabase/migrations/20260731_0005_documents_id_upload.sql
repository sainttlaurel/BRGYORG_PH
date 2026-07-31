-- ============================================================
-- Phase 8 hotfix: documents.id_upload column
--
-- The public document application stores the uploaded ID as a
-- base64 data URL in documents.id_upload, but the column was
-- never part of committed migrations. Anonymous direct inserts
-- of an unknown column fail with HTTP 400 (column not found).
-- This migration guarantees the column exists so both the
-- rate_limited_insert RPC path and admin_insert_document work.
-- ============================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS id_upload TEXT DEFAULT '';

-- ============================================================
-- END OF HOTFIX MIGRATION
-- ============================================================
