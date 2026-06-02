-- Insert example products with placeholder black images
INSERT INTO products (name, description, category_id, price, image_url, is_active, is_new, stock_quantity) 
SELECT 
  'Elegant Black Dress' as name,
  'A stunning black dress perfect for any occasion' as description,
  id as category_id,
  2999 as price,
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600"%3E%3Crect width="500" height="600" fill="%23000000"/%3E%3C/svg%3E' as image_url,
  true as is_active,
  true as is_new,
  15 as stock_quantity
FROM categories WHERE name = 'DRESSES'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, category_id, price, image_url, is_active, is_new, stock_quantity) 
SELECT 
  'Classic Black Top' as name,
  'Versatile black top that pairs well with everything' as description,
  id as category_id,
  999 as price,
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600"%3E%3Crect width="500" height="600" fill="%23000000"/%3E%3C/svg%3E' as image_url,
  true as is_active,
  true as is_new,
  25 as stock_quantity
FROM categories WHERE name = 'TOPS'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, category_id, price, image_url, is_active, is_new, stock_quantity) 
SELECT 
  'Ethnic Black Saree' as name,
  'Traditional ethnic saree with modern twist' as description,
  id as category_id,
  3999 as price,
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600"%3E%3Crect width="500" height="600" fill="%23000000"/%3E%3C/svg%3E' as image_url,
  true as is_active,
  true as is_new,
  10 as stock_quantity
FROM categories WHERE name = 'ETHNIC WEAR'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, category_id, price, image_url, is_active, is_new, stock_quantity) 
SELECT 
  'Black Co-Ord Set' as name,
  'Matching black top and bottom set for effortless style' as description,
  id as category_id,
  2499 as price,
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600"%3E%3Crect width="500" height="600" fill="%23000000"/%3E%3C/svg%3E' as image_url,
  true as is_active,
  true as is_new,
  20 as stock_quantity
FROM categories WHERE name = 'CO-ORD SETS'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, category_id, price, image_url, is_active, is_new, stock_quantity) 
SELECT 
  'Discounted Black Blazer' as name,
  'Premium black blazer now on sale' as description,
  id as category_id,
  1999 as price,
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600"%3E%3Crect width="500" height="600" fill="%23000000"/%3E%3C/svg%3E' as image_url,
  true as is_active,
  true as is_new,
  30 as stock_quantity
FROM categories WHERE name = 'SALE'
ON CONFLICT DO NOTHING;
