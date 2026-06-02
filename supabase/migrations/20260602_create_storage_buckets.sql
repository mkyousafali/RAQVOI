-- Create product-images and category-images storage buckets

-- Insert product-images bucket
INSERT INTO storage.buckets (id, name, owner, public, created_at, updated_at, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  (SELECT id FROM auth.users LIMIT 1),
  true,
  NOW(),
  NOW(),
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Insert category-images bucket
INSERT INTO storage.buckets (id, name, owner, public, created_at, updated_at, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  (SELECT id FROM auth.users LIMIT 1),
  true,
  NOW(),
  NOW(),
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Grant public access to product-images bucket
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata, created_at, updated_at)
SELECT 'product-images', '.public', (SELECT id FROM auth.users LIMIT 1), '{}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'product-images' AND name = '.public')
ON CONFLICT DO NOTHING;

-- Grant public access to category-images bucket
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata, created_at, updated_at)
SELECT 'category-images', '.public', (SELECT id FROM auth.users LIMIT 1), '{}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'category-images' AND name = '.public')
ON CONFLICT DO NOTHING;

-- Create RLS policies for product-images bucket (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'product-images-public-read') THEN
    CREATE POLICY "product-images-public-read" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'product-images-auth-write') THEN
    CREATE POLICY "product-images-auth-write" ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'product-images-auth-update') THEN
    CREATE POLICY "product-images-auth-update" ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'product-images-auth-delete') THEN
    CREATE POLICY "product-images-auth-delete" ON storage.objects
      FOR DELETE
      USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Create RLS policies for category-images bucket (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category-images-public-read') THEN
    CREATE POLICY "category-images-public-read" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'category-images');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category-images-auth-write') THEN
    CREATE POLICY "category-images-auth-write" ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category-images-auth-update') THEN
    CREATE POLICY "category-images-auth-update" ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'category-images' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category-images-auth-delete') THEN
    CREATE POLICY "category-images-auth-delete" ON storage.objects
      FOR DELETE
      USING (bucket_id = 'category-images' AND auth.role() = 'authenticated');
  END IF;
END $$;
