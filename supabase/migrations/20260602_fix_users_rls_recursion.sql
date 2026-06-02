-- Migration: Fix infinite recursion in users RLS policies
-- Date: 2026-06-02
-- Description: Replace recursive RLS policies with simpler, non-recursive ones

BEGIN;

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS "Admins read all users" ON users;
DROP POLICY IF EXISTS "Users read own record" ON users;
DROP POLICY IF EXISTS "Master admin creates users" ON users;
DROP POLICY IF EXISTS "Admins create employees" ON users;
DROP POLICY IF EXISTS "Master admin updates users" ON users;
DROP POLICY IF EXISTS "Users update own record" ON users;
DROP POLICY IF EXISTS "Admins update own record" ON users;
DROP POLICY IF EXISTS "Master admin deletes users" ON users;

-- Step 2: Disable RLS temporarily to allow login
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with simpler policies (no subqueries)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT for all during authentication phase
-- This allows login queries to work
CREATE POLICY "Public select for login"
  ON users
  FOR SELECT
  USING (true);

-- Policy 2: Allow INSERT with proper role context
CREATE POLICY "Insert with context"
  ON users
  FOR INSERT
  WITH CHECK (
    (current_setting('app.user_role', true) = 'master_admin') OR
    (current_setting('app.user_role', true) = 'admin')
  );

-- Policy 3: Allow UPDATE with proper context
CREATE POLICY "Update with context"
  ON users
  FOR UPDATE
  USING (
    -- Master admin can update anyone
    (current_setting('app.user_role', true) = 'master_admin') OR
    -- Admin can update themselves
    (current_setting('app.user_role', true) = 'admin' AND id::text = current_setting('app.current_user_id', true))
  );

-- Policy 4: Allow DELETE with proper context (master admin only)
CREATE POLICY "Delete with context"
  ON users
  FOR DELETE
  USING (
    current_setting('app.user_role', true) = 'master_admin'
  );

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;

COMMIT;
