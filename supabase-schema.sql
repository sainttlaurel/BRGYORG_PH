-- ============================================================
-- SUPABASE DATABASE SCHEMA
-- Payatas Ledger - Civic Management System
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Staff',
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  last_login TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default users
INSERT INTO users (username, password, name, email, role, status) VALUES
('admin', 'admin123', 'Admin Payatas', 'admin@payatas.gov.ph', 'Super Administrator', 'Active'),
('staff1', 'staff123', 'Maria Santos', 'maria.santos@payatas.gov.ph', 'Staff', 'Active'),
('staff2', 'staff123', 'Juan Dela Cruz', 'juan.delacruz@payatas.gov.ph', 'Staff', 'Active'),
('viewer', 'viewer123', 'Pedro Reyes', 'pedro.reyes@payatas.gov.ph', 'Viewer', 'Inactive')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- RESIDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id VARCHAR(50) UNIQUE,
  initials VARCHAR(10),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  purok VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample residents
INSERT INTO residents (resident_id, initials, name, address, purok, phone, email, status) VALUES
('PAY-2023-0842', 'MS', 'Mateo Santos', '124 Orchid St. Phase 2', 'Purok 4', '+63 917 555 0192', 'mateo@payatas.ph', 'Active'),
('PAY-2023-1129', 'ER', 'Elena Reyes', 'Blk 5 Lot 12, Area C', 'Purok 1', '+63 920 123 4567', 'elena@payatas.ph', 'Active'),
('PAY-2022-0450', 'JR', 'Juan Rivera', '45 Molave Street', 'Purok 2', '+63 945 987 6543', 'juan@payatas.ph', 'Inactive'),
('PAY-2023-1562', 'AL', 'Alicia Lopez', '78 Sampaguita Ext.', 'Purok 3', '+63 916 222 3344', 'alicia@payatas.ph', 'Active'),
('PAY-2023-2041', 'BR', 'Bernadette Ramos', '33 Kalayaan Ave.', 'Purok 5', '+63 932 441 8800', 'berna@payatas.ph', 'Active');

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id VARCHAR(50) UNIQUE,
  resident_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  purpose TEXT,
  priority VARCHAR(20) DEFAULT 'Standard',
  status VARCHAR(30) DEFAULT 'Pending',
  reject_reason TEXT,
  requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_date TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample documents
INSERT INTO documents (doc_id, resident_name, document_type, status, requested_date) VALUES
('DOC-001', 'Maria Alicia Dela Cruz', 'Barangay Clearance', 'Pending', '2023-10-23'),
('DOC-002', 'Ricardo Santos', 'Business Permit', 'Approved', '2023-10-22'),
('DOC-003', 'Juanito Pineda', 'Certificate of Indigency', 'Ready for Pickup', '2023-10-21'),
('DOC-004', 'Elena Ledesma', 'Barangay Clearance', 'Rejected', '2023-10-20'),
('DOC-005', 'Fernando Bautista', 'Business Permit', 'Approved', '2023-10-19');

-- ============================================================
-- COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(50) UNIQUE,
  complainant_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Standard',
  location VARCHAR(100),
  description TEXT,
  status VARCHAR(30) DEFAULT 'Pending Assessment',
  assigned_to VARCHAR(100),
  resolution TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample complaints
INSERT INTO complaints (case_id, complainant_name, category, priority, location, status) VALUES
('CP-8842', 'Elena Javier', 'Health & Sanitation', 'Urgent', 'Phase 3', 'Pending Assessment'),
('CP-8841', 'Roberto Cruz', 'Infrastructure', 'Standard', 'Block 5', 'In Progress'),
('CP-8839', 'Maria Luna', 'Noise Disturbance', 'Low Urgency', 'San Jose St.', 'Resolved'),
('CP-8843', 'Samuel Mateo', 'Infrastructure', 'Urgent', 'Dahlia Ave.', 'Awaiting Dispatch');

-- ============================================================
-- PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_code VARCHAR(50) UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'Planned',
  budget DECIMAL(15, 2),
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  progress INTEGER DEFAULT 0,
  contractor VARCHAR(100),
  target_date DATE,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample projects
INSERT INTO projects (project_code, title, description, status, budget, progress, contractor, target_date) VALUES
('PRJ-001', 'Phase 4 Main Road Rehabilitation', 'Complete resurfacing of main artery', 'Ongoing', 1250000, 65, 'BuildBase PH', '2023-12-31'),
('PRJ-002', 'Solar-Powered Lighting Initiative', 'Installation of 50 solar lamps', 'Completed', 450000, 100, 'SolarTech PH', '2023-09-30'),
('PRJ-003', 'Multipurpose Hall Expansion', 'Expand local health center', 'Planned', 2800000, 0, NULL, '2024-01-31'),
('PRJ-004', 'Central Payatas Drainage Upgrade', 'Drainage improvement for 2000+ households', 'Ongoing', 3200000, 28, 'BuildBase PH', '2024-03-31');

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  category VARCHAR(50),
  featured BOOLEAN DEFAULT FALSE,
  valid_until DATE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample announcements
INSERT INTO announcements (title, content, category, featured, valid_until) VALUES
('Annual Barangay Vaccination Drive & Medical Mission 2023', 'Free vaccinations, pediatric check-ups, and dental services for all residents.', 'Health', TRUE, '2023-10-31'),
('Emergency Road Maintenance: IBP Road Section', 'Scheduled repair works. Expect rerouting and minor delays.', 'Advisory', FALSE, '2023-10-30'),
('Community Clean-up Drive: Payatas Green', 'Monthly initiative to keep public parks clean.', 'Events', FALSE, '2023-10-28'),
('Quarterly Town Hall: Budget Transparency Report', 'Financial performance review and upcoming projects.', 'Governance', FALSE, '2023-10-25');

-- ============================================================
-- USER ROLES TABLE (for role-based access control)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (role_name, description, permissions) VALUES
('Super Administrator', 'Full system access', '["all"]'),
('Administrator', 'Manage users and settings', '["users", "settings", "reports"]'),
('Staff', 'Handle day-to-day operations', '["residents", "documents", "complaints", "projects"]'),
('Viewer', 'Read-only access', '["dashboard", "reports"]');

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for demo - customize as needed)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON residents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON complaints FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON user_roles FOR ALL USING (true);

-- ============================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_residents_purok ON residents(purok);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);

-- ============================================================
-- END OF SCHEMA
-- ============================================================

