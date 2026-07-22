-- ============================================================
-- Migration: Add missing columns and write support
-- ============================================================

-- 1. Announcements — add UI fields
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS author    VARCHAR(100) DEFAULT 'Barangay',
  ADD COLUMN IF NOT EXISTS priority  VARCHAR(10)  DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS visible   BOOLEAN      DEFAULT true;

-- 2. Residents — add UI fields
ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS household     VARCHAR(50)  DEFAULT '',
  ADD COLUMN IF NOT EXISTS occupation    VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS civil_status  VARCHAR(30)  DEFAULT 'Single';

-- Update registered to map from the existing column if needed
-- (the column already exists as VARCHAR(4))

-- 3. Polls — add category column (UI uses it)
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS category   VARCHAR(30) DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS title      VARCHAR(500) DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT        DEFAULT '';

-- 4. Update seed announcements with author/priority
UPDATE announcements SET author = 'Barangay Captain', priority = 'high'   WHERE id = 'ANN-001';
UPDATE announcements SET author = 'Barangay Secretary', priority = 'normal' WHERE id = 'ANN-002';
UPDATE announcements SET author = 'Barangay Captain', priority = 'high'   WHERE id = 'ANN-003';
UPDATE announcements SET author = 'BDRRMC', priority = 'normal'            WHERE id = 'ANN-004';
