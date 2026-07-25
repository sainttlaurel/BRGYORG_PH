DROP POLICY IF EXISTS "suggestions_anon_read" ON suggestions;
CREATE POLICY "suggestions_anon_read" ON suggestions FOR SELECT USING (true);
