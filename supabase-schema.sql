-- ============================================================
-- SUPABASE DATABASE SCHEMA
-- Payatas Ledger — Civic Management System
-- Fields match app.js state exactly
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING TABLES (clean reset — comment out if updating)
-- ============================================================
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS projects      CASCADE;
DROP TABLE IF EXISTS complaints    CASCADE;
DROP TABLE IF EXISTS documents     CASCADE;
DROP TABLE IF EXISTS residents     CASCADE;
DROP TABLE IF EXISTS users         CASCADE;

-- ============================================================
-- USERS
-- Matches app.js: { id, name, username, password, role,
--                   email, status, lastActive, initials }
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

-- Seed default users (passwords stored plain for demo — hash in production)
INSERT INTO users (name, username, password, role, email, status, last_active, initials) VALUES
  ('Admin Payatas', 'admin',   'admin123', 'Admin', 'admin@payatas.gov.ph',          'Active', '2 mins ago',  'AP'),
  ('Elena Garcia',  'egarcia', 'staff123', 'Staff', 'elena.garcia@payatas.gov.ph',   'Active', '1 hour ago',  'EG'),
  ('Roberto Santos','rsantos', 'staff123', 'Staff', 'roberto.santos@payatas.gov.ph', 'Active', '3 days ago',  'RS');

-- ============================================================
-- RESIDENTS
-- Matches app.js: { id, fname, lname, purok, contact,
--                   status, registered, address, gender,
--                   dob, notes }
-- NOTE: id is the custom string e.g. 'PAY-029481'
-- ============================================================
CREATE TABLE residents (
  id          VARCHAR(20)   PRIMARY KEY,   -- e.g. PAY-029481
  fname       VARCHAR(100)  NOT NULL,
  lname       VARCHAR(100)  NOT NULL,
  purok       VARCHAR(20)   NOT NULL,
  contact     VARCHAR(30)   DEFAULT 'N/A',
  status      VARCHAR(20)   DEFAULT 'Active',   -- 'Active' | 'Inactive'
  registered  VARCHAR(4)    DEFAULT '',          -- year e.g. '2023'
  address     TEXT          DEFAULT 'Barangay Payatas',
  gender      VARCHAR(10)   DEFAULT 'N/A',
  dob         VARCHAR(20)   DEFAULT 'N/A',       -- ISO date string or 'N/A'
  notes       TEXT          DEFAULT '',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Seed sample residents
INSERT INTO residents (id, fname, lname, purok, contact, status, registered, address, gender, dob) VALUES
  ('PAY-029481', 'Maria Clara',  'Agustin',   'Purok 1', '+63 912 345 6789', 'Active',   '2018', 'Block 3 Lot 5, Purok 1, Barangay Payatas',  'Female', '1985-04-12'),
  ('PAY-055102', 'Santiago',     'Bautista Jr.','Purok 3','+63 945 882 1092','Active',   '2020', 'Block 7 Lot 2, Purok 3, Barangay Payatas',  'Male',   '1991-08-23'),
  ('PAY-010293', 'Theresa Mae',  'Cruz',      'Purok 2', '+63 908 556 1234', 'Inactive', '2015', 'Block 1 Lot 8, Purok 2, Barangay Payatas',  'Female', '1978-01-15'),
  ('PAY-129038', 'Leonardo',     'Dela Cruz', 'Purok 1', '+63 922 110 4492', 'Active',   '2022', 'Block 5 Lot 11, Purok 1, Barangay Payatas', 'Male',   '1995-11-07'),
  ('PAY-003482', 'Gloria',       'Estrada',   'Purok 5', '+63 933 772 0019', 'Active',   '2012', 'Block 2 Lot 4, Purok 5, Barangay Payatas',  'Female', '1962-06-30'),
  ('PAY-073910', 'Ricardo Jose', 'de Vera',   'Purok 4', '+63 917 441 2230', 'Active',   '2019', 'Block 9 Lot 6, Purok 4, Barangay Payatas',  'Male',   '1988-03-18'),
  ('PAY-098234', 'Amara',        'Luna',      'Purok 2', '+63 926 234 5678', 'Active',   '2021', 'Block 4 Lot 3, Purok 2, Barangay Payatas',  'Female', '1999-09-05');

-- ============================================================
-- DOCUMENTS
-- Matches app.js: { id, resident, type, date, status,
--                   ref, purpose, contact }
-- ============================================================
CREATE TABLE documents (
  id          VARCHAR(20)   PRIMARY KEY,   -- e.g. DOC-001
  resident    VARCHAR(100)  NOT NULL,
  type        VARCHAR(100)  NOT NULL,      -- document type name
  date        VARCHAR(10)   NOT NULL,      -- ISO date string YYYY-MM-DD
  status      VARCHAR(20)   DEFAULT 'Pending',  -- 'Pending'|'Approved'|'Rejected'
  ref         VARCHAR(30)   DEFAULT '',
  purpose     TEXT          DEFAULT '',
  contact     VARCHAR(30)   DEFAULT '',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Seed sample documents
INSERT INTO documents (id, resident, type, date, status, ref, purpose) VALUES
  ('DOC-001', 'Mateo Cruz',          'Barangay Clearance',       '2024-10-24', 'Approved', 'PAY-2024-001', 'Employment'),
  ('DOC-002', 'Elena Santos',        'Certificate of Indigency', '2024-10-26', 'Pending',  'PAY-2024-002', 'Medical assistance'),
  ('DOC-003', 'Ricardo Dalisay',     'Residency Certificate',    '2024-10-25', 'Rejected', 'PAY-2024-003', 'School enrollment'),
  ('DOC-004', 'Amara Luna',          'Barangay Clearance',       '2024-10-27', 'Pending',  'PAY-2024-004', 'Bank account'),
  ('DOC-005', 'Maria Clara Agustin', 'Business Permit',          '2024-10-28', 'Pending',  'PAY-2024-005', 'Business registration');

-- ============================================================
-- COMPLAINTS
-- Matches app.js: { id, complainant, category, priority,
--                   status, date, desc }
-- ============================================================
CREATE TABLE complaints (
  id          VARCHAR(20)   PRIMARY KEY,   -- e.g. CMP-001
  complainant VARCHAR(100)  NOT NULL,
  category    VARCHAR(50)   NOT NULL,
  priority    VARCHAR(20)   DEFAULT 'Medium',  -- 'High'|'Medium'|'Low'
  status      VARCHAR(20)   DEFAULT 'Pending', -- 'Pending'|'Resolved'
  date        VARCHAR(10)   NOT NULL,           -- ISO date string YYYY-MM-DD
  description TEXT          DEFAULT '',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Seed sample complaints
INSERT INTO complaints (id, complainant, category, priority, status, date, description) VALUES
  ('CMP-001', 'Maria Alicia Santos',  'Sanitation',    'High',   'Pending',  '2024-10-24', 'Overflowing garbage bins near the market area.'),
  ('CMP-002', 'Ricardo Jose de Vera', 'Noise',         'Medium', 'Pending',  '2024-10-25', 'Loud music from neighbor past midnight.'),
  ('CMP-003', 'Elena Ledesma',        'Public Safety', 'Low',    'Resolved', '2024-10-20', 'Broken streetlight in Purok 3.'),
  ('CMP-004', 'Benjamin Pascual',     'Sanitation',    'High',   'Pending',  '2024-10-26', 'Stagnant water causing mosquito breeding.'),
  ('CMP-005', 'Gloria Estrada',       'Infrastructure','Medium', 'Resolved', '2024-10-18', 'Pothole on main road near purok 5.');

-- ============================================================
-- PROJECTS
-- Matches app.js: { id, title, category, status,
--                   budget, progress, desc }
-- ============================================================
CREATE TABLE projects (
  id          VARCHAR(20)   PRIMARY KEY,   -- e.g. PRJ-001
  title       VARCHAR(200)  NOT NULL,
  category    VARCHAR(50)   NOT NULL,
  status      VARCHAR(20)   DEFAULT 'Planned', -- 'Planned'|'Ongoing'|'Completed'
  budget      BIGINT        DEFAULT 0,
  progress    INTEGER       DEFAULT 0,          -- 0-100
  description TEXT          DEFAULT '',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Seed sample projects
INSERT INTO projects (id, title, category, status, budget, progress, description) VALUES
  ('PRJ-001', 'Phase 4 Road Maintenance',          'Infrastructure', 'Ongoing',   4200000, 75,  'Rehabilitation of main roads in Sectors 1-4.'),
  ('PRJ-002', 'Smart LED Street Lighting',          'Public Safety',  'Ongoing',   1850000, 32,  'Installation of solar LED street lights.'),
  ('PRJ-003', 'Barangay Health Center Renovation',  'Healthcare',     'Completed', 3400000, 100, 'Full renovation of the health center facilities.'),
  ('PRJ-004', 'Flood Control & Drainage System',    'Environment',    'Ongoing',   2900000, 58,  'Upgrading drainage to prevent monsoon flooding.'),
  ('PRJ-005', 'Youth Digital Literacy Hub',         'Education',      'Planned',   1200000, 15,  'Community digital education center.'),
  ('PRJ-006', 'Eco-Waste Recovery Center',          'Sanitation',     'Ongoing',   2100000, 92,  'Organized waste sorting and recovery facility.');

-- ============================================================
-- ANNOUNCEMENTS
-- Matches app.js: { id, title, category, content, date }
-- ============================================================
CREATE TABLE announcements (
  id          VARCHAR(20)   PRIMARY KEY,   -- e.g. ANN-001
  title       VARCHAR(255)  NOT NULL,
  category    VARCHAR(30)   DEFAULT 'general', -- 'meeting'|'health'|'holiday'|'infrastructure'|'general'
  content     TEXT          DEFAULT '',
  date        VARCHAR(10)   NOT NULL,            -- ISO date string YYYY-MM-DD
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Seed sample announcements
INSERT INTO announcements (id, title, category, content, date) VALUES
  ('ANN-001', 'Annual General Assembly & Budget Transparency Forum', 'meeting',        'Join us for a detailed review of the upcoming fiscal year projects. We will discuss waste management enhancements and new youth recreational facilities.', '2024-10-24'),
  ('ANN-002', 'Community Vaccination Drive: Seniors & Children',     'health',         'Mandatory flu and pneumonia shots available at the Barangay Health Center. Please bring valid IDs and vaccination cards.',                                '2024-10-22'),
  ('ANN-003', 'All Saints'' Day: Office Operations Advisory',        'holiday',        'The Barangay Hall will be closed for non-emergency services. Garbage collection schedule remains unchanged.',                                            '2024-10-31'),
  ('ANN-004', 'Street Lighting Committee Update',                    'meeting',        'Review of solar lighting installation progress along Block 5 and 6. Resident feedback on placement is highly encouraged.',                               '2024-10-18'),
  ('ANN-005', 'Drainage System Maintenance Program',                 'infrastructure', 'Expect minor road diversions near the marketplace as we perform annual desilting to prevent monsoon flooding.',                                          '2024-10-15');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints    ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (demo — tighten in production)
CREATE POLICY "allow_all_users"         ON users         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_residents"     ON residents     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_documents"     ON documents     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_complaints"    ON complaints    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects"      ON projects      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_residents_purok      ON residents(purok);
CREATE INDEX idx_residents_status     ON residents(status);
CREATE INDEX idx_documents_status     ON documents(status);
CREATE INDEX idx_documents_type       ON documents(type);
CREATE INDEX idx_complaints_status    ON complaints(status);
CREATE INDEX idx_complaints_category  ON complaints(category);
CREATE INDEX idx_complaints_priority  ON complaints(priority);
CREATE INDEX idx_projects_status      ON projects(status);
CREATE INDEX idx_projects_category    ON projects(category);
CREATE INDEX idx_announcements_cat    ON announcements(category);
CREATE INDEX idx_announcements_date   ON announcements(date);

-- ============================================================
-- END OF SCHEMA
-- ============================================================