-- Add missing UPDATE policies for tables where admin updates status via anon key

DROP POLICY IF EXISTS "reports_anon_update" ON reports;
CREATE POLICY "reports_anon_update" ON reports FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_anon_update" ON contact_messages;
CREATE POLICY "contact_messages_anon_update" ON contact_messages FOR UPDATE USING (true) WITH CHECK (true);
