-- ============================================================
-- PAYATAS LEDGER — DATABASE SCHEMA
-- Barangay Civic Management Platform
--
-- Project : Payatas Ledger v3
-- Database: Supabase (PostgreSQL 15)
-- Project : https://xyaqigazszqhvvglqint.supabase.co
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click "Run"
--   3. Or: psql "postgresql://postgres:[YOUR-PASSWORD]@db.xyaqigazszqhvvglqint.supabase.co:5432/postgres" -f supabase-schema.sql
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CLEAN RESET
-- Comment out this block if you are running a partial update
-- ============================================================
DROP TABLE IF EXISTS suggestion_limits    CASCADE;
DROP TABLE IF EXISTS volunteer_signups    CASCADE;
DROP TABLE IF EXISTS business_registry    CASCADE;
DROP TABLE IF EXISTS polls                CASCADE;
DROP TABLE IF EXISTS suggestions          CASCADE;
DROP TABLE IF EXISTS document_counters    CASCADE;
DROP TABLE IF EXISTS clearance_requests   CASCADE;
DROP TABLE IF EXISTS announcements        CASCADE;
DROP TABLE IF EXISTS projects             CASCADE;
DROP TABLE IF EXISTS complaints           CASCADE;
DROP TABLE IF EXISTS documents            CASCADE;
DROP TABLE IF EXISTS residents            CASCADE;
DROP TABLE IF EXISTS users                CASCADE;

-- ============================================================
-- USERS
-- Admin and staff accounts for the administrative portal.
-- Fields match app.js state shape:
--   { id, name, username, password, role, email, status, last_active, initials }
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    username    VARCHAR(50)   UNIQUE NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'Staff',   -- 'Admin' | 'Staff'
    email       VARCHAR(255)  NOT NULL DEFAULT '',
    status      VARCHAR(20)   NOT NULL DEFAULT 'Active',  -- 'Active' | 'Suspended'
    last_active VARCHAR(100)  DEFAULT 'Never',
    initials    VARCHAR(5)    DEFAULT '',
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Default accounts (change passwords before production)
INSERT INTO users (name, username, password, role, email, status, initials) VALUES
('Admin Payatas',  'admin',   'admin123',  'Admin', 'admin@payatas.gov.ph',          'Active', 'AP'),
('Elena Garcia',   'egarcia', 'staff123',  'Staff', 'elena.garcia@payatas.gov.ph',   'Active', 'EG'),
('Roberto Santos', 'rsantos', 'staff123',  'Staff', 'roberto.santos@payatas.gov.ph', 'Active', 'RS');

-- ============================================================
-- RESIDENTS
-- Central resident directory.
-- Fields: { id, fname, lname, purok, contact, status, registered, address, gender, dob, notes }
-- ============================================================
CREATE TABLE residents (
    id          VARCHAR(20)  PRIMARY KEY,   -- e.g. PAY-029481
    fname       VARCHAR(100) NOT NULL,
    lname       VARCHAR(100) NOT NULL,
    purok       VARCHAR(30)  NOT NULL,
    contact     VARCHAR(30)  DEFAULT 'N/A',
    status      VARCHAR(20)  DEFAULT 'Active',  -- 'Active' | 'Inactive'
    registered  VARCHAR(4)   DEFAULT '',         -- year string e.g. '2024'
    address     TEXT         DEFAULT 'Barangay Payatas',
    gender      VARCHAR(10)  DEFAULT 'N/A',
    dob         VARCHAR(20)  DEFAULT 'N/A',      -- ISO date string or 'N/A'
    notes       TEXT         DEFAULT '',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO residents (id, fname, lname, purok, contact, status, registered, address, gender, dob) VALUES
('PAY-029481', 'Maria Clara',  'Agustin',     'Purok 1', '+63 912 345 6789', 'Active',   '2018', 'Block 3 Lot 5, Purok 1, Barangay Payatas', 'Female', '1985-04-12'),
('PAY-055102', 'Santiago',     'Bautista Jr.','Purok 3', '+63 945 882 1092', 'Active',   '2020', 'Block 7 Lot 2, Purok 3, Barangay Payatas', 'Male',   '1991-08-23'),
('PAY-010293', 'Theresa Mae',  'Cruz',        'Purok 2', '+63 908 556 1234', 'Inactive', '2015', 'Block 1 Lot 8, Purok 2, Barangay Payatas', 'Female', '1978-01-15'),
('PAY-072105', 'Jose Antonio', 'Reyes',       'Purok 4', '+63 917 223 8841', 'Active',   '2021', 'Block 5 Lot 3, Purok 4, Barangay Payatas', 'Male',   '2000-11-30'),
('PAY-083342', 'Lorna',        'Dela Rosa',   'Purok 5', '+63 928 774 3310', 'Active',   '2019', 'Block 2 Lot 9, Purok 5, Barangay Payatas', 'Female', '1972-06-07');

-- ============================================================
-- DOCUMENTS
-- Barangay-issued certificate requests.
-- Fields: { id, resident, type, date, status, ref, purpose, contact, remarks, timeline }
-- ============================================================
CREATE TABLE documents (
    id          VARCHAR(20)  PRIMARY KEY,  -- e.g. DOC-001
    resident    VARCHAR(100) NOT NULL,
    type        VARCHAR(100) NOT NULL,
    date        VARCHAR(10)  NOT NULL,     -- YYYY-MM-DD
    status      VARCHAR(20)  DEFAULT 'Pending',  -- 'Pending' | 'Approved' | 'Rejected'
    ref         VARCHAR(30)  DEFAULT '',          -- e.g. PAY-2026-000001
    purpose     TEXT         DEFAULT '',
    contact     VARCHAR(30)  DEFAULT 'N/A',
    remarks     TEXT         DEFAULT '',          -- admin remarks on approval/rejection
    timeline    JSONB        DEFAULT '[]',        -- status change history array
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO documents (id, resident, type, date, status, ref, purpose) VALUES
('DOC-001', 'Maria Clara Agustin', 'Barangay Clearance',              '2026-04-01', 'Approved', 'PAY-2026-000001', 'Employment'),
('DOC-002', 'Santiago Bautista Jr.', 'Certificate of Indigency',     '2026-04-03', 'Pending',  'PAY-2026-000002', 'Medical assistance'),
('DOC-003', 'Jose Antonio Reyes',  'Certificate of Residency',       '2026-04-05', 'Pending',  'PAY-2026-000003', 'School requirement'),
('DOC-004', 'Theresa Mae Cruz',    'Barangay Business Clearance',    '2026-03-28', 'Rejected', 'PAY-2026-000004', 'Business permit'),
('DOC-005', 'Lorna Dela Rosa',     'Certificate of Good Moral Character', '2026-04-06', 'Approved', 'PAY-2026-000005', 'Employment');

-- ============================================================
-- COMPLAINTS
-- Citizen grievance and complaint tracking.
-- Fields: { id, complainant, category, priority, status, date, description }
-- Note: app.js accesses this as `.desc` — the config normalizes description→desc
-- ============================================================
CREATE TABLE complaints (
    id          VARCHAR(20)  PRIMARY KEY,
    complainant VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    priority    VARCHAR(20)  DEFAULT 'Medium',  -- 'High' | 'Medium' | 'Low'
    status      VARCHAR(20)  DEFAULT 'Pending', -- 'Pending' | 'Resolved'
    date        VARCHAR(10)  NOT NULL,           -- YYYY-MM-DD
    description TEXT         DEFAULT '',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO complaints (id, complainant, category, priority, status, date, description) VALUES
('CMP-001', 'Ricardo Santos',    'Sanitation & Waste', 'High',   'Pending',  '2026-04-01', 'Uncollected garbage near Purok 2 for over a week.'),
('CMP-002', 'Angela Morales',    'Noise Complaint',    'Medium', 'Resolved', '2026-03-28', 'Loud music past midnight from neighboring residence.'),
('CMP-003', 'Eduardo Pascual',   'Infrastructure Repair','High', 'Pending',  '2026-04-04', 'Broken streetlight on Sampaguita St. poses safety risk.'),
('CMP-004', 'Michelle Castillo', 'Community Dispute',  'Low',    'Pending',  '2026-04-05', 'Property boundary dispute with neighbor.');

-- ============================================================
-- PROJECTS
-- Community infrastructure and development projects.
-- Fields: { id, title, category, status, budget, progress, description, target_date }
-- ============================================================
CREATE TABLE projects (
    id          VARCHAR(20)  PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    status      VARCHAR(20)  DEFAULT 'Planned',  -- 'Planned' | 'Ongoing' | 'Completed'
    budget      BIGINT       DEFAULT 0,
    progress    INTEGER      DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    description TEXT         DEFAULT '',
    target_date VARCHAR(30)  DEFAULT '',
    reactions   JSONB        DEFAULT '{"likes": 0, "hearts": 0}',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO projects (id, title, category, status, budget, progress, description, target_date) VALUES
('PRJ-001', 'Phase 4 Main Road Rehabilitation',       'Infrastructure', 'Ongoing',   1250000, 65, 'Full resurfacing of the main road from Purok 1 to Purok 4. Includes drainage improvement works.', 'December 2026'),
('PRJ-002', 'Solar-Powered Street Lighting Initiative','Infrastructure', 'Completed', 450000, 100,'Installation of 40 solar-powered LED streetlights across all puroks.', 'September 2025'),
('PRJ-003', 'Multipurpose Hall Expansion',            'Facilities',     'Planned',   2800000,  0, 'Expansion of the barangay multipurpose hall to accommodate 500 people.', 'January 2027'),
('PRJ-004', 'Central Payatas Drainage Upgrade',       'Infrastructure', 'Ongoing',   3200000, 28, 'Major drainage canal upgrade to address recurring floods during rainy season.', 'March 2027'),
('PRJ-005', 'Community Health Center Renovation',     'Health',         'Planned',   900000,   0, 'Renovation of the barangay health center including medical equipment upgrades.', 'June 2027');

-- ============================================================
-- ANNOUNCEMENTS
-- Community notices, advisories, and events.
-- Fields: { id, title, category, content, date, reactions }
-- ============================================================
CREATE TABLE announcements (
    id          VARCHAR(20)  PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(30)  DEFAULT 'general',  -- 'general' | 'health' | 'meeting' | 'infrastructure' | 'advisory' | 'events'
    content     TEXT         DEFAULT '',
    date        VARCHAR(10)  NOT NULL,             -- YYYY-MM-DD
    reactions   JSONB        DEFAULT '{"likes": 0, "hearts": 0}',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO announcements (id, title, category, content, date) VALUES
('ANN-001', 'Free Medical Mission — June 15',          'health',    'The Barangay Health Center, in partnership with the City Health Office, will conduct a free medical mission on June 15, 2026. Services include general check-up, dental screening, and free medicines. Bring one valid ID.', '2026-06-01'),
('ANN-002', 'Barangay Assembly — June 20',             'meeting',   'All residents are invited to attend the quarterly Barangay Assembly on June 20, 2026 at 2:00 PM at the Multipurpose Hall. Agenda: budget updates, project reports, and community concerns.', '2026-06-05'),
('ANN-003', 'Phase 4 Road Closure Advisory',           'advisory',  'Please be advised that the main road from Purok 1 to Purok 2 will be partially closed from June 10–20, 2026 due to road rehabilitation works. Use alternate routes via Purok 3.', '2026-06-08'),
('ANN-004', 'Emergency Preparedness Seminar',          'general',   'The BDRRMC will hold a free emergency preparedness seminar on June 18, 2026. Topics include earthquake protocols, evacuation drills, and first aid basics. Open to all residents.', '2026-06-10');

-- ============================================================
-- CLEARANCE REQUESTS
-- Public-facing document application submissions from the portal.
-- ============================================================
CREATE TABLE clearance_requests (
    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id       TEXT        NOT NULL DEFAULT '',
    full_name         TEXT        NOT NULL,
    address           TEXT        NOT NULL DEFAULT '',
    purpose           TEXT        NOT NULL,
    doc_type          TEXT        NOT NULL DEFAULT 'Barangay Clearance',
    contact           TEXT        DEFAULT '',
    control_number    TEXT        UNIQUE NOT NULL,
    verification_code TEXT        UNIQUE NOT NULL,
    status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected')),
    notes             TEXT        DEFAULT '',
    remarks           TEXT        DEFAULT '',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    approved_at       TIMESTAMPTZ,
    rejected_at       TIMESTAMPTZ
);

-- ============================================================
-- DOCUMENT COUNTERS
-- Atomic sequential numbering per doc type per year (used by RPC).
-- ============================================================
CREATE TABLE document_counters (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doc_type    TEXT NOT NULL,
    year        INT  NOT NULL,
    last_number INT  NOT NULL DEFAULT 0,
    UNIQUE (doc_type, year)
);

-- ============================================================
-- RPC: Atomic clearance number generation
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_clearance_number(p_year INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE v_next INT;
BEGIN
    INSERT INTO document_counters (doc_type, year, last_number)
    VALUES ('clearance', p_year, 1)
    ON CONFLICT (doc_type, year)
    DO UPDATE SET last_number = document_counters.last_number + 1
    RETURNING last_number INTO v_next;
    RETURN v_next;
END;
$$;

-- ============================================================
-- COMMUNITY HUB — SUGGESTIONS (Citizens' Voice)
-- ============================================================
CREATE TABLE suggestions (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    name         VARCHAR(100) DEFAULT 'Anonymous',
    resident_id  VARCHAR(20),              -- Optional link to residents table
    content      TEXT         NOT NULL,
    admin_reply  TEXT,
    status       VARCHAR(20)  DEFAULT 'pending',  -- 'pending' | 'published' | 'archived'
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY HUB — POLLS
-- ============================================================
CREATE TABLE polls (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    question    TEXT         NOT NULL,
    options     JSONB        NOT NULL,               -- ["Option A", "Option B", ...]
    votes       JSONB        DEFAULT '{}',           -- {"0": 12, "1": 5, ...}
    status      VARCHAR(20)  DEFAULT 'active',       -- 'active' | 'closed'
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

-- Sample poll
INSERT INTO polls (question, options, status) VALUES
('What barangay project should be prioritized next?',
 '["Covered Basketball Court", "Drainage Expansion", "Community Garden", "Daycare Center Renovation"]',
 'active');

-- ============================================================
-- COMMUNITY HUB — VOLUNTEER SIGN-UPS
-- ============================================================
CREATE TABLE volunteer_signups (
    id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id       VARCHAR(20),              -- Optional link to projects
    full_name        VARCHAR(255) NOT NULL,
    email            VARCHAR(255),
    contact          VARCHAR(50)  NOT NULL,
    body_conditions  TEXT,                     -- Self-disclosed health/physical conditions
    status           VARCHAR(20)  DEFAULT 'pending',  -- 'pending' | 'accepted' | 'completed'
    created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY HUB — BUSINESS REGISTRY
-- ============================================================
CREATE TABLE business_registry (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    owner       VARCHAR(255) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    contact     VARCHAR(50),
    address     TEXT,
    description TEXT,
    status      VARCHAR(20)  DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- SUGGESTION RATE LIMITING
-- ============================================================
CREATE TABLE suggestion_limits (
    identifier   TEXT        PRIMARY KEY,  -- IP hash, fingerprint, or resident ID
    count        INTEGER     DEFAULT 0,
    last_reset   TIMESTAMPTZ DEFAULT NOW(),
    is_verified  BOOLEAN     DEFAULT FALSE
);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables use permissive policies for the anon/public key.
-- Tighten these policies for production by scoping to auth.uid().
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_counters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls               ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_signups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_registry   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_limits   ENABLE ROW LEVEL SECURITY;

-- Permissive policies (open access via anon key — suitable for prototype/development)
CREATE POLICY "allow_all_users"         ON users               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_residents"     ON residents           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_documents"     ON documents           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_complaints"    ON complaints          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects"      ON projects            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_announcements" ON announcements       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clearance"     ON clearance_requests  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_counters"      ON document_counters   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_suggestions"   ON suggestions         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_polls"         ON polls               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_volunteers"    ON volunteer_signups   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_business"      ON business_registry   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_limits"        ON suggestion_limits   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES — Performance optimization
-- ============================================================

-- Residents
CREATE INDEX idx_residents_lname   ON residents(lname);
CREATE INDEX idx_residents_purok   ON residents(purok);
CREATE INDEX idx_residents_status  ON residents(status);

-- Documents
CREATE INDEX idx_documents_status  ON documents(status);
CREATE INDEX idx_documents_type    ON documents(type);
CREATE INDEX idx_documents_date    ON documents(date DESC);
CREATE INDEX idx_documents_ref     ON documents(ref);

-- Complaints
CREATE INDEX idx_complaints_status   ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_date     ON complaints(date DESC);

-- Projects
CREATE INDEX idx_projects_status   ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);

-- Announcements
CREATE INDEX idx_announcements_cat  ON announcements(category);
CREATE INDEX idx_announcements_date ON announcements(date DESC);

-- Clearance requests
CREATE INDEX idx_clearance_status       ON clearance_requests(status);
CREATE INDEX idx_clearance_control      ON clearance_requests(control_number);
CREATE INDEX idx_clearance_verification ON clearance_requests(verification_code);
CREATE INDEX idx_clearance_created      ON clearance_requests(created_at DESC);

-- Community hub
CREATE INDEX idx_suggestions_status  ON suggestions(status);
CREATE INDEX idx_polls_status        ON polls(status);
CREATE INDEX idx_volunteers_project  ON volunteer_signups(project_id);
CREATE INDEX idx_business_status     ON business_registry(status);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Pending documents count per type
CREATE OR REPLACE VIEW v_pending_documents AS
SELECT type, COUNT(*) AS count
FROM documents
WHERE status = 'Pending'
GROUP BY type
ORDER BY count DESC;

-- Complaint summary by category
CREATE OR REPLACE VIEW v_complaint_summary AS
SELECT
    category,
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'Pending'  THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
FROM complaints
GROUP BY category
ORDER BY total DESC;

-- Active residents per purok
CREATE OR REPLACE VIEW v_residents_per_purok AS
SELECT purok, COUNT(*) AS total,
       SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active
FROM residents
GROUP BY purok
ORDER BY purok;

-- ============================================================
-- SECURITY & ID GENERATION (v3.1)
-- Run this section if upgrading an existing database.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS entity_id_counters (
    table_name TEXT PRIMARY KEY,
    prefix     TEXT NOT NULL,
    last_num   INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION get_next_entity_id(p_table TEXT, p_prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    INSERT INTO entity_id_counters (table_name, prefix, last_num)
    VALUES (p_table, p_prefix, 0)
    ON CONFLICT (table_name) DO NOTHING;

    UPDATE entity_id_counters
    SET last_num = last_num + 1
    WHERE table_name = p_table
    RETURNING last_num INTO next_num;

    RETURN p_prefix || '-' || lpad(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hash_password(p_plain TEXT)
RETURNS TEXT AS $$
    SELECT crypt(p_plain, gen_salt('bf'));
$$ LANGUAGE sql SECURITY DEFINER;

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

    IF u.password = crypt(p_password, u.password) OR u.password = p_password THEN
        UPDATE users SET last_active = to_char(NOW(), 'Mon DD, YYYY HH24:MI') WHERE id = u.id;
        RETURN json_build_object('success', true, 'user', row_to_json(u));
    END IF;

    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_password(p_user_id INT, p_current TEXT, p_new TEXT)
RETURNS JSON AS $$
DECLARE
    u users%ROWTYPE;
BEGIN
    SELECT * INTO u FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    IF NOT (u.password = crypt(p_current, u.password) OR u.password = p_current) THEN
        RETURN json_build_object('success', false, 'error', 'Current password is incorrect');
    END IF;

    UPDATE users SET password = crypt(p_new, gen_salt('bf')) WHERE id = p_user_id;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF SCHEMA
-- Payatas Ledger v3 — Barangay Payatas, Quezon City
-- ============================================================
