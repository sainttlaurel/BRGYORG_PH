ALTER TABLE documents ADD COLUMN IF NOT EXISTS id_upload TEXT;

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS respondent TEXT DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS handler TEXT DEFAULT '';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS hearing_date TEXT DEFAULT '';

ALTER TABLE polls ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE polls ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'FileText',
  duration TEXT DEFAULT '',
  fee TEXT DEFAULT '',
  requirements JSONB DEFAULT '[]'
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_anon_read" ON services;
CREATE POLICY "services_anon_read" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "services_anon_write" ON services;
CREATE POLICY "services_anon_write" ON services FOR ALL USING (true) WITH CHECK (true);

INSERT INTO services (title, description, icon, duration, fee, requirements)
SELECT * FROM (VALUES
  ('Barangay Clearance', 'Official certification that you are a resident in good standing', 'FileCheck', '30 mins', '₱50', '["Valid ID", "Proof of Residency"]'::jsonb),
  ('Barangay Certificate', 'General certificate for various purposes', 'Award', '30 mins', '₱30', '["Valid ID", "Purpose Statement"]'::jsonb),
  ('Certificate of Indigency', 'Proof of financial status for assistance programs', 'Heart', '1 hour', 'Free', '["Valid ID", "Proof of Income", "Social Case Study"]'::jsonb),
  ('Certificate of Residency', 'Confirms legitimate resident of the barangay', 'Home', '30 mins', '₱30', '["Valid ID", "Utility Bill"]'::jsonb),
  ('Business Clearance', 'Required for business permit renewal', 'Briefcase', '2-3 days', '₱200', '["DTI/SEC Registration", "Business Address Proof", "Tax Clearance"]'::jsonb),
  ('Blotter Report', 'Official record of incidents, disputes, or complaints', 'Shield', '1-2 hours', 'Free', '["Valid ID", "Written Complaint"]'::jsonb),
  ('Good Moral Certificate', 'Attests to good character and moral standing', 'Star', '1 hour', '₱50', '["Valid ID", "2 Endorsement Letters"]'::jsonb),
  ('Certification for Solo Parent', 'Official recognition as solo parent for benefits', 'Users', '3-5 days', 'Free', '["Birth Certificate of Child", "Marriage Certificate", "Death Certificate"]'::jsonb)
) AS s WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);
