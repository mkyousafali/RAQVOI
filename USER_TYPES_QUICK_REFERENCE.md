# 🎯 Quick User Type Identification Guide

## Simple Overview

```
┌─────────────────────────────────────┐
│   User Tries to Login               │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Check admin_users   │
        │ table               │
        └────────┬────────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
    FOUND           NOT FOUND
         │               │
    ┌────┴──────┐        │
    ▼           ▼        ├─→ Check employees
  Check    OTHER         │
 username   ADMIN        ├─→ Check customers
    │          │         │
    ▼          ▼         ├─→ Check suppliers
  madmin    ADMIN        │
    │                    ▼
    ▼            [NOT A USER]
  MASTER        LOGIN FAILED ❌
  ADMIN   ✅
```

---

## 🔑 Quick Decision Tree

```
WHO IS THIS USER?
│
├─ Username = "madmin"? → MASTER ADMIN 👑
│  (Can create/delete users, full system access)
│
├─ In admin_users table? → ADMIN 👤
│  (Can access admin panel, limited permissions)
│
├─ In employees table? → EMPLOYEE 💼
│  (Can access employee portal only)
│
├─ In customers table? → CUSTOMER 🛍️
│  (Can access shop, browse products)
│
└─ Not found anywhere? → INVALID LOGIN ❌
```

---

## 💡 Real-World Examples

### Example 1: Madmin Logs In
```
Input: madmin / @#Imanihayath120
       ↓
Query admin_users table
       ↓
Found: username='madmin', password matches ✅
       ↓
Check username: Is it 'madmin'?
       ↓
YES → MASTER ADMIN
       ↓
- Full system access ✅
- Can create users ✅
- Can delete users ✅
- All RLS policies allow access ✅
```

### Example 2: Regular Admin Logs In
```
Input: aisha / password123
       ↓
Query admin_users table
       ↓
Found: username='aisha', password matches ✅
       ↓
Check username: Is it 'madmin'?
       ↓
NO → REGULAR ADMIN
       ↓
- Admin panel access ✅
- Cannot create users ❌
- Cannot delete users ❌
- Limited RLS policies ✅
```

### Example 3: Employee Logs In (Future)
```
Input: ahmed@raqvoi.com / password456
       ↓
Query admin_users table
       ↓
Not found ❌
       ↓
Query employees table
       ↓
Found: email matches, password matches ✅
       ↓
EMPLOYEE
       ↓
- Employee portal access ✅
- Own data only ✅
- Cannot access admin panel ❌
- Cannot see other employees' data ❌
```

### Example 4: Customer Logs In (Future)
```
Input: fatima@email.com / mypassword
       ↓
Query admin_users table → Not found
Query employees table → Not found
       ↓
Query customers table
       ↓
Found: email matches, password matches ✅
       ↓
CUSTOMER
       ↓
- Shop access ✅
- Browse products ✅
- Own orders only ✅
- Cannot access admin ❌
```

---

## 🛠️ How to Check User Type in Code

### Check 1: Is this user an admin?
```typescript
function isAdmin(user: { username?: string }) {
  return user?.username !== undefined;
}
// If has username, must be from admin_users table
```

### Check 2: Is this user a master admin?
```typescript
function isMasterAdmin(user: { username?: string }) {
  return user?.username === 'madmin';
}
```

### Check 3: What permissions does this user have?
```typescript
function getPermissions(user: { username?: string }) {
  if (user?.username === 'madmin') {
    return {
      canCreateUsers: true,
      canDeleteUsers: true,
      canEditSettings: true,
      viewAllData: true
    };
  } else if (user?.username) {
    return {
      canCreateUsers: false,
      canDeleteUsers: false,
      canEditSettings: false,
      viewAllData: true
    };
  }
  return null; // Not an admin
}
```

### Check 4: Can user access this resource?
```typescript
function canAccessResource(user: { id: string, username?: string }, resourceOwnerId: string) {
  // Admins can access everything
  if (user?.username) return true;
  
  // Non-admins can only access their own resources
  return user?.id === resourceOwnerId;
}
```

---

## 📋 Current State: Admin Users Only

```sql
-- Only table used currently
admin_users (
  id: uuid,
  username: text,          ← How we identify user type
  password: text (hashed),
  whatsapp: text,
  is_active: boolean,
  ...
)

Records:
┌─────────────────────────────┬──────────┐
│ username                    │ Role     │
├─────────────────────────────┼──────────┤
│ madmin                      │ MASTER   │
│ (other usernames)           │ ADMIN    │
└─────────────────────────────┴──────────┘
```

---

## 🔮 Future State: Multi-Role System

```sql
-- Unified users table
users (
  id: uuid,
  email: text,
  password: text (hashed),
  role: text,     ← How we identify user type (NEW!)
  status: text,
  created_at: timestamp,
  ...
)

-- Role-specific tables store extra details
admins (id, username, whatsapp, quick_access_code)
employees (id, department, manager_id, start_date)
customers (id, first_name, last_name, whatsapp)

Records:
┌─────────────────────────────┬──────────┬─────────────┐
│ email                       │ role     │ status      │
├─────────────────────────────┼──────────┼─────────────┤
│ madmin@raqvoi.com           │ master_a │ active      │
│ admin1@raqvoi.com           │ admin    │ active      │
│ ahmed@raqvoi.com            │ employee │ active      │
│ fatima@customer.com         │ customer │ active      │
└─────────────────────────────┴──────────┴─────────────┘
```

---

## ✅ Current Implementation Details

### How Admin Login Works Now
```typescript
// File: src/lib/adminStore.ts

export const login = async (username: string, password: string) => {
  // 1. Query admin_users table for this username
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();

  if (!data) {
    return { success: false, error: 'User not found' };
  }

  // 2. Verify password
  const passwordValid = await verifyPassword(password, data.password);
  if (!passwordValid) {
    return { success: false, error: 'Invalid password' };
  }

  // 3. Determine if master admin by checking username
  const isMaster = username === 'madmin';

  // 4. Create session and set RLS context
  const token = generateSessionToken();
  sessionToken.set(token);
  adminUser.set({
    id: data.id,
    username: data.username,
    whatsapp: data.whatsapp,
    isMaster: isMaster  // ← New: Track if master
  });

  // 5. Set RLS context for database policies
  await supabase.rpc('set_admin_context', {
    p_admin_id: data.id
  });

  return { success: true };
};
```

### RLS Policies Check User Type
```sql
-- Policy checks if user is admin (has active session)
CREATE POLICY "admins_access"
  ON admin_panel FOR SELECT
  USING (
    current_setting('app.current_admin_id', true) != ''
  );

-- Master admin gets extra permissions in application logic
-- (SQL doesn't differentiate yet, frontend code does)
```

---

## 🎬 Frontend: Determine What to Show

### In AdminLogin.svelte
```svelte
<script>
  import { adminUser, isAdminLoggedIn } from '$lib/adminStore';
  
  async function handleLogin(username, password) {
    const result = await login(username, password);
    
    if (result.success) {
      // Check if master admin
      if ($adminUser.username === 'madmin') {
        console.log('👑 Master admin logged in');
        // Show full admin panel with user management
      } else {
        console.log('👤 Regular admin logged in');
        // Show limited admin panel
      }
    }
  }
</script>
```

### In AdminUsersWindow.svelte (User Management)
```svelte
<script>
  import { adminUser } from '$lib/adminStore';
  
  // Only master admin can create/delete users
  $: canManageUsers = $adminUser?.username === 'madmin';
</script>

<button disabled={!canManageUsers}>
  Add New Admin User
</button>
```

---

## 🔄 How Identification Changes Over Time

### Time: Now (June 2026)
```
Users → Admin Users Only
        │
        ├─ madmin → Master Admin
        └─ Others → Regular Admin
```

### Time: Future (After Multi-Role Implementation)
```
Users → Combined users table
        │
        ├─ role: 'master_admin' → Master Admin Portal
        ├─ role: 'admin' → Admin Portal
        ├─ role: 'employee' → Employee Portal
        └─ role: 'customer' → Customer Shop
```

---

## 📊 Identification Method: Current vs Future

| Aspect | NOW | FUTURE |
|--------|-----|--------|
| **Where stored** | admin_users table | users table |
| **How identified** | By table + username | By users.role |
| **Master check** | username === 'madmin' | role === 'master_admin' |
| **Admin check** | In admin_users table | role === 'admin' |
| **Employee check** | Not possible | role === 'employee' |
| **Customer check** | Not possible | role === 'customer' |
| **Scalability** | Limited | Scales to 100+ roles |
| **RLS policies** | Simple | Complex per role |

---

## 🚀 Next Steps

### To Understand Current System
1. ✅ Read this file (you are here!)
2. ✅ Check [src/lib/adminStore.ts](src/lib/adminStore.ts) for login code
3. ✅ Check [supabase/migrations/admin_rls_setup.sql](supabase/migrations/admin_rls_setup.sql) for policies

### To Implement Multi-Role System (Future)
1. Create migration: `20260625_unified_users.sql`
2. Create `users` table with `role` column
3. Create `employees`, `customers` tables
4. Migrate existing admin data
5. Update `adminStore.ts` to unified auth
6. Create Employee and Customer portals
7. Update RLS policies for each role

---

## ❓ Quick Reference

**Q: How does the system know if someone is a master admin?**  
A: It checks if `username === 'madmin'`

**Q: Can I have multiple master admins?**  
A: Currently no (only one 'madmin'). Future system could have `role = 'master_admin'` for multiple users.

**Q: How do employees login?**  
A: Not implemented yet. Will query `employees` table with email/password.

**Q: How do customers login?**  
A: Not implemented yet. Will query `customers` table with email/password.

**Q: Can one person be multiple types?**  
A: Currently no. Future system uses single `role` column (but could be extended to multiple roles).

---

## 📈 Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    LOGIN ENDPOINT                        │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
    Admin Table            Other Tables
    └──────┬─────────      (employees, customers)
           │               (To be created)
        ┌──┴──────┐
        ▼         ▼
    'madmin'   OTHER ADMINS
        │           │
        ▼           ▼
    MASTER ADMIN  ADMIN
    (Full Access) (Limited Access)
```

---

## 🎯 TL;DR (Too Long; Didn't Read)

**Currently:**
- Only **Admin Users** exist in the system
- Identified by being in `admin_users` table
- **Master admin** identified by username = 'madmin'
- **Regular admins** are other usernames

**Future:**
- Will have 4 types: Master Admin, Admin, Employee, Customer
- Identified by `users.role` column
- Each has separate login endpoint
- Each routes to different portal

**How it works:**
```
Login → Check table → Check role/username → Route to correct portal
```

