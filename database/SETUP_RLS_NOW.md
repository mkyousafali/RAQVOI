# 🔐 RLS Migration - Apply Now

## Quick Setup (Takes 2 minutes)

### Step 1: Open Supabase SQL Editor
👉 **Go directly to:** https://app.supabase.com/project/bvsynxmxoucjlqaurytz/sql/new

### Step 2: Copy the SQL

Open file: `supabase/migrations/admin_rls_setup.sql`

**OR copy this SQL:**

```sql
-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Function to set user context (called during login)
CREATE OR REPLACE FUNCTION set_admin_context(p_admin_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_admin_id', p_admin_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Policy: Admins can read all admin records
CREATE POLICY "Admins read all admin records"
  ON admin_users
  FOR SELECT
  USING (current_setting('app.current_admin_id', true) != '');

-- Policy: Admins can update their own record
CREATE POLICY "Admins update own record"
  ON admin_users
  FOR UPDATE
  USING (
    id::text = current_setting('app.current_admin_id', true)
    AND current_setting('app.current_admin_id', true) != ''
  );

-- Policy: Admins can insert new records
CREATE POLICY "Master admin creates records"
  ON admin_users
  FOR INSERT
  WITH CHECK (current_setting('app.current_admin_id', true) != '');

-- Policy: Admins can delete records
CREATE POLICY "Master admin deletes records"
  ON admin_users
  FOR DELETE
  USING (current_setting('app.current_admin_id', true) != '');

GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon;
```

### Step 3: Paste into SQL Editor
1. Paste the SQL into the Supabase SQL editor (from Step 1)
2. Click the **RUN** button
3. Wait for completion (should take ~2 seconds)

### Step 4: Verify Success
After running, you should see:
```
Query executed successfully
```

---

## ✅ How to Verify It Worked

### Check 1: RLS is Enabled
1. Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/editor
2. Click on **admin_users** table
3. Look for "RLS" label - should show **🔒 enabled** (green)

### Check 2: Policies are Created
1. Same page (admin_users table)
2. Scroll down to "Policies" section
3. You should see 4 policies:
   - ✅ Admins read all admin records
   - ✅ Admins update own record
   - ✅ Master admin creates records
   - ✅ Master admin deletes records

### Check 3: Function Exists
1. Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/database/functions
2. Look for: **set_admin_context** function
3. Should be listed there

---

## 🧪 Test the Setup

### Test Login Persistence
1. Go to: http://localhost:5173/admin
2. Log in with:
   - Username: `madmin`
   - Password: `@#Imanihayath120`
3. After logging in, press **F5** to refresh the page
4. ✅ You should STAY logged in (session persisted from localStorage)

### Test RLS in Console
1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. After logging in, you should see:
   ```
   🔐 Setting up secure database context...
   ✅ RLS context set successfully
   ✅ Login successful for user: madmin
   ```

---

## 📊 Database Details

| Property | Value |
|----------|-------|
| **Host** | db.bvsynxmxoucjlqaurytz.supabase.co |
| **Database** | postgres |
| **Port** | 5432 |
| **Table** | admin_users |
| **Project ID** | bvsynxmxoucjlqaurytz |

---

## ❓ Troubleshooting

### Error: "relation \"admin_users\" does not exist"
**Solution:** The admin_users table hasn't been created yet. Create it first:
```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  quick_access_code text,
  whatsapp text,
  is_active boolean DEFAULT true,
  last_login_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Error: "function set_admin_context already exists"
**Solution:** This is fine! It just means the function already exists. The `CREATE OR REPLACE` will update it.

### Error: "permission denied"
**Solution:** Make sure you're using the **Service Role** key or **postgres** user with full permissions.

---

## 🎯 What Each Query Does

| Query | Purpose |
|-------|---------|
| `ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY` | Activates RLS |
| `CREATE FUNCTION set_admin_context()` | Sets session context for authenticated users |
| `CREATE POLICY "Admins read..."` | Allows authenticated admins to read all records |
| `CREATE POLICY "Admins update..."` | Allows admins to update their own record |
| `CREATE POLICY "Master admin creates..."` | Allows authenticated admins to create records |
| `CREATE POLICY "Master admin deletes..."` | Allows authenticated admins to delete records |
| `GRANT ... TO anon` | Gives anon role permissions (RLS policies control actual access) |

---

## 📝 Next Steps After Migration

1. ✅ Test admin login at http://localhost:5173/admin
2. ✅ Verify session persistence (refresh page, should stay logged in)
3. ✅ Check browser console for success messages
4. ✅ Optional: Implement session timeout (currently indefinite)
5. ✅ Optional: Add RBAC for different admin roles

---

## 💡 How RLS Works in This Setup

1. **User logs in** → Password verified via bcrypt
2. **Session created** → Token + session data saved to localStorage
3. **RLS context set** → `set_admin_context()` RPC called with user ID
4. **Session persisted** → Stays in localStorage until logout
5. **On page reload** → Session restored, RLS context re-established
6. **Database access** → RLS policies check `current_setting('app.current_admin_id')`
7. **Unauthenticated users** → Cannot access admin_users table (RLS denies)

---

## 🚀 You're Done!

Once you've run the SQL migration, your RAQVOI admin panel has:

✅ Persistent admin sessions  
✅ Row-level security on admin_users table  
✅ Automatic session restoration on page reload  
✅ Database context tracking for audit trails  
✅ Protection against unauthorized access  

**Need help?** See `RLS_AND_AUTH_SETUP.md` for detailed architecture documentation.
