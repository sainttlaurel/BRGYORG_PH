-- Create logos storage bucket (public, 2MB limit, PNG/SVG/JPEG only)
-- Requires supabase_schema or superuser; run via dashboard if this fails.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/png', 'image/svg+xml', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Allow public SELECT on logos bucket (anyone can view)
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
CREATE POLICY "logos_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Allow anon INSERT into logos bucket (for logo upload)
DROP POLICY IF EXISTS "logos_anon_insert" ON storage.objects;
CREATE POLICY "logos_anon_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos');
