-- Fix permissions for products and categories tables
-- Grant SELECT to anonymous users for public read

-- Grant permissions on categories table
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.categories TO anon;

-- Grant permissions on products table  
GRANT SELECT ON public.products TO anon;

-- Ensure RLS is working correctly by checking policies
-- The RLS policies should already allow public SELECT
-- This just ensures the anon role has the necessary grants

-- If the policies don't exist, create them
DO $$
BEGIN
  -- Check if categories SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Allow public read categories'
  ) THEN
    CREATE POLICY "Allow public read categories"
      ON categories FOR SELECT
      USING (true);
  END IF;

  -- Check if products SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Allow public read products'
  ) THEN
    CREATE POLICY "Allow public read products"
      ON products FOR SELECT
      USING (true);
  END IF;
END $$;
