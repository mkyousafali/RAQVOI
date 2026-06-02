-- Create hero_images table
CREATE TABLE hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title VARCHAR(100),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read hero_images"
  ON hero_images FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert hero_images"
  ON hero_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin update hero_images"
  ON hero_images FOR UPDATE
  USING (true);

CREATE POLICY "Allow admin delete hero_images"
  ON hero_images FOR DELETE
  USING (true);

-- Create indexes
CREATE INDEX idx_hero_images_order ON hero_images(display_order);
CREATE INDEX idx_hero_images_active ON hero_images(is_active);

-- Create RPC function for fetching hero images
CREATE OR REPLACE FUNCTION get_hero_images()
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  title VARCHAR(100),
  description TEXT,
  display_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, image_url, title, description, display_order, is_active, created_at, updated_at
  FROM hero_images
  WHERE is_active = true
  ORDER BY display_order ASC;
$$ LANGUAGE SQL STABLE;
