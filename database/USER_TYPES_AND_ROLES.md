# 👥 User Types & Role System

## Current Architecture

### 1. **Admin Users** (Currently Implemented)
These are stored in the `admin_users` table:
```sql
admin_users (
  id uuid,
  username text,
  password text,          -- Bcrypt hashed
  quick_access_code text, -- 6-digit code
  whatsapp text,
  is_active boolean,
  last_login_at timestamp,
  created_at timestamp,
  updated_at timestamp
)
```

**How it's identified:**
- Login with credentials → Check admin_users table
- If found and password matches → **Admin user**
- Session token stored → User stays logged in
- RLS context set with admin_id

---

## 🎯 Current User Types Structure

### Type 1: **Master Admin** 👑
**Definition:** The primary admin with full system access

**Current Implementation:**
- Username: `madmin`
- Password: `@#Imanihayath120`
- Quick access: `369202`

**What they can do:**
- ✅ Create new admin users
- ✅ Delete admin users  
- ✅ Manage all admin functions
- ✅ Access all data

**How identified:**
```javascript
// Check if user is master admin
const isMasterAdmin = (username) => username === 'madmin';
```

---

### Type 2: **Regular Admin Users** 👤
**Definition:** Admins with limited permissions

**Current Implementation:**
- Stored in `admin_users` table
- Can login with username/password
- Can use quick access code

**What they can do:**
- ✅ View admin panel
- ✅ View user data
- ❌ Cannot create other admins
- ❌ Cannot delete other admins

---

### Type 3: **Employees** (Not Yet Implemented)
**Definition:** Staff members with access to employee portal

**Future Implementation:**
```sql
CREATE TABLE employees (
  id uuid PRIMARY KEY,
  name text,
  email text UNIQUE,
  department text,
  role text,  -- 'sales', 'support', 'warehouse', etc.
  admin_id uuid REFERENCES admin_users(id),  -- Managed by admin
  is_active boolean,
  created_at timestamp
);
```

---

### Type 4: **Customers** (Not Yet Implemented)
**Definition:** End users purchasing luxury fashion

**Future Implementation:**
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  whatsapp text,
  first_name text,
  last_name text,
  address text,
  city text,
  country text,
  is_active boolean,
  created_at timestamp
);
```

---

## 🔑 How to Identify User Type

### Method 1: Check Username (Current)
```javascript
function getUserType(username) {
  if (username === 'madmin') {
    return 'MASTER_ADMIN';
  }
  // Other usernames are regular admins
  return 'ADMIN';
}
```

### Method 2: Check Which Table (Future)
```javascript
function getUserType(userId) {
  // Check if in admin_users table
  const adminUser = await db.from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (adminUser) return 'ADMIN';
  
  // Check if in employees table
  const employee = await db.from('employees')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (employee) return 'EMPLOYEE';
  
  // Check if in customers table
  const customer = await db.from('customers')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (customer) return 'CUSTOMER';
  
  return null;
}
```

### Method 3: Use Role Column (Best Practice)
```sql
-- Create unified users table
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  password_hash text,
  role text,  -- 'master_admin', 'admin', 'employee', 'customer'
  status text, -- 'active', 'inactive', 'suspended'
  created_at timestamp
);

-- Role-specific tables store extra details
CREATE TABLE admins (
  id uuid REFERENCES users(id),
  username text UNIQUE,
  quick_access_code text,
  whatsapp text
);

CREATE TABLE employees (
  id uuid REFERENCES users(id),
  department text,
  manager_id uuid REFERENCES admins(id)
);

CREATE TABLE customers (
  id uuid REFERENCES users(id),
  first_name text,
  last_name text,
  whatsapp text
);
```

---

## 🏗️ Proposed Complete User System

### Schema (Future)
```sql
-- Main users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,  -- 'master_admin' | 'admin' | 'employee' | 'customer'
  status text DEFAULT 'active',  -- 'active' | 'inactive' | 'suspended'
  created_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Admin-specific info
CREATE TABLE admins (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  whatsapp text,
  quick_access_code text,
  last_login_at timestamp,
  login_count int DEFAULT 0,
  ip_address text
);

-- Employee-specific info
CREATE TABLE employees (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  department text,
  manager_id uuid REFERENCES admins(id),
  start_date date,
  salary_range text
);

-- Customer-specific info
CREATE TABLE customers (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  whatsapp text,
  phone text,
  address text,
  city text,
  country text,
  vip_status boolean DEFAULT false,
  total_spent numeric DEFAULT 0
);
```

---

## 🔐 RLS Policies by User Type

### Admin Can Access Admin Panel
```sql
CREATE POLICY "admins_access_panel"
  ON admin_panel FOR SELECT
  USING (
    current_setting('app.current_admin_id', true) != ''
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = current_setting('app.current_admin_id', true)
      AND role IN ('admin', 'master_admin')
    )
  );
```

### Employee Can Only See Own Data
```sql
CREATE POLICY "employees_see_own_data"
  ON employees FOR SELECT
  USING (
    id::text = current_setting('app.current_user_id', true)
  );
```

### Customer Can Only Access Own Orders
```sql
CREATE POLICY "customers_see_own_orders"
  ON orders FOR SELECT
  USING (
    customer_id::text = current_setting('app.current_user_id', true)
  );
```

### Master Admin Can Access Everything
```sql
CREATE POLICY "master_admin_all_access"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = current_setting('app.current_admin_id', true)
      AND role = 'master_admin'
    )
  );
```

---

## 📊 Comparison Table

| Feature | Master Admin | Admin | Employee | Customer |
|---------|---|---|---|---|
| **Access** | Full system | Admin panel | Employee portal | Shop |
| **Create users** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Delete users** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **View orders** | ✅ All | ✅ All | ❌ Own only | ✅ Own only |
| **Manage inventory** | ✅ Yes | ✅ Yes | ✅ Limited | ❌ No |
| **View reports** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Manage employees** | ✅ Yes | ✅ Limited | ❌ No | ❌ No |
| **Manage customers** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

---

## 🔄 Login Flow by User Type

```
User enters credentials
        ↓
Check admin_users table → Found?
        ├─ YES → Check username
        │         ├─ 'madmin' → MASTER_ADMIN
        │         └─ Other → ADMIN
        │         Create session token
        │         Set RLS context (app.current_admin_id)
        │         Store in localStorage
        │         → Admin Panel
        │
        └─ NO → Check employees table → Found?
                ├─ YES → EMPLOYEE
                │         Create session token
                │         Set RLS context (app.current_user_id)
                │         Store in localStorage
                │         → Employee Portal
                │
                └─ NO → Check customers table → Found?
                        ├─ YES → CUSTOMER
                        │         Create session token
                        │         Set RLS context (app.current_user_id)
                        │         Store in localStorage
                        │         → Customer Shop
                        │
                        └─ NO → Login Failed ❌
```

---

## 💻 Code Example: Determine User Type

### In adminStore.ts (Current Admin System)
```typescript
// Current: Only admin login
export const login = async (username: string, password: string, quickAccessCode?: string) => {
  // Admin user check
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (data && password matches) {
    // Determine if master admin
    const isMaster = username === 'madmin';
    
    sessionToken.set(token);
    adminUser.set({
      id: data.id,
      username: data.username,
      role: isMaster ? 'master_admin' : 'admin',  // NEW
      loginTime: new Date()
    });
  }
};
```

### Future: Multi-Role Login System
```typescript
export const login = async (email: string, password: string) => {
  // Check in unified users table
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (user && passwordMatches) {
    const role = user.role;  // 'master_admin' | 'admin' | 'employee' | 'customer'
    
    sessionToken.set(token);
    currentUser.set({
      id: user.id,
      email: user.email,
      role: role,  // NEW: Role-based
      type: getUserType(role)
    });
    
    // Route based on role
    if (role === 'admin' || role === 'master_admin') {
      goto('/admin');
    } else if (role === 'employee') {
      goto('/employee-portal');
    } else if (role === 'customer') {
      goto('/shop');
    }
  }
};

function getUserType(role: string) {
  const types: Record<string, string> = {
    'master_admin': 'MASTER_ADMIN',
    'admin': 'ADMIN',
    'employee': 'EMPLOYEE',
    'customer': 'CUSTOMER'
  };
  return types[role] || 'UNKNOWN';
}
```

---

## 🗂️ Frontend Routing by User Type

```svelte
<!-- App.svelte or +layout.svelte -->
<script>
  import { currentUser } from '$lib/stores';
  import { goto } from '$app/navigation';
  
  $: if ($currentUser) {
    switch ($currentUser.role) {
      case 'master_admin':
      case 'admin':
        goto('/admin');
        break;
      case 'employee':
        goto('/employee-portal');
        break;
      case 'customer':
        goto('/shop');
        break;
    }
  }
</script>

{#if $currentUser?.role === 'admin' || $currentUser?.role === 'master_admin'}
  <AdminLayout>
    <slot />
  </AdminLayout>
{:else if $currentUser?.role === 'employee'}
  <EmployeeLayout>
    <slot />
  </EmployeeLayout>
{:else if $currentUser?.role === 'customer'}
  <CustomerLayout>
    <slot />
  </CustomerLayout>
{/if}
```

---

## 🔒 Permission Checks

### Master Admin Check
```typescript
export const isMasterAdmin = (user: AdminUser) => {
  return user?.username === 'madmin';
};
```

### Has Admin Access
```typescript
export const isAdmin = (user: CurrentUser) => {
  return user?.role === 'admin' || user?.role === 'master_admin';
};
```

### Can Manage Users
```typescript
export const canManageUsers = (user: CurrentUser) => {
  return user?.role === 'master_admin';
};
```

### Can View Data
```typescript
export const canViewData = (user: CurrentUser, dataOwnerId: string) => {
  // Master admin sees all
  if (user?.role === 'master_admin') return true;
  
  // Admin sees all
  if (user?.role === 'admin') return true;
  
  // Employee/Customer sees only own
  if (user?.id === dataOwnerId) return true;
  
  return false;
};
```

---

## 📈 Migration Path

### Phase 1 ✅ (Current)
- [x] Admin users in `admin_users` table
- [x] Master admin (`madmin`) distinguished by username
- [x] RLS policies for admin access

### Phase 2 (Future)
- [ ] Create unified `users` table
- [ ] Add `role` column to track user type
- [ ] Create `employees` table
- [ ] Create `customers` table
- [ ] Implement multi-role authentication

### Phase 3 (Future)
- [ ] Employee portal with employee-specific features
- [ ] Customer shop with product browsing
- [ ] Role-based dashboard
- [ ] Permission matrix system

---

## 🎯 Quick Answer Summary

### How the System Identifies Users

**Currently:**
- ✅ **Admin users** → Stored in `admin_users` table
- ✅ **Master admin** → Username = 'madmin'
- ❌ **Employees** → Not yet implemented
- ❌ **Customers** → Not yet implemented

**Identification Method:**
```javascript
// On login:
1. Check admin_users table
   ├─ If found & password matches → Is Admin
   │   └─ If username === 'madmin' → Is Master Admin
   └─ If not found → Login fails
```

**Future (Recommended):**
- Create unified `users` table with `role` column
- Each role has its own table for role-specific data
- RLS policies enforce role-based access
- Single login endpoint routes to correct portal

---

## 📁 Implementation Files

**Current system:**
- [src/lib/adminStore.ts](src/lib/adminStore.ts) - Admin authentication

**For future multi-role system:**
- Create: `src/lib/authStore.ts` - Unified authentication
- Create: `src/lib/roleStore.ts` - Role management
- Create: `supabase/migrations/20260625_unified_users.sql` - New schema

---

## ❓ Summary: Current vs Future

| Aspect | Current | Future |
|--------|---------|--------|
| **Tables** | admin_users only | users + admins + employees + customers |
| **Identification** | By table + username | By users.role column |
| **Master Admin** | Username check | role = 'master_admin' |
| **RLS** | admin_users only | All tables with role checks |
| **Portals** | Admin only | Admin + Employee + Customer |
| **Scalability** | Limited | Highly scalable |

Ready to implement multi-role system? Let me know! 🚀

