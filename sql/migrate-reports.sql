CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'pending',
  reporter_name TEXT,
  reporter_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert reports" ON reports;
CREATE POLICY "Anyone can insert reports"
  ON reports FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view reports by ref" ON reports;
CREATE POLICY "Anyone can view reports by ref"
  ON reports FOR SELECT
  USING (true);
