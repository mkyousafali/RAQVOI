-- Migration: Rename admin_users to users and add role-based system
-- Date: 2026-06-02
-- Description: Implement role-based user management (Master Admin, Admin, Employee, Customer)

BEGIN;

-- Step 1: Create new users table with role column
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  email text,
  password text NOT NULL,
  quick_access_code text,
  whatsapp text,
  role text NOT NULL DEFAULT 'admin',  -- 'master_admin' | 'admin' | 'employee' | 'customer'
  is_active boolean DEFAULT true,
  last_login_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Step 2: Copy data from admin_users to users (if admin_users exists)
INSERT INTO users (id, username, password, quick_access_code, whatsapp, role, is_active, created_at, updated_at)
SELECT 
  id, 
  username, 
  password, 
  quick_access_code, 
  whatsapp,
  CASE WHEN username = 'madmin' THEN 'master_admin' ELSE 'admin' END,  -- Set madmin as master_admin
  is_active,
  created_at,
  updated_at
FROM admin_users
ON CONFLICT (id) DO NOTHING;

-- Step 3: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old RLS policies on admin_users if they exist
DROP POLICY IF EXISTS "Admins read all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admins update own record" ON admin_users;
DROP POLICY IF EXISTS "Master admin creates records" ON admin_users;
DROP POLICY IF EXISTS "Master admin deletes records" ON admin_users;

-- Step 5: Create new RLS policies for users table

-- Policy 1: Admins can read all users
CREATE POLICY "Admins read all users"
  ON users
  FOR SELECT
  USING (
    current_setting('app.current_admin_id', true) != ''
    AND (
      SELECT role FROM users 
      WHERE id::text = current_setting('app.current_admin_id', true)
    ) IN ('admin', 'master_admin')
  );

-- Policy 2: Users can read their own record
CREATE POLICY "Users read own record"
  ON users
  FOR SELECT
  USING (id::text = current_setting('app.current_user_id', true));

-- Policy 3: Master admins can create any user type
CREATE POLICY "Master admin creates users"
  ON users
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users 
     WHERE id::text = current_setting('app.current_admin_id', true)) = 'master_admin'
  );

-- Policy 4: Master admins and admins can create employees
CREATE POLICY "Admins create employees"
  ON users
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users 
     WHERE id::text = current_setting('app.current_admin_id', true)) IN ('master_admin', 'admin')
  );

-- Policy 5: Master admin can update any user
CREATE POLICY "Master admin updates users"
  ON users
  FOR UPDATE
  USING (
    (SELECT role FROM users 
     WHERE id::text = current_setting('app.current_admin_id', true)) = 'master_admin'
  );

-- Policy 6: Users can update their own record
CREATE POLICY "Users update own record"
  ON users
  FOR UPDATE
  USING (id::text = current_setting('app.current_user_id', true));

-- Policy 7: Regular admins can update only themselves
CREATE POLICY "Admins update own record"
  ON users
  FOR UPDATE
  USING (
    id::text = current_setting('app.current_admin_id', true)
    AND (SELECT role FROM users WHERE id::text = current_setting('app.current_admin_id', true)) = 'admin'
  );

-- Policy 8: Master admin can delete users
CREATE POLICY "Master admin deletes users"
  ON users
  FOR DELETE
  USING (
    (SELECT role FROM users 
     WHERE id::text = current_setting('app.current_admin_id', true)) = 'master_admin'
  );

-- Step 6: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMIT;
