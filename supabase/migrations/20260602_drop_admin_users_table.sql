-- Migration: Clean up and remove old admin_users table
-- Date: 2026-06-02
-- Description: Drop old admin_users table, keep only users table

BEGIN;

-- Step 1: Drop the old admin_users table (all data has been migrated to users)
DROP TABLE IF EXISTS admin_users CASCADE;

-- Step 2: Create a function to update last login (more reliable than RLS)
CREATE OR REPLACE FUNCTION update_user_last_login(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET last_login_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_user_last_login(uuid) TO anon;

COMMIT;
