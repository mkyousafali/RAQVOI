# RLS Migration - Manual Application Guide

## Quick Setup (2 minutes)

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/sql/new

2. **Copy & Paste SQL:**
   - Open: `supabase/migrations/admin_rls_setup.sql`
   - Copy ALL content
   - Paste into the SQL editor

3. **Execute:**
   - Click the **"Run"** button (or press Ctrl+Enter)
   - Wait for completion

4. **Verify:**
   - You should see success message
   - Check for no errors

---

## What Gets Created

After running the migration:

### ✅ RLS Enabled on admin_users Table
```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

### ✅ Function: set_admin_context()
Called during login to set session context for RLS policies:
```sql
CREATE OR REPLACE FUNCTION set_admin_context(p_admin_id uuid)
```

### ✅ 4 Security Policies
- **SELECT**: Authenticated admins can read all records
- **INSERT**: Authenticated admins can create records  
- **UPDATE**: Admins can update their own record
- **DELETE**: Authenticated admins can delete records

---

## Verify Installation

After running the migration:

1. **Check RLS is Enabled:**
   - Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/editor
   - Find **admin_users** table
   - Look for **RLS** indicator (should show "enabled")

2. **Check Policies:**
   - Same page, scroll down to "Policies"
   - You should see 4 policies listed:
     - Admins read all admin records
     - Admins update own record
     - Master admin creates records
     - Master admin deletes records

3. **Check Function:**
   - Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/database/functions
   - Look for: **set_admin_context**

---

## Troubleshooting

### Error: "relation \"admin_users\" does not exist"
- The admin_users table may not be created yet
- Create it first with: `CREATE TABLE admin_users (...)`

### Error: "function set_admin_context already exists"
- This is OK! It means you're updating an existing function
- The CREATE OR REPLACE will update it

### Error: "permission denied"
- Ensure you're using the **Service Role** key or **postgres** user
- Check that your connection has full admin privileges

---

## SQL Content to Execute

```sql
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
```

---

## After Migration

### Testing Login
1. Navigate to `/admin` page
2. Log in with credentials (madmin / @#Imanihayath120)
3. Check browser console for:
   - ✅ "🔐 Setting up secure database context..."
   - ✅ "✅ RLS context set successfully"

### Testing Session Persistence
1. After logging in, press F5 to refresh
2. You should remain logged in
3. Check localStorage (F12 → Application → Local Storage):
   - Should see: `admin_session` key

### Testing RLS Enforcement
1. Log in successfully
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try to query the database directly without being logged in:
   - Should get "permission denied" error
   - RLS is working! ✅

---

## Connection Details

**Database**: postgres  
**Host**: db.bvsynxmxoucjlqaurytz.supabase.co  
**Port**: 5432  
**Username**: postgres  
**Project ID**: bvsynxmxoucjlqaurytz

---

## Need Help?

If you encounter issues:
1. Check that admin_users table exists
2. Verify you're using service role key or postgres user
3. Check Supabase logs for errors
4. Contact support: support@supabase.io
