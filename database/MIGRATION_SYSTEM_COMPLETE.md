# 🗂️ Complete Database Migration System

## Overview

You now have a **complete, automated migration system** for applying database changes to your RAQVOI Supabase database.

---

## 🛠️ Tools Created

### 1. **migrate.mjs** - Interactive Migration Wizard
```bash
node migrate.mjs
```

**Purpose:** Guide users through applying migrations interactively

**Features:**
- 📋 Lists all available migrations
- 🎯 Select by number or name
- 👀 Shows SQL preview before applying
- ⚠️ Confirmation prompt
- ✅ Success/error handling
- 📝 Next steps guidance

**Best for:** Easy, guided migration application

---

### 2. **apply_migration.mjs** - Direct Application
```bash
node apply_migration.mjs supabase/migrations/admin_rls_setup.sql
```

**Purpose:** Apply a specific migration directly

**Features:**
- ⚡ Quick, no prompts
- 🔗 Smart file path resolution
- 📊 Shows file size and status
- ✅ Error handling with context
- 🎯 Can use various path formats

**Best for:** Scripting, automation, specific migrations

---

### 3. **check_table.mjs** - Table Inspector
```bash
node check_table.mjs admin_users
```

**Purpose:** Inspect a table's structure and RLS configuration

**Shows:**
- 🔐 RLS enabled/disabled status
- 📋 All columns with data types
- 🛡️ All security policies
- 📈 Row count
- ⚡ All indexes

**Best for:** Verification, debugging, understanding table structure

---

### 4. **check_policies.mjs** - Policy Inspector
```bash
node check_policies.mjs admin_users
```

**Purpose:** Detailed view of RLS policies

**Shows:**
- ✅ RLS status
- 📋 Each policy name and operation
- 🔍 USING conditions
- 🔍 WITH CHECK conditions
- 📊 Operation summary

**Best for:** Security audit, policy verification

---

### 5. **verify_rls.mjs** - System Verification
```bash
node verify_rls.mjs
```

**Purpose:** Verify complete RLS setup

**Checks:**
- ✅ RLS enabled on admin_users
- ✅ Security policies exist
- ✅ Context function exists
- ✅ Admin users present

**Best for:** Post-migration verification, setup confirmation

---

## 📁 Migration File Structure

### Directory
```
supabase/migrations/
```

### Naming Convention
```
YYYYMMDD_description.sql
```

### Template
```sql
-- Description of what this migration does
-- Author: [Your Name]
-- Date: 2026-06-DD

BEGIN;

-- Your SQL statements here
ALTER TABLE table_name ADD COLUMN new_column text;
CREATE INDEX idx_new_column ON table_name(new_column);

COMMIT;
```

---

## 🎯 Common Workflows

### ✅ Workflow 1: Apply Existing Migration
```bash
# Option A: Interactive
node migrate.mjs

# Option B: Direct
node apply_migration.mjs admin_rls_setup.sql

# Verify
node check_table.mjs admin_users
```

### ✅ Workflow 2: Create & Apply New Migration

**Step 1:** Create migration file
```bash
# Create file: supabase/migrations/20260610_my_feature.sql
```

**Step 2:** Write SQL
```sql
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own"
  ON customers FOR SELECT
  USING (id = auth.uid());
```

**Step 3:** Apply migration
```bash
node apply_migration.mjs 20260610_my_feature.sql
```

**Step 4:** Verify
```bash
node check_table.mjs customers
node check_policies.mjs customers
```

**Step 5:** Commit to git
```bash
git add supabase/migrations/20260610_my_feature.sql
git commit -m "Add customers table with RLS"
```

### ✅ Workflow 3: Troubleshoot Migration Issues

```bash
# 1. Check table structure
node check_table.mjs customers

# 2. Check RLS policies
node check_policies.mjs customers

# 3. Verify overall setup
node verify_rls.mjs

# 4. If issues, see MIGRATIONS_GUIDE.md for solutions
```

---

## 📋 Available Migrations

Current migrations in `supabase/migrations/`:

1. **admin_rls_setup.sql** ✅
   - Enables RLS on admin_users table
   - Creates 4 security policies
   - Sets up context function

---

## 📝 Detailed Guides

| File | Purpose |
|------|---------|
| [MIGRATIONS_QUICK_START.md](MIGRATIONS_QUICK_START.md) | Fast reference guide |
| [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) | Complete migration documentation |
| [RLS_AND_AUTH_SETUP.md](RLS_AND_AUTH_SETUP.md) | Authentication & RLS architecture |
| [SETUP_RLS_NOW.md](SETUP_RLS_NOW.md) | Quick RLS setup guide |

---

## 🚀 Example: Add Admin Activity Tracking

### Step 1: Create Migration
**File:** `supabase/migrations/20260620_audit_logging.sql`

```sql
-- Add audit logging for admin activities
-- Date: 2026-06-20

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  timestamp timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins read their own logs
CREATE POLICY "Admins read their logs"
  ON audit_logs FOR SELECT
  USING (admin_id = (SELECT id FROM admin_users 
         WHERE id::text = current_setting('app.current_admin_id', true)));

-- Create index for fast queries
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### Step 2: Apply
```bash
node apply_migration.mjs 20260620_audit_logging.sql
```

### Step 3: Verify
```bash
node check_table.mjs audit_logs
```

Output:
```
📊 Table Analysis: audit_logs
══════════════════════════════════════════════════════════════════════

🔐 RLS Status:
   ✅ 🔒 ENABLED

📋 Columns:
   • id: uuid (required)
   • admin_id: uuid (required)
   • action: text (required)
   • table_name: text (required)
   • record_id: uuid (nullable)
   • old_data: jsonb (nullable)
   • new_data: jsonb (nullable)
   • ip_address: text (nullable)
   • timestamp: timestamp with time zone (nullable)

🛡️  Policies:
   • Admins read their logs
     Command: SELECT

⚡ Indexes:
   • audit_logs_pkey
   • idx_audit_logs_admin_id
   • idx_audit_logs_timestamp
```

---

## 🔒 Database Connection Info

All tools use these credentials (stored securely in scripts):
```
Host: db.bvsynxmxoucjlqaurytz.supabase.co
Port: 5432
Database: postgres
User: postgres
Project: bvsynxmxoucjlqaurytz
```

---

## ✅ Best Practices

### Creating Migrations
✅ Use date-based names: `YYYYMMDD_description.sql`  
✅ Keep one logical change per migration  
✅ Include comments explaining the purpose  
✅ Use `IF NOT EXISTS` / `IF EXISTS` clauses  
✅ Wrap in `BEGIN; ... COMMIT;` transactions  
✅ Add indexes for frequently queried columns  
✅ Enable RLS on tables with sensitive data  

### Applying Migrations
✅ Test on a copy first if possible  
✅ Apply during low-traffic hours  
✅ Verify with `node check_table.mjs`  
✅ Check policies with `node check_policies.mjs`  
✅ Commit migration files to git immediately  

### Managing Migrations
✅ Keep migration files in version control  
✅ Document complex migrations  
✅ Use descriptive names  
✅ Never modify applied migrations  
✅ Create new migration for fixes/changes  

---

## 🆘 Troubleshooting

### Error: "Migration file not found"
```bash
# Make sure file is in supabase/migrations/
ls supabase/migrations/

# Or check with exact name
node apply_migration.mjs supabase/migrations/admin_rls_setup.sql
```

### Error: "relation already exists"
```bash
# Use IF NOT EXISTS in SQL
CREATE TABLE IF NOT EXISTS my_table (...)

# Or check if already applied
node check_table.mjs my_table
```

### Error: "Database connection failed"
```bash
# Check internet connection
# Verify database is running on Supabase
# Check credentials in scripts are correct
```

### Migration Applied But Table Looks Wrong
```bash
# Inspect the table
node check_table.mjs your_table_name

# Check policies
node check_policies.mjs your_table_name

# Read MIGRATIONS_GUIDE.md for solutions
```

---

## 🔄 Git Workflow

After applying a migration:

```bash
# 1. Verify changes
node check_table.mjs table_name

# 2. Add migration file to git
git add supabase/migrations/20260620_migration_name.sql

# 3. Commit
git commit -m "Apply migration: description of changes"

# 4. Push
git push origin main
```

---

## 📊 Summary

You now have:

✅ **5 automated tools** for migration management  
✅ **Interactive wizard** for guided application  
✅ **Direct application** for specific migrations  
✅ **Inspection tools** for verification  
✅ **Complete documentation** with examples  
✅ **Structured folder** for migrations  
✅ **Database connection** pre-configured  

---

## 🎯 Quick Commands Reference

```bash
# Interactive migration application
node migrate.mjs

# Apply specific migration
node apply_migration.mjs admin_rls_setup.sql

# Check table structure
node check_table.mjs admin_users

# View RLS policies
node check_policies.mjs admin_users

# Verify complete setup
node verify_rls.mjs
```

---

## 📚 Next Steps

1. ✅ Review [MIGRATIONS_QUICK_START.md](MIGRATIONS_QUICK_START.md)
2. ✅ Bookmark [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)
3. ✅ Create first new migration in `supabase/migrations/`
4. ✅ Apply with `node migrate.mjs`
5. ✅ Verify with `node check_table.mjs`
6. ✅ Commit migration file to git

---

**Your RAQVOI database migration system is ready to use! 🚀**

For detailed help, see [MIGRATIONS_QUICK_START.md](MIGRATIONS_QUICK_START.md) or [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md).

