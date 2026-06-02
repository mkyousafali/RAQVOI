-- Create RPC functions for efficient data fetching
-- These bypass Supabase client libraries for faster queries

CREATE OR REPLACE FUNCTION get_all_categories()
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, name, description, image_url, created_at, updated_at
  FROM categories
  ORDER BY created_at DESC;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_all_products()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  category_id UUID,
  price NUMERIC(10, 2),
  image_url TEXT,
  is_active BOOLEAN,
  is_new BOOLEAN,
  stock_quantity INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, name, description, category_id, price, image_url, is_active, is_new, stock_quantity, created_at, updated_at
  FROM products
  WHERE is_active = true
  ORDER BY created_at DESC;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_products_by_category(cat_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  category_id UUID,
  price NUMERIC(10, 2),
  image_url TEXT,
  is_active BOOLEAN,
  is_new BOOLEAN,
  stock_quantity INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, name, description, category_id, price, image_url, is_active, is_new, stock_quantity, created_at, updated_at
  FROM products
  WHERE category_id = cat_id AND is_active = true
  ORDER BY created_at DESC;
$$ LANGUAGE SQL STABLE;
