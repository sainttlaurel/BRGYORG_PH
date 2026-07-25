CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_anon_insert" ON contact_messages;
CREATE POLICY "contact_anon_insert" ON contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_anon_read" ON contact_messages;
CREATE POLICY "contact_anon_read" ON contact_messages FOR SELECT USING (true);
