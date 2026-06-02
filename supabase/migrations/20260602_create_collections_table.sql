-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add collection_id column to products table
ALTER TABLE products ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_products_collection_id ON products(collection_id);
CREATE INDEX idx_collections_name ON collections(name);

-- Insert default collections
INSERT INTO collections (name, description) VALUES
('Summer', 'Summer collection items'),
('Winter', 'Winter collection items'),
('Spring', 'Spring collection items'),
('Fall', 'Fall collection items'),
('Casual', 'Casual everyday wear'),
('Formal', 'Formal and party wear')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections (public read, admin write)
CREATE POLICY "Allow public read collections"
  ON collections FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert collections"
  ON collections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update collections"
  ON collections FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete collections"
  ON collections FOR DELETE
  USING (true);
