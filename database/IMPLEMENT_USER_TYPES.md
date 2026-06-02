# 🔧 How to Check User Type in Your Code

## File: src/lib/roleUtils.ts (Create This)

These utility functions make it easy to check user types throughout your app:

```typescript
/**
 * Role and Permission Utilities
 * Use these functions to check user types and permissions
 */

export type UserRole = 'master_admin' | 'admin' | 'employee' | 'customer';

export interface CurrentUser {
  id: string;
  username?: string;
  email?: string;
  role: UserRole;
}

/**
 * Check if user is a master admin (can do everything)
 */
export function isMasterAdmin(user: CurrentUser | null): boolean {
  return user?.username === 'madmin';
}

/**
 * Check if user is any kind of admin
 */
export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'master_admin';
}

/**
 * Check if user is an employee
 */
export function isEmployee(user: CurrentUser | null): boolean {
  return user?.role === 'employee';
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: CurrentUser | null): boolean {
  return user?.role === 'customer';
}

/**
 * Get user type as string
 */
export function getUserType(user: CurrentUser | null): string {
  if (!user) return 'GUEST';
  if (user.role === 'master_admin') return 'MASTER_ADMIN';
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'employee') return 'EMPLOYEE';
  if (user.role === 'customer') return 'CUSTOMER';
  return 'UNKNOWN';
}

/**
 * Get permissions for a user
 */
export function getPermissions(user: CurrentUser | null) {
  return {
    canCreateUsers: isMasterAdmin(user),
    canDeleteUsers: isMasterAdmin(user),
    canEditSettings: isMasterAdmin(user),
    canViewAllData: isAdmin(user),
    canViewOwnData: !!user,
    canViewProducts: isCustomer(user) || isAdmin(user),
    canMakePurchases: isCustomer(user),
    canViewAnalytics: isAdmin(user),
    canManageEmployees: isMasterAdmin(user),
  };
}

/**
 * Can user access this resource?
 */
export function canAccess(
  user: CurrentUser | null,
  resourceOwnerId: string,
  resourceType: 'admin' | 'employee' | 'customer' = 'employee'
): boolean {
  if (!user) return false;

  // Admins can access everything
  if (isAdmin(user)) return true;

  // Others can only access their own resources
  return user.id === resourceOwnerId;
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: CurrentUser | null): string {
  if (!user) return 'Guest';
  return user.username || user.email || 'Unknown';
}

/**
 * Get user role badge/label
 */
export function getRoleBadge(user: CurrentUser | null): string {
  const type = getUserType(user);
  const badges: Record<string, string> = {
    'MASTER_ADMIN': '👑 Master Admin',
    'ADMIN': '👤 Admin',
    'EMPLOYEE': '💼 Employee',
    'CUSTOMER': '🛍️ Customer',
    'GUEST': '❓ Guest',
    'UNKNOWN': '❓ Unknown',
  };
  return badges[type] || 'Unknown';
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  user: CurrentUser | null,
  action: 'create' | 'read' | 'update' | 'delete',
  resourceType: 'user' | 'product' | 'order',
  resourceOwnerId?: string
): boolean {
  if (!user) return false;

  // Master admin can do anything
  if (isMasterAdmin(user)) return true;

  // Admin-specific permissions
  if (isAdmin(user)) {
    if (action === 'create' && resourceType === 'user') return false; // Only master admin
    if (action === 'delete' && resourceType === 'user') return false; // Only master admin
    return true; // Admins can do most things
  }

  // Employee-specific permissions
  if (isEmployee(user)) {
    if (resourceType === 'user') return false; // Employees can't manage users
    if (action === 'create' && resourceType === 'product') return false;
    if (action === 'delete' && resourceType === 'product') return false;
    return true;
  }

  // Customer-specific permissions
  if (isCustomer(user)) {
    if (action === 'read' && resourceType === 'order') return !resourceOwnerId || resourceOwnerId === user.id;
    if (action === 'create' && resourceType === 'order') return true;
    if (resourceType === 'user' || resourceType === 'product') return false;
    return false;
  }

  return false;
}
```

---

## 📁 File: src/lib/adminStore.ts (Update This)

Add role tracking to your admin store:

```typescript
// ... existing imports ...

export interface AdminUser {
  id: string;
  username: string;
  whatsapp?: string;
  loginTime: Date;
  sessionToken: string;
  deviceId: string;
  isMaster: boolean;  // ← ADD THIS
  role: 'master_admin' | 'admin';  // ← ADD THIS
}

// ... existing code ...

export const login = async (
  username: string,
  password: string,
  quickAccessCode?: string
) => {
  try {
    // ... existing login code ...

    // After successful password verification:

    // Determine if master admin
    const isMaster = username === 'madmin';
    const role: 'master_admin' | 'admin' = isMaster ? 'master_admin' : 'admin';

    // Create user object with role
    const user: AdminUser = {
      id: data.id,
      username: data.username,
      whatsapp: data.whatsapp,
      loginTime: new Date(),
      sessionToken: token,
      deviceId: deviceId,
      isMaster: isMaster,  // ← NEW
      role: role,  // ← NEW
    };

    adminUser.set(user);
    sessionToken.set(token);
    isAdminLoggedIn.set(true);

    // Set RLS context
    await setRLSContext(data.id);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ... rest of existing code ...
```

---

## 🎨 File: src/components/admin/AdminUsersWindow.svelte (Update This)

Conditionally show/hide features based on user type:

```svelte
<script>
  import { adminUser } from '$lib/adminStore';
  import { isMasterAdmin, isAdmin } from '$lib/roleUtils';
  
  // Get permissions
  $: canCreateUsers = isMasterAdmin($adminUser);
  $: canDeleteUsers = isMasterAdmin($adminUser);
</script>

<div class="window">
  <!-- Only master admin can see create button -->
  {#if canCreateUsers}
    <button class="btn-primary" on:click={handleAddUser}>
      ➕ Add New Admin User
    </button>
  {/if}

  {#if canDeleteUsers}
    <button class="btn-danger" on:click={handleDeleteUser}>
      🗑️ Delete User
    </button>
  {/if}

  <!-- All admins can see these -->
  {#if isAdmin($adminUser)}
    <button class="btn-secondary" on:click={handleRefresh}>
      🔄 Refresh
    </button>
  {/if}
</div>

<style>
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

---

## 🔐 File: src/lib/permissions.ts (Create This)

Centralized permission checks:

```typescript
import { adminUser } from '$lib/adminStore';
import { isMasterAdmin, isAdmin, isEmployee, isCustomer } from '$lib/roleUtils';
import { get } from 'svelte/store';

/**
 * Check if current logged-in user can perform action
 */
export function canPerformAction(action: string): boolean {
  const user = get(adminUser);

  const permissions: Record<string, (user: any) => boolean> = {
    // User management
    'create_admin_user': (u) => isMasterAdmin(u),
    'delete_admin_user': (u) => isMasterAdmin(u),
    'edit_admin_user': (u) => isMasterAdmin(u),
    'view_admin_panel': (u) => isAdmin(u),

    // Employee management (future)
    'manage_employees': (u) => isMasterAdmin(u),
    'view_employee_portal': (u) => isEmployee(u),

    // Customer features (future)
    'browse_shop': (u) => isCustomer(u),
    'make_purchase': (u) => isCustomer(u),

    // Reports
    'view_analytics': (u) => isAdmin(u),
    'export_data': (u) => isMasterAdmin(u),
  };

  const permission = permissions[action];
  if (!permission) {
    console.warn(`Unknown permission: ${action}`);
    return false;
  }

  return permission(user);
}

/**
 * Throw error if user doesn't have permission
 */
export function requirePermission(action: string): void {
  if (!canPerformAction(action)) {
    throw new Error(`Permission denied: ${action}`);
  }
}

/**
 * Assert user is admin
 */
export function requireAdmin(): void {
  const user = get(adminUser);
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
}

/**
 * Assert user is master admin
 */
export function requireMasterAdmin(): void {
  const user = get(adminUser);
  if (!isMasterAdmin(user)) {
    throw new Error('Master admin access required');
  }
}
```

---

## 📋 Usage Examples in Components

### Example 1: Conditional Button
```svelte
<script>
  import { adminUser } from '$lib/adminStore';
  import { isMasterAdmin } from '$lib/roleUtils';
</script>

<!-- Only show delete button for master admin -->
{#if isMasterAdmin($adminUser)}
  <button on:click={deleteUser}>Delete User</button>
{/if}
```

### Example 2: Conditional Panel
```svelte
<script>
  import { adminUser } from '$lib/adminStore';
  import { isAdmin, getUserType } from '$lib/roleUtils';
</script>

<!-- Show different panels based on user type -->
{#if isAdmin($adminUser)}
  <AdminDashboard />
  <AdminUsers />
  {#if isMasterAdmin($adminUser)}
    <AdminSettings />
  {/if}
{:else}
  <EmployeePortal />
{/if}
```

### Example 3: API Call with Permission Check
```svelte
<script>
  import { requireMasterAdmin } from '$lib/permissions';

  async function deleteUser(userId) {
    try {
      // This will throw error if not master admin
      requireMasterAdmin();

      // API call
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      // ... handle response
    } catch (error) {
      console.error('Action denied:', error.message);
    }
  }
</script>

<button on:click={() => deleteUser(id)}>
  Delete
</button>
```

### Example 4: Complex Permission Check
```svelte
<script>
  import { canPerformAction } from '$lib/permissions';

  $: canManageUsers = canPerformAction('create_admin_user');
  $: canViewAnalytics = canPerformAction('view_analytics');
  $: canExport = canPerformAction('export_data');
</script>

<nav>
  {#if canManageUsers}
    <a href="/admin/users">Manage Users</a>
  {/if}
  {#if canViewAnalytics}
    <a href="/admin/analytics">Analytics</a>
  {/if}
  {#if canExport}
    <a href="/admin/export">Export Data</a>
  {/if}
</nav>
```

---

## 🗄️ Database Query Examples

### Check if User is Admin (SQL)
```sql
-- Get user role
SELECT username, is_active 
FROM admin_users 
WHERE username = 'madmin';

-- Result: master_admin if username is 'madmin'
```

### Check All Admin Users (SQL)
```sql
SELECT username, is_active, created_at
FROM admin_users
ORDER BY created_at DESC;
```

### Future: Get User Role (SQL)
```sql
-- After implementing unified system
SELECT role FROM users WHERE id = $1;
-- Result: 'master_admin' | 'admin' | 'employee' | 'customer'
```

---

## 🧪 Testing User Types

### Test Master Admin
```javascript
// Console test
import { isMasterAdmin } from '$lib/roleUtils';

const masterAdmin = {
  id: '123',
  username: 'madmin',
  role: 'master_admin'
};

console.log(isMasterAdmin(masterAdmin)); // true
```

### Test Regular Admin
```javascript
const regularAdmin = {
  id: '456',
  username: 'aisha',
  role: 'admin'
};

console.log(isMasterAdmin(regularAdmin)); // false
console.log(isAdmin(regularAdmin)); // true
```

### Test Permission
```javascript
import { canPerformAction } from '$lib/permissions';

// Only master admin can do this
console.log(canPerformAction('create_admin_user')); // true/false based on logged-in user
```

---

## 📊 Checklist: Implementation Steps

- [ ] Create `src/lib/roleUtils.ts` with utility functions
- [ ] Create `src/lib/permissions.ts` with permission checks
- [ ] Update `src/lib/adminStore.ts` to track role and isMaster
- [ ] Update admin components to use `isMasterAdmin()` checks
- [ ] Add conditional buttons/panels based on user type
- [ ] Test with master admin (madmin)
- [ ] Test with regular admin user
- [ ] Add comments to explain role checks
- [ ] Document role-based features in README

---

## 📚 Files Created/Updated

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/roleUtils.ts` | CREATE | Utility functions for role checks |
| `src/lib/permissions.ts` | CREATE | Centralized permission logic |
| `src/lib/adminStore.ts` | UPDATE | Add role tracking |
| `src/components/admin/AdminUsersWindow.svelte` | UPDATE | Conditional features |

---

## 🎯 Quick Copy-Paste Code

### Add to existing store
```typescript
// In adminStore.ts
adminUser.set({
  id: data.id,
  username: data.username,
  isMaster: username === 'madmin',  // ← Add this
  role: username === 'madmin' ? 'master_admin' : 'admin',  // ← Add this
  // ... other fields
});
```

### Check in component
```svelte
<!-- In any Svelte component -->
<script>
  import { adminUser } from '$lib/adminStore';
  import { isMasterAdmin } from '$lib/roleUtils';
  
  $: isMaster = isMasterAdmin($adminUser);
</script>

{#if isMaster}
  Show master admin features
{/if}
```

### Check permissions
```typescript
import { requireMasterAdmin } from '$lib/permissions';

function deleteUser() {
  requireMasterAdmin();  // Throws error if not master
  // ... delete code
}
```

---

## ✅ Summary

You now have a complete system to:
1. ✅ Identify user types (master admin vs regular admin)
2. ✅ Check permissions in code
3. ✅ Show/hide features based on user type
4. ✅ Enforce role-based access

Ready to implement? Start with creating `roleUtils.ts` and `permissions.ts`! 🚀

