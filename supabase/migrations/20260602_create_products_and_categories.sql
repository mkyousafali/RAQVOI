-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_categories_name ON categories(name);

-- Insert default categories from existing data
INSERT INTO categories (name, description) VALUES
('DRESSES', 'Beautiful dresses for all occasions'),
('ETHNIC WEAR', 'Traditional and ethnic clothing'),
('TOPS', 'Stylish tops and blouses'),
('CO-ORD SETS', 'Coordinated outfit sets'),
('SALE', 'Discounted items')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Allow public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role = 'master_admin'
    )
  );

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Allow public read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Allow admin delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = current_setting('app.current_user_id')::uuid 
      AND users.role = 'master_admin'
    )
  );
