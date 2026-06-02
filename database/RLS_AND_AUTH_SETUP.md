# RAQVOI Admin Panel - Persistent Authentication & RLS Setup

## Overview

This document explains how the persistent authentication system works and how to set up Row Level Security (RLS) policies in Supabase.

## Architecture

### 1. Session Persistence (Frontend)
- **localStorage** stores: admin user data + session token
- **Session token** is generated on each login for audit trails
- **Device ID** is persisted to track which devices have accessed the admin panel
- **Last login** timestamp is recorded in the database

### 2. Authentication Flow

```
LOGIN
  ↓
[Verify credentials via bcrypt]
  ↓
[Generate session token + device ID]
  ↓
[Save to localStorage]
  ↓
[Call set_admin_context RPC]
  ↓
[Update last_login in database]
  ↓
[Store in Svelte stores]
  ↓
AUTHENTICATED ✅
```

### 3. Session Restoration (on page reload)
```
PAGE LOAD
  ↓
[Check localStorage for session]
  ↓
[Validate user still exists & is_active in database]
  ↓
[Re-establish RLS context]
  ↓
[Set stores to authenticated state]
  ↓
READY ✅
```

## How It Works Without Supabase Auth

Unlike projects using Supabase Auth, this system:
- ❌ Does NOT use Supabase Auth
- ✅ Uses custom database-driven credentials
- ✅ Stores passwords as bcrypt hashes in `admin_users` table
- ✅ Implements session management via localStorage + RPC
- ✅ Uses RLS policies to restrict database access to authenticated admins

## Setting Up RLS Policies

### Step 1: Run the Migration

Go to your Supabase dashboard → SQL Editor → New Query

Copy and paste the contents of `supabase/migrations/admin_rls_setup.sql`

Execute the query.

### Step 2: What Gets Created

1. **`set_admin_context` RPC function**
   - Called after successful login
   - Sets a session variable with the current admin's ID
   - Used by RLS policies to verify authentication

2. **RLS Policies on `admin_users`**
   - SELECT: Authenticated admins can read all admin records
   - UPDATE: Admins can update their own records
   - INSERT: Authenticated admins can create new records
   - DELETE: Authenticated admins can delete records

### Step 3: Verify RLS is Enabled

In Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Find **admin_users** table
3. Verify RLS is **enabled** (green toggle)
4. See 4 policies listed: Select, Insert, Update, Delete

## Testing the Setup

### Login Test
1. Navigate to `/admin`
2. Log in with credentials (username: `madmin`, password: `@#Imanihayath120`)
3. Check browser console - should see:
   - `🔐 Setting up secure database context...`
   - `✅ RLS context set successfully`
   - `✅ Login successful`

### Session Persistence Test
1. After logging in, refresh the page
2. You should remain logged in
3. Check localStorage: DevTools → Application → Local Storage
4. Should see `admin_session` key with user data

### Session Validation Test
1. Log in successfully
2. Go to Supabase dashboard → SQL Editor
3. Run: `UPDATE admin_users SET is_active = false WHERE username = 'madmin'`
4. Refresh the admin panel page
5. Should be logged out automatically (session invalid)

## Database Schema

### admin_users Table
```sql
id (uuid, primary key)
username (text, unique)
password (text, bcrypt hashed)
quick_access_code (text, bcrypt hashed)
whatsapp (text)
is_active (boolean)
last_login_at (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

## Error Handling

### Login Errors
- **Invalid username/password** → Generic error message
- **Database connection failed** → Network error message
- **User inactive** → Account disabled message

### Session Restoration Errors
- **Invalid session** → Automatic logout, redirect to login
- **User deleted** → Automatic logout
- **User deactivated** → Automatic logout

## Security Best Practices

1. ✅ **Passwords are hashed** - Never stored in plain text (bcrypt)
2. ✅ **Session tokens are random** - Generated on each login
3. ✅ **RLS policies restrict access** - Only authenticated admins can access admin_users
4. ✅ **Device ID tracking** - Can detect multi-device access
5. ✅ **Last login tracking** - Audit trail of access
6. ✅ **is_active flag** - Can deactivate admins without deleting
7. ✅ **Session validation** - Sessions validated against database on restore

## Troubleshooting

### Issue: Login works but RLS context not setting
**Solution**: The RPC function is optional. Login will continue even if RLS context fails. Check Supabase logs.

### Issue: Session not persisting after page reload
**Solution**: Check that localStorage is enabled in browser. Check for errors in console (F12).

### Issue: "Database connection error" on login
**Solution**: Verify Supabase URL and anon key are correct in `.env`

### Issue: Quick access code not working
**Solution**: Verify the code in admin_users table is hashed with bcryptjs (same salt rounds as passwords)

## Quick Access Code

Quick access codes work like passwords:
1. 6-digit numeric codes
2. Hashed with bcryptjs (10 salt rounds)
3. Verified using bcryptjs.compare()
4. Useful for kiosk/cashier interfaces

### Set Quick Access Code

```sql
-- Hash the code "123456" first using the app's hashQuickAccessCode() function
-- Then update the table:
UPDATE admin_users 
SET quick_access_code = '$2b$10$...' 
WHERE id = '...'
```

## File Locations

- **Authentication Logic**: `src/lib/adminStore.ts`
- **Password Utils**: `src/lib/passwordUtils.ts`
- **Login Component**: `src/components/admin/AdminLogin.svelte`
- **RLS Policies**: `supabase/migrations/admin_rls_setup.sql`
- **Environment Config**: `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Next Steps

1. ✅ Run the migration to set up RLS policies
2. ✅ Test login and session persistence
3. ⏳ Implement role-based access control (RBAC) if needed
4. ⏳ Add audit logging for admin actions
5. ⏳ Implement session timeout (currently sessions persist indefinitely)
