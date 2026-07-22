-- ============================================================
-- Migration: Add officials & audit_logs tables for admin pages
-- ============================================================

-- 1. OFFICIALS
CREATE TABLE IF NOT EXISTS officials (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    position    VARCHAR(100) NOT NULL,
    committee   VARCHAR(100) DEFAULT '',
    contact     VARCHAR(30)  DEFAULT '',
    email       VARCHAR(255) DEFAULT '',
    since       VARCHAR(10)  DEFAULT '',
    bio         TEXT         DEFAULT '',
    image       VARCHAR(500) DEFAULT '',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO officials (name, position, committee, contact, email, since, bio) VALUES
('Maria Santos Cruz', 'Barangay Captain', 'Executive', '09171234567', 'captain@brgy.ph', '2022', 'Dedicated public servant with 20 years of community leadership experience.'),
('Juan Dela Cruz', 'Barangay Kagawad', 'Peace & Order', '09181234567', 'kagawad1@brgy.ph', '2022', 'Former police officer committed to community safety.'),
('Ana Reyes Gomez', 'Barangay Kagawad', 'Health & Sanitation', '09191234567', 'kagawad2@brgy.ph', '2022', 'Registered nurse advocating for community health programs.'),
('Roberto Lim Santos', 'Barangay Kagawad', 'Education & Youth', '09201234567', 'kagawad3@brgy.ph', '2022', 'Former school principal championing education initiatives.'),
('Corazon Bautista', 'Barangay Kagawad', 'Infrastructure & Environment', '09211234567', 'kagawad4@brgy.ph', '2022', 'Civil engineer focused on sustainable infrastructure.'),
('Emmanuel Torres', 'Barangay Kagawad', 'Social Services & Welfare', '09221234567', 'kagawad5@brgy.ph', '2022', 'Social worker dedicated to uplifting marginalized sectors.'),
('Luz Villanueva', 'Barangay Kagawad', 'Finance & Budget', '09231234567', 'kagawad6@brgy.ph', '2022', 'CPA with expertise in public finance management.'),
('Danilo Aquino', 'Barangay Kagawad', 'Livelihood & Enterprise', '09241234567', 'kagawad7@brgy.ph', '2022', 'Entrepreneur supporting local businesses and cooperatives.'),
('Patricia Mendoza', 'SK Chairperson', 'Sangguniang Kabataan', '09251234567', 'sk@brgy.ph', '2023', 'Youth leader advocating for youth programs and sports.'),
('Carlos Ramos', 'Barangay Secretary', 'Administration', '09261234567', 'secretary@brgy.ph', '2020', 'Experienced administrator ensuring efficient barangay operations.'),
('Grace Fernan', 'Barangay Treasurer', 'Finance', '09271234567', 'treasurer@brgy.ph', '2020', 'Accountant ensuring fiscal accountability and transparency.')
ON CONFLICT DO NOTHING;

ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "officials_anon_read"  ON officials FOR SELECT USING (true);
CREATE POLICY "officials_anon_write" ON officials FOR ALL    USING (true) WITH CHECK (true);

-- 2. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_name   VARCHAR(100) NOT NULL,
    action      VARCHAR(100) NOT NULL,
    details     TEXT         DEFAULT '',
    module      VARCHAR(50)  DEFAULT '',
    ip_address  VARCHAR(50)  DEFAULT '',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_anon_read"  ON audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_anon_write" ON audit_logs FOR ALL    USING (true) WITH CHECK (true);

-- Seed initial audit log entries
INSERT INTO audit_logs (user_name, action, details, module, ip_address) VALUES
('Carlos Ramos', 'Approved Request', 'Approved REQ-2026-0846 – Certificate of Indigency for Maria Clara Santos', 'Requests', '192.168.1.101'),
('Carlos Ramos', 'Created Announcement', 'Published COVID-19 Vaccination Schedule – Booster Dose', 'Announcements', '192.168.1.101'),
('Grace Fernan', 'Released Document', 'Released REQ-2026-0843 – Barangay Certificate for Pedro Dela Cruz Jr.', 'Requests', '192.168.1.102'),
('Maria Santos Cruz', 'Login', 'Successful login from desktop browser', 'Authentication', '192.168.1.100'),
('Juan Dela Cruz', 'Updated Blotter', 'Added hearing date for BLT-2026-042', 'Blotter', '192.168.1.104'),
('Carlos Ramos', 'Added Resident', 'New resident registered: Maria Patricia Reyes', 'Residents', '192.168.1.101'),
('IT Admin', 'Settings Changed', 'Updated certificate template for Barangay Clearance', 'Settings', '192.168.1.110'),
('Grace Fernan', 'Generated Report', 'Exported Monthly Financial Report – June 2026 (PDF)', 'Reports', '192.168.1.102');

-- 3. SETTINGS TABLES

-- 3a. Barangay info (single-row config)
CREATE TABLE IF NOT EXISTS barangay_info (
    id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name          VARCHAR(200) NOT NULL DEFAULT '',
    municipality  VARCHAR(100) NOT NULL DEFAULT '',
    province      VARCHAR(100) DEFAULT 'Metro Manila',
    region        VARCHAR(100) DEFAULT 'NCR',
    captain       VARCHAR(100) DEFAULT '',
    population    INTEGER DEFAULT 0,
    households    INTEGER DEFAULT 0,
    area          VARCHAR(50) DEFAULT '',
    hotline       VARCHAR(30) DEFAULT '',
    emergency     VARCHAR(30) DEFAULT '',
    email         VARCHAR(255) DEFAULT '',
    address       TEXT DEFAULT '',
    office_hours  VARCHAR(200) DEFAULT '',
    vision        TEXT DEFAULT '',
    mission       TEXT DEFAULT '',
    seal_url      VARCHAR(500) DEFAULT '',
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO barangay_info (name, municipality, captain, hotline, email, address, office_hours, vision, mission) VALUES
('Barangay Payatas', 'Quezon City', 'Hon. Maria Santos Cruz', '+63 2 8123 4567', 'payatas.ledger@qc.gov.ph',
 'Litex Road, Barangay Payatas, QC 1119',
 'Monday – Friday, 8:00 AM – 5:00 PM',
 'A progressive, peaceful, and prosperous barangay with empowered citizens living in a clean, green, and sustainable environment.',
 'To deliver efficient and transparent public service, promote community participation, uphold the rule of law, and ensure the welfare and development of every resident.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE barangay_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "barangay_info_anon_read"  ON barangay_info FOR SELECT USING (true);
CREATE POLICY "barangay_info_anon_write" ON barangay_info FOR ALL    USING (true) WITH CHECK (true);

-- 3b. Service fees
CREATE TABLE IF NOT EXISTS service_fees (
    id       SERIAL PRIMARY KEY,
    service  VARCHAR(200) NOT NULL,
    fee      INTEGER NOT NULL DEFAULT 0
);

INSERT INTO service_fees (service, fee) VALUES
('Barangay Clearance', 50),
('Barangay Certificate', 30),
('Certificate of Indigency', 0),
('Certificate of Residency', 30),
('Business Clearance', 200),
('Good Moral Certificate', 50),
('Certificate for Solo Parent', 0)
ON CONFLICT DO NOTHING;

ALTER TABLE service_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_fees_anon_read"  ON service_fees FOR SELECT USING (true);
CREATE POLICY "service_fees_anon_write" ON service_fees FOR ALL    USING (true) WITH CHECK (true);

-- 3c. Key-value settings
CREATE TABLE IF NOT EXISTS settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
('session_timeout', '30'),
('password_expiry', '90'),
('language', 'en'),
('date_format', 'MM/DD/YYYY'),
('timezone', 'Asia/Manila (UTC+8)')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_anon_read"  ON settings FOR SELECT USING (true);
CREATE POLICY "settings_anon_write" ON settings FOR ALL    USING (true) WITH CHECK (true);
