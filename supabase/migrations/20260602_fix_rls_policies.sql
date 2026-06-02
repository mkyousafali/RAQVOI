-- Fix RLS policies to use auth.uid() instead of app.current_user_id

-- Drop old policies for categories
DROP POLICY IF EXISTS "Allow admin insert categories" ON categories;
DROP POLICY IF EXISTS "Allow admin update categories" ON categories;
DROP POLICY IF EXISTS "Allow admin delete categories" ON categories;

-- Create new policies for categories using auth.uid()
CREATE POLICY "Allow admin insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role = 'master_admin'
    )
  );

-- Drop old policies for products
DROP POLICY IF EXISTS "Allow admin insert products" ON products;
DROP POLICY IF EXISTS "Allow admin update products" ON products;
DROP POLICY IF EXISTS "Allow admin delete products" ON products;

-- Create new policies for products using auth.uid()
CREATE POLICY "Allow admin insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role = 'master_admin'
    )
  );
