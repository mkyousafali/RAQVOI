# 🚀 Quick Start: Database Migrations

## Commands Reference

### 📝 Interactive Migration Wizard
```bash
node migrate.mjs
```
Prompts you to select a migration from the list, shows preview, and applies it.

**Best for:** When you're not sure which migration to apply

---

### ⚡ Apply Specific Migration
```bash
node apply_migration.mjs supabase/migrations/admin_rls_setup.sql
```
Or shorter:
```bash
node apply_migration.mjs admin_rls_setup
```

**Best for:** Applying a specific migration you know the name of

---

### 🔍 Check a Table
```bash
node check_table.mjs admin_users
```

Shows:
- ✅ RLS status
- 📋 All columns with data types
- 🛡️ Policies
- 📈 Row count
- ⚡ Indexes

---

### 🛡️ Check Policies Only
```bash
node check_policies.mjs admin_users
```

Shows:
- All RLS policies for a table
- Operation types (SELECT, INSERT, UPDATE, DELETE)
- USING and WITH CHECK conditions

---

### ✅ Verify Complete RLS Setup
```bash
node verify_rls.mjs
```

Shows:
- RLS enabled status
- Number of policies
- Function exists check
- Admin user count

---

## Workflow: Create & Apply New Migration

### 1️⃣ Create Migration File
Create: `supabase/migrations/YYYYMMDD_description.sql`

Example: `supabase/migrations/20260610_add_customer_preferences.sql`

```sql
-- Add customer preferences table
-- Date: 2026-06-10

CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  language text DEFAULT 'en',
  created_at timestamp DEFAULT now()
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own"
  ON customer_preferences
  FOR SELECT
  USING (customer_id = auth.uid());
```

### 2️⃣ Apply Migration
```bash
node apply_migration.mjs 20260610_add_customer_preferences.sql
```

### 3️⃣ Verify It Worked
```bash
node check_table.mjs customer_preferences
```

### 4️⃣ Commit to Git
```bash
git add supabase/migrations/20260610_add_customer_preferences.sql
git commit -m "Add customer preferences table with RLS"
```

---

## 📁 File Locations

All tools assume this structure:
```
d:\RAQVOI\
├── migrate.mjs                    ← Interactive wizard
├── apply_migration.mjs            ← Apply specific migration
├── check_table.mjs                ← Inspect table
├── check_policies.mjs             ← View RLS policies
├── verify_rls.mjs                 ← Verify RLS setup
├── MIGRATIONS_GUIDE.md            ← Full documentation
├── supabase/
│   └── migrations/
│       ├── admin_rls_setup.sql
│       ├── 20260610_new_table.sql
│       └── ...
└── ...
```

---

## 🎯 Common Tasks

### Task: Add a new column to existing table
```bash
# 1. Create migration file
# supabase/migrations/20260611_add_column.sql

ALTER TABLE admin_users ADD COLUMN ip_address text;
CREATE INDEX idx_admin_users_ip ON admin_users(ip_address);

# 2. Apply
node apply_migration.mjs add_column

# 3. Verify
node check_table.mjs admin_users
```

### Task: Add RLS to existing table
```bash
# supabase/migrations/20260612_enable_rls.sql

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read_own"
  ON customers FOR SELECT
  USING (id = auth.uid());
```

### Task: Check if RLS working
```bash
# Check table status
node check_table.mjs customers

# Check specific policies
node check_policies.mjs customers

# Verify overall setup
node verify_rls.mjs
```

---

## 📊 Database Connection Info

Used by all tools automatically:
```
Host: db.bvsynxmxoucjlqaurytz.supabase.co
Port: 5432
Database: postgres
User: postgres
Database: bvsynxmxoucjlqaurytz
```

---

## ❓ Troubleshooting

### Tool says "Migration file not found"
Make sure the file exists in: `supabase/migrations/`

### Tool says "Database connection failed"
Check internet connection to Supabase

### Tool says "permission denied"
Using correct database credentials (stored in scripts)

### Migration applied but table looks wrong
```bash
node check_table.mjs your_table_name
```

---

## 🔗 Detailed Guides

- [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) - Full migration guide with examples
- [RLS_AND_AUTH_SETUP.md](RLS_AND_AUTH_SETUP.md) - How authentication and RLS work
- [SETUP_RLS_NOW.md](SETUP_RLS_NOW.md) - Quick RLS setup guide

---

## ✨ Best Practices

✅ Always create migrations in `supabase/migrations/` folder  
✅ Use timestamp naming: `YYYYMMDD_description.sql`  
✅ Test migration on a small change first  
✅ Add comments explaining what the migration does  
✅ Use IF NOT EXISTS / IF EXISTS clauses  
✅ Verify after applying: `node check_table.mjs table_name`  
✅ Commit migration files to git for version history  

---

## 🚀 You're Ready!

Everything is set up. You can now:

1. **Create migrations** in `supabase/migrations/`
2. **Apply them** with `node migrate.mjs` or `node apply_migration.mjs`
3. **Verify** with `node check_table.mjs`
4. **Check policies** with `node check_policies.mjs`

Need help? See [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) for detailed examples.

