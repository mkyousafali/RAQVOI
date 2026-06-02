-- Grant table permissions to anon role for collections
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO anon, authenticated;
GRANT USAGE ON SEQUENCE collections_id_seq TO anon, authenticated;

-- Update products table permissions to include collection_id
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
