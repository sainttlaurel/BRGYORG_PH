-- ============================================================
-- MERGED DATABASE SCHEMA
-- Payatas Ledger + Barangay Clearance System
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP EXISTING TABLES (clean reset — comment out if updating)
-- ============================================================
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS clearance_requests CASCADE;
DROP TABLE IF EXISTS document_counters CASCADE;

-- ============================================================
-- USERS
-- Matches app.js: { id, name, username, password, role, email, status, lastActive, initials }
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Staff', -- 'Admin' | 'Staff'
    email VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' | 'Suspended'
    last_active VARCHAR(100) DEFAULT 'Never',
    initials VARCHAR(5) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default users
INSERT INTO users (name, username, password, role, email, status, last_active, initials) VALUES
('Admin Payatas', 'admin', 'admin123', 'Admin', 'admin@payatas.gov.ph', 'Active', '2 mins ago', 'AP'),
('Elena Garcia', 'egarcia', 'staff123', 'Staff', 'elena.garcia@payatas.gov.ph', 'Active', '1 hour ago', 'EG'),
('Roberto Santos','rsantos', 'staff123', 'Staff', 'roberto.santos@payatas.gov.ph', 'Active', '3 days ago', 'RS');

-- ============================================================
-- RESIDENTS
-- Matches app.js: { id, fname, lname, purok, contact, status, registered, address, gender, dob, notes }
-- ============================================================
CREATE TABLE residents (
    id VARCHAR(20) PRIMARY KEY, -- e.g. PAY-029481
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    purok VARCHAR(20) NOT NULL,
    contact VARCHAR(30) DEFAULT 'N/A',
    status VARCHAR(20) DEFAULT 'Active', -- 'Active' | 'Inactive'
    registered VARCHAR(4) DEFAULT '', -- year e.g. '2023'
    address TEXT DEFAULT 'Barangay Payatas',
    gender VARCHAR(10) DEFAULT 'N/A',
    dob VARCHAR(20) DEFAULT 'N/A', -- ISO date string or 'N/A'
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample residents
INSERT INTO residents (id, fname, lname, purok, contact, status, registered, address, gender, dob) VALUES
('PAY-029481', 'Maria Clara', 'Agustin', 'Purok 1', '+63 912 345 6789', 'Active', '2018', 'Block 3 Lot 5, Purok 1, Barangay Payatas', 'Female', '1985-04-12'),
('PAY-055102', 'Santiago', 'Bautista Jr.','Purok 3','+63 945 882 1092','Active', '2020', 'Block 7 Lot 2, Purok 3, Barangay Payatas', 'Male', '1991-08-23'),
('PAY-010293', 'Theresa Mae', 'Cruz', 'Purok 2', '+63 908 556 1234', 'Inactive', '2015', 'Block 1 Lot 8, Purok 2, Barangay Payatas', 'Female', '1978-01-15');

-- ============================================================
-- DOCUMENTS
-- Matches app.js: { id, resident, type, date, status, ref, purpose, contact }
-- ============================================================
CREATE TABLE documents (
    id VARCHAR(20) PRIMARY KEY, -- e.g. DOC-001
    resident VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending'|'Approved'|'Rejected'
    ref VARCHAR(30) DEFAULT '',


-- Sample documents
INSERT INTO documents (id, resident, type, date, status, ref, purpose) VALUES
('DOC-001', 'Mateo Cruz', 'Barangay Clearance', '2024-10-24', 'Approved', 'PAY-2024-001', 'Employment'),
('DOC-002', 'Elena Santos', 'Certificate of Indigency', '2024-10-26', 'Pending', 'PAY-2024-002', 'Medical assistance');

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE complaints (
    id VARCHAR(20) PRIMARY KEY,
    complainant VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- 'High'|'Medium'|'Low'
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending'|'Resolved'
    date VARCHAR(10) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Planned',
    budget BIGINT DEFAULT 0,
    progress INTEGER DEFAULT 0, -- 0-100
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(30) DEFAULT 'general',
    content TEXT DEFAULT '',
    date VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BARANGAY CLEARANCE SYSTEM TABLES
-- ============================================================
-- DOCUMENT COUNTERS
CREATE TABLE document_counters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doc_type TEXT NOT NULL,
    year INT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    UNIQUE(doc_type, year)
);

-- CLEARANCE REQUESTS
CREATE TABLE clearance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL,
    control_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

-- ============================================================
-- RPC: Get next clearance number safely
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_clearance_number(p_year INT) RETURNS INT LANGUAGE plpgsql AS $$
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_residents" ON residents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clearance" ON clearance_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_counters" ON document_counters FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_residents_purok ON residents(purok);
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_announcements_cat ON announcements(category);
CREATE INDEX idx_announcements_date ON announcements(date);
CREATE INDEX idx_clearance_status ON clearance_requests(status);
CREATE INDEX idx_clearance_control ON clearance_requests(control_number);
CREATE INDEX idx_clearance_verification ON clearance_requests(verification_code);
CREATE INDEX idx_clearance_created ON clearance_requests(created_at DESC);

-- ============================================================
-- END OF MERGED SCHEMA
-- ============================================================