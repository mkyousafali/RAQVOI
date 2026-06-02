-- Disable RLS on categories and products tables
-- (Access is already protected at the application level - only admins can access the admin panel)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
