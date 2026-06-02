# 🗂️ Database Migrations Guide

## Quick Reference

### Apply a Migration to Database

**Option 1: Automated (Easiest)**
```bash
node apply_migration.mjs "path/to/migration.sql"
```

**Option 2: Interactive Guide**
```bash
node migrate.mjs
```

**Option 3: Manual (Supabase Dashboard)**
1. Go to: https://app.supabase.com/project/bvsynxmxoucjlqaurytz/sql/new
2. Paste SQL from migration file
3. Click "RUN"

---

## 📁 Migration File Structure

All migrations live in: `supabase/migrations/`

**Naming convention:**
```
YYYYMMDD_descriptive_name.sql
```

**Examples:**
- `20260602_admin_rls_setup.sql` ← RLS policies
- `20260603_audit_logging_tables.sql` ← New feature
- `20260604_fix_constraints.sql` ← Bug fix

---

## 🚀 How to Create a New Migration

### Step 1: Create Migration File
Create file: `supabase/migrations/YYYYMMDD_name.sql`

```sql
-- Description of what this migration does
-- Author: Your Name
-- Date: YYYY-MM-DD

BEGIN;

-- Your SQL statements here
CREATE TABLE new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_new_table_name ON new_table(name);

COMMIT;
```

### Step 2: Apply Migration
```bash
node migrate.mjs
```

Or manually:
```bash
node apply_migration.mjs supabase/migrations/YYYYMMDD_name.sql
```

---

## 🔄 Migration Lifecycle

```
1. CREATE migration file
   ↓
2. Test locally (if using local database)
   ↓
3. Apply to Supabase (production)
   ↓
4. Verify successful
   ↓
5. Commit to git with migration file
```

---

## 📋 Example Migrations

### Example 1: Add a New Table
```sql
-- Add customer preferences table
-- Date: 2026-06-03

CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  language text DEFAULT 'en',
  newsletter_enabled boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Customers can view their preferences"
  ON customer_preferences
  FOR SELECT
  USING (customer_id = auth.uid());
```

### Example 2: Modify Existing Table
```sql
-- Add fields to admin_users
-- Date: 2026-06-04

ALTER TABLE admin_users 
ADD COLUMN last_activity_at timestamp,
ADD COLUMN ip_address text,
ADD COLUMN failed_login_attempts int DEFAULT 0;

-- Create index for faster queries
CREATE INDEX idx_admin_users_activity ON admin_users(last_activity_at);
```

### Example 3: RLS Policies
```sql
-- Add audit logging
-- Date: 2026-06-05

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read their own logs
CREATE POLICY "Admins read their logs"
  ON audit_logs
  FOR SELECT
  USING (admin_id = (SELECT id FROM admin_users WHERE id = current_setting('app.current_admin_id', true)::uuid));
```

---

## 🧪 Testing Migrations

### Verify Migration Applied
```bash
node verify_migration.mjs
```

### Check Specific Table
```bash
node check_table.mjs admin_users
```

### View All Policies for Table
```bash
node check_policies.mjs admin_users
```

---

## 🔍 Troubleshooting Migrations

### Error: "relation already exists"
✅ **Safe to ignore** - Table/index already exists

```bash
-- Add IF NOT EXISTS to avoid error
CREATE TABLE IF NOT EXISTS new_table (...)
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### Error: "permission denied"
❌ **Need admin/service role key**

Make sure using correct credentials in `.env`

### Error: "foreign key constraint fails"
❌ **Missing referenced table/row**

Check all referenced tables exist first:
```bash
CREATE TABLE parent_table (...);  -- First
CREATE TABLE child_table (...);    -- After parent exists
```

### Error: "unterminated dollar-quoted string"
❌ **Function SQL syntax error**

Use `$$` for function bodies:
```sql
CREATE FUNCTION my_func()
RETURNS void AS $$
BEGIN
  -- Your code here
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Database Connection Details

```
Host: db.bvsynxmxoucjlqaurytz.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [in .env]
Project ID: bvsynxmxoucjlqaurytz
```

---

## 🔐 Best Practices for Migrations

✅ **DO:**
- Add IF NOT EXISTS / IF NOT clause to prevent errors
- Wrap in BEGIN; COMMIT; for transactions
- Include comments explaining the migration
- Test before running on production
- Keep migrations atomic (one logical change per file)
- Use timestamps in filename for ordering

❌ **DON'T:**
- Use TRUNCATE or DROP without backup
- Make breaking changes without careful planning
- Mix multiple unrelated changes in one migration
- Run on production during business hours (if possible)
- Forget to enable RLS on new tables with sensitive data

---

## 🛠️ Available Tools

### apply_migration.mjs
Apply a single migration file

```bash
node apply_migration.mjs supabase/migrations/name.sql
```

### migrate.mjs
Interactive migration selector and applier

```bash
node migrate.mjs
```

### verify_migration.mjs
Check current RLS setup

```bash
node verify_migration.mjs
```

### check_table.mjs
Inspect a specific table

```bash
node check_table.mjs table_name
```

---

## 📝 Migration Checklist

Before applying a migration:

- [ ] Migration file is in `supabase/migrations/`
- [ ] File is named with date: `YYYYMMDD_name.sql`
- [ ] SQL syntax is valid
- [ ] All tables/columns referenced exist
- [ ] RLS policies are set for sensitive tables
- [ ] Indexes are added for frequently queried columns
- [ ] Comments explain the purpose
- [ ] Wrapped in BEGIN/COMMIT transaction

After applying:

- [ ] No error messages
- [ ] Migration completed successfully
- [ ] Verification tools show changes
- [ ] App still loads without errors
- [ ] Test login still works
- [ ] Data integrity verified

---

## 🔗 Related Files

- [RLS_AND_AUTH_SETUP.md](RLS_AND_AUTH_SETUP.md) - Authentication architecture
- [SETUP_RLS_NOW.md](SETUP_RLS_NOW.md) - Quick RLS setup
- [supabase/migrations/](supabase/migrations/) - All migration files

