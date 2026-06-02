# Database Scripts & Migrations

This folder contains all database management scripts and utilities.

## Important Security Note

⚠️ **NEVER commit the actual migration scripts with hardcoded credentials!**

All database scripts **MUST use environment variables** from `.env` file:
- `DATABASE_URL` - Connection string for database operations
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (KEEP SECRET!)

## Setup

1. Copy `.env.example` to `.env` in the root folder
2. Fill in your actual Supabase credentials
3. Never commit the `.env` file

```bash
# Set up environment
cp .env.example .env
# Edit .env with your real credentials
```

## Running Migrations

Use the migration script from the repository root:

```bash
# Apply a specific migration
node database/apply_migration.mjs 20260602_create_users_table_with_roles.sql

# Or with the full path
node database/apply_migration.mjs supabase/migrations/20260602_create_users_table_with_roles.sql
```

## Scripts in This Folder

- **apply_migration.mjs** - Apply individual migration files
- **verify_rls.mjs** - Verify RLS policies are working
- **check_policies.mjs** - List all RLS policies
- **update-master-password.js** - Update master admin password
- **Other utilities** - Various database setup and diagnostic scripts

## SQL Migrations

All actual SQL migration files are stored in `supabase/migrations/` and **ARE committed to git**.

Migration files are named with timestamps for ordering:
- `20260602_create_users_table_with_roles.sql`
- `20260602_fix_users_rls_recursion.sql`
- `20260602_drop_admin_users_table.sql`
- `20260602_fix_user_updates.sql`

## Git Policy

- ✅ **Committed**: SQL migration files in `supabase/migrations/`
- ✅ **Committed**: This README and documentation
- ❌ **NOT committed**: JavaScript/Node scripts (they may leak credentials)
- ❌ **NOT committed**: `.env` file with real credentials

## Troubleshooting

**Error: `DATABASE_URL environment variable not set`**
- Make sure you have `.env` file in the root folder
- Ensure `DATABASE_URL` is defined in the file

**Error: `Could not connect to database`**
- Verify your DATABASE_URL is correct
- Check your network connection to Supabase
- Verify your credentials are valid

## Next Steps

To add a new migration:
1. Create a new SQL file in `supabase/migrations/` with timestamp prefix
2. Write your migration SQL
3. Test it locally: `node database/apply_migration.mjs your_migration.sql`
4. Commit the SQL file (NOT the scripts)
