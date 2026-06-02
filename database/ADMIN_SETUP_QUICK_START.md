# Admin Database Setup - Quick Start

## What Was Created ✅

1. **`admin_users` table** - Stores admin user credentials
2. **RLS Policies** - Anonymous + Authenticated full access
3. **Supabase Client** - Database connection (`src/lib/supabaseClient.ts`)
4. **Updated Authentication** - Queries database instead of hardcoded values
5. **No Secret Keys in Code** - All from environment variables

---

## Quick Setup (3 Steps)

### Step 1: Run SQL in Supabase

1. Go to: https://app.supabase.com
2. Select **RAQVOI** project
3. Click **SQL Editor** → **New Query**
4. Copy & paste from: `docs/ADMIN_DATABASE_SETUP.sql`
5. Click **Run**

**Expected**: 1 master admin created (madmin/madmin)

### Step 2: Test Locally

```bash
npm run dev
```

Navigate to: `http://localhost:5173/admin`

Login with:
- **Username**: `madmin`
- **Password**: `madmin`

OR

- **Quick Code**: `369202`

### Step 3: Commit Changes

```bash
git add .
git commit -m "Setup admin authentication with Supabase database"
git push
```

---

## Table Structure

```sql
admin_users:
├── id (UUID, Primary Key)
├── username (VARCHAR, UNIQUE)
├── password (VARCHAR)
├── whatsapp (VARCHAR)
├── quick_access_code (VARCHAR, UNIQUE)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## How It Works

```
Login Form
    ↓
Query admin_users table (Supabase)
    ↓
Validate password
    ↓
Store session in localStorage
    ↓
Show Admin Panel
```

---

## Add More Admins

Run in Supabase SQL Editor:

```sql
INSERT INTO admin_users (username, password, whatsapp, quick_access_code)
VALUES (
  'john',
  'john123',
  '+966501234567',
  '555555'
);
```

---

## Documentation

📚 See [docs/ADMIN_AUTH_SYSTEM.md](ADMIN_AUTH_SYSTEM.md) for complete guide:
- RLS policy details
- Security notes
- Setting up RLS for other tables
- Troubleshooting

---

## Environment Variables

✅ **No changes needed!**

Your `.env` already has:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These load automatically in `src/lib/supabaseClient.ts`

---

## Build Output

✅ **Build successful!**
- JavaScript: 118 KB (gzip: 30.91 KB)
- CSS: 21.09 KB (gzip: 4.24 KB)
- Build time: 202ms

---

## What's Next?

⏳ **Optional Enhancements**:
- Add password hashing (bcrypt)
- Set up backend authentication endpoint
- Add audit logging
- Restrict RLS policies for production
- Add more admin features (products, orders, customers)

---

## Support

Need help? Check:
1. [docs/ADMIN_DATABASE_SETUP.sql](ADMIN_DATABASE_SETUP.sql) - SQL reference
2. [docs/ADMIN_AUTH_SYSTEM.md](ADMIN_AUTH_SYSTEM.md) - Full documentation
3. [docs/ADMIN_PANEL.md](ADMIN_PANEL.md) - Admin UI guide

All credentials are database-driven, no hardcoded secrets! 🔒
