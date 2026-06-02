-- Create RPC function to get all collections
CREATE OR REPLACE FUNCTION get_all_collections()
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, name, description, image_url, created_at, updated_at
  FROM collections
  ORDER BY name ASC;
$$ LANGUAGE SQL STABLE;

-- Grant permissions to anon role
GRANT EXECUTE ON FUNCTION get_all_collections() TO anon, authenticated, postgres;

-- Create RPC function to get products by collection
CREATE OR REPLACE FUNCTION get_products_by_collection(col_id UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  description TEXT,
  category_id UUID,
  collection_id UUID,
  price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN,
  is_new BOOLEAN,
  stock_quantity INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
  SELECT id, name, description, category_id, collection_id, price, image_url, is_active, is_new, stock_quantity, created_at, updated_at
  FROM products
  WHERE collection_id = col_id AND is_active = true
  ORDER BY created_at DESC;
$$ LANGUAGE SQL STABLE;

-- Grant permissions to anon role
GRANT EXECUTE ON FUNCTION get_products_by_collection(UUID) TO anon, authenticated, postgres;
