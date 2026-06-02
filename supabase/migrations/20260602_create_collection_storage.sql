-- Create collection-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for collection-images bucket
CREATE POLICY "Allow public read collection images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'collection-images');

CREATE POLICY "Allow authenticated upload to collection-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'collection-images');

CREATE POLICY "Allow authenticated update collection images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'collection-images');

CREATE POLICY "Allow authenticated delete collection images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'collection-images');
