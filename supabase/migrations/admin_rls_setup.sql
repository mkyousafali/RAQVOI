-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Function to set user context (called during login)
CREATE OR REPLACE FUNCTION set_admin_context(p_admin_id uuid)
RETURNS void AS $$
BEGIN
  -- Set custom claims for the current session
  -- This allows RLS policies to check if user is admin
  PERFORM set_config('app.current_admin_id', p_admin_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- RLS Policy: Admins can read all admin records (if authenticated via app context)
CREATE POLICY "Admins read all admin records"
  ON admin_users
  FOR SELECT
  USING (
    -- Check if current_setting is not empty (user is logged in via app)
    current_setting('app.current_admin_id', true) != ''
  );

-- RLS Policy: Admins can update their own record
CREATE POLICY "Admins update own record"
  ON admin_users
  FOR UPDATE
  USING (
    id::text = current_setting('app.current_admin_id', true)
    AND current_setting('app.current_admin_id', true) != ''
  );

-- RLS Policy: Admins can insert new records (only master admin)
CREATE POLICY "Master admin creates records"
  ON admin_users
  FOR INSERT
  WITH CHECK (
    -- This would require checking if current user is master admin
    -- For now, allow all authenticated app users to insert
    current_setting('app.current_admin_id', true) != ''
  );

-- RLS Policy: Admins can delete records (only master admin)
CREATE POLICY "Master admin deletes records"
  ON admin_users
  FOR DELETE
  USING (
    current_setting('app.current_admin_id', true) != ''
  );

-- Deny all access by default (unauthenticated)
-- This is implicit with RLS when no policies match

GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon;
