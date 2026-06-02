# 📚 User Types System - Complete Guide Index

## 🎯 Quick Answer

**How does the system know the user type?**

### Current (June 2026)
```
On Login:
  1. User enters credentials
  2. System queries admin_users table
  3. If found + password matches:
     - Check username
     - If 'madmin' → MASTER ADMIN 👑
     - Otherwise → REGULAR ADMIN 👤
```

### Identification Method
```javascript
// Master Admin
if (user.username === 'madmin') {
  // MASTER ADMIN - Can create/delete users
}

// Regular Admin
if (user.username && user.username !== 'madmin') {
  // REGULAR ADMIN - Limited permissions
}
```

---

## 📖 Three Comprehensive Guides Created

### 1. 📋 [USER_TYPES_AND_ROLES.md](USER_TYPES_AND_ROLES.md)
**For: Understanding the complete architecture**

Topics:
- ✅ Current user type structure (Master Admin vs Admin)
- ✅ Future user types (Employee, Customer)
- ✅ Database schema comparisons
- ✅ RLS policies for each user type
- ✅ Login flow by user type
- ✅ Frontend routing decisions
- ✅ Permission matrices

**Best for:** Understanding "WHY" this architecture exists

---

### 2. 🎯 [USER_TYPES_QUICK_REFERENCE.md](USER_TYPES_QUICK_REFERENCE.md)
**For: Quick lookup and visual understanding**

Topics:
- ✅ Visual decision trees
- ✅ Real-world examples (Madmin, Aisha, Ahmed, Fatima)
- ✅ Current vs Future comparison
- ✅ How identification changes
- ✅ Quick code snippets
- ✅ TL;DR summary

**Best for:** Quick visual reference and examples

---

### 3. 🔧 [IMPLEMENT_USER_TYPES.md](IMPLEMENT_USER_TYPES.md)
**For: Actually coding role checks in your app**

Topics:
- ✅ `roleUtils.ts` - Copy-paste utility functions
- ✅ How to update `adminStore.ts`
- ✅ Component examples
- ✅ Permission checking patterns
- ✅ Database queries
- ✅ Testing examples
- ✅ Implementation checklist

**Best for:** Actually writing code

---

## 🗂️ File Structure

```
d:\RAQVOI\
│
├── 📚 Documentation (User Types)
│   ├── USER_TYPES_AND_ROLES.md          ← Architecture & design
│   ├── USER_TYPES_QUICK_REFERENCE.md    ← Visual guide & examples
│   └── IMPLEMENT_USER_TYPES.md          ← Practical code guide
│
├── 📂 Existing Documentation
│   ├── MIGRATIONS_GUIDE.md
│   ├── MIGRATIONS_QUICK_START.md
│   ├── MIGRATION_SYSTEM_COMPLETE.md
│   └── RLS_AND_AUTH_SETUP.md
│
├── 🛠️ Tools
│   ├── migrate.mjs                  ← Interactive migration wizard
│   ├── apply_migration.mjs          ← Apply specific migration
│   ├── check_table.mjs              ← Inspect tables
│   ├── check_policies.mjs           ← View RLS policies
│   └── verify_rls.mjs               ← Verify RLS setup
│
├── 📁 Database
│   └── supabase/migrations/
│       └── admin_rls_setup.sql      ← Current RLS migration
│
└── 💻 Source Code
    └── src/
        ├── lib/
        │   ├── adminStore.ts        ← Current authentication
        │   ├── roleUtils.ts         ← To be created
        │   └── permissions.ts       ← To be created
        └── components/
            └── admin/
                └── AdminUsersWindow.svelte
```

---

## 🎓 Learning Path

### Level 1: Understanding (30 mins)
1. Read this file (overview)
2. Read [USER_TYPES_QUICK_REFERENCE.md](USER_TYPES_QUICK_REFERENCE.md) (visual guide)
3. You now understand how users are identified ✅

### Level 2: Architecture (1 hour)
1. Read [USER_TYPES_AND_ROLES.md](USER_TYPES_AND_ROLES.md) (full architecture)
2. Read [RLS_AND_AUTH_SETUP.md](RLS_AND_AUTH_SETUP.md) (how security works)
3. You understand design decisions ✅

### Level 3: Implementation (2 hours)
1. Read [IMPLEMENT_USER_TYPES.md](IMPLEMENT_USER_TYPES.md) (code guide)
2. Create `src/lib/roleUtils.ts` with utility functions
3. Create `src/lib/permissions.ts` with permission checks
4. Update `src/lib/adminStore.ts` to track roles
5. Update components to use role checks
6. Test with master admin and regular admin ✅

### Level 4: Extension (4+ hours)
1. Implement Employee table
2. Implement Customer table
3. Create `employees` and `customers` login endpoints
4. Create Employee portal
5. Create Customer shop
6. Update RLS policies for new roles
7. Test all user types ✅

---

## 💡 Key Concepts

### What is a User Type?
A **User Type** is a classification that determines what a user can do in the system.

**Examples:**
- Master Admin → Can manage everything
- Admin → Can manage limited things
- Employee → Can access employee portal
- Customer → Can shop

### How is it Identified?
The system checks WHERE the user is stored and WHAT their username/role is.

**Current Logic:**
```
Login Attempt
    ↓
Check admin_users table
    ├─ Found?
    │  ├─ YES → Is admin
    │  │   └─ Check username
    │  │       ├─ 'madmin'? → MASTER ADMIN
    │  │       └─ Other? → REGULAR ADMIN
    │  └─ NO → Login Failed ❌
```

### Why Does It Matter?
Different users need different capabilities:
- Master Admin needs to create/delete users
- Regular Admin needs to view data
- Employee needs to access portal
- Customer needs to shop

---

## 🔑 Current User Credentials

### Master Admin
- **Username:** `madmin`
- **Password:** `@#Imanihayath120`
- **Quick Access:** `369202`
- **Capabilities:** Full system access

### How to Identify Them
```javascript
if (user.username === 'madmin') {
  return 'MASTER_ADMIN';
}
```

---

## 🚀 Next Steps

### Immediate (Today)
- [ ] Read [USER_TYPES_QUICK_REFERENCE.md](USER_TYPES_QUICK_REFERENCE.md)
- [ ] Understand current system (Master vs Regular Admin)

### Short Term (This Week)
- [ ] Create `src/lib/roleUtils.ts`
- [ ] Create `src/lib/permissions.ts`
- [ ] Add role checks to components
- [ ] Test with both user types

### Medium Term (Next 2 Weeks)
- [ ] Plan Employee and Customer tables
- [ ] Create migrations
- [ ] Implement multi-role login
- [ ] Create Employee portal

### Long Term (Next Month)
- [ ] Implement Customer shop
- [ ] Add RBAC matrix
- [ ] Implement audit logging
- [ ] Full role-based system

---

## ❓ FAQ

### Q: How do I check if user is master admin in code?
A: Use the utility function:
```typescript
import { isMasterAdmin } from '$lib/roleUtils';
if (isMasterAdmin($adminUser)) { /* show feature */ }
```

### Q: Can I have multiple master admins?
A: Currently no (only 'madmin'). Future system can support multiple.

### Q: How do I prevent regular admins from deleting users?
A: Add permission check:
```typescript
const canDelete = isMasterAdmin($adminUser);
<button disabled={!canDelete}>Delete</button>
```

### Q: Where is user type stored in database?
A: Currently: Checked by table + username
Future: Will be in `users.role` column

### Q: How does the database enforce user types?
A: Via RLS (Row Level Security) policies that check if user is admin:
```sql
USING (current_setting('app.current_admin_id', true) != '')
```

### Q: Can one person be multiple user types?
A: Currently no. Future system could support multiple roles per user.

---

## 📊 Current vs Future Comparison

### NOW (June 2026)
| Feature | Status |
|---------|--------|
| Admin Users | ✅ Implemented |
| Master Admin Detection | ✅ By username |
| Regular Admins | ✅ Implemented |
| Employee Users | ❌ Not Implemented |
| Customer Users | ❌ Not Implemented |
| Role Column | ❌ Not Implemented |
| RBAC System | ❌ Partial |

### FUTURE (Roadmap)
| Feature | Status |
|---------|--------|
| Unified Users Table | 📋 Planned |
| Role Column | 📋 Planned |
| Master Admin Detection | 📋 By role |
| 4 User Types | 📋 Planned |
| Full RBAC | 📋 Planned |
| Permission Matrix | 📋 Planned |
| Audit Logging | 📋 Planned |

---

## 🎯 Quick Command Reference

### Check if someone is master admin
```bash
# Check database
node check_table.mjs admin_users

# Look for username 'madmin'
```

### See all admins
```bash
node check_table.mjs admin_users
# Shows all admin users with their usernames
```

### Verify RLS is enforcing access
```bash
node verify_rls.mjs
# Shows RLS is enabled and policies are active
```

---

## 📝 Summary: The Simple Answer

**How does the system know user types?**

```
MASTER ADMIN: username === 'madmin'
REGULAR ADMIN: In admin_users table + not master admin
EMPLOYEE: In employees table (future)
CUSTOMER: In customers table (future)
```

**How it identifies them on login:**
1. Try admin_users table → Found? Check username → master or regular admin
2. Try employees table → Found? → Employee
3. Try customers table → Found? → Customer
4. Not found anywhere? → Invalid

**How it restricts access:**
- RLS policies check if user has valid session context
- Different roles can access different tables
- Master admin has most permissions
- Others have limited permissions

---

## 🔗 Related Documentation

| Topic | File |
|-------|------|
| Complete Architecture | [USER_TYPES_AND_ROLES.md](USER_TYPES_AND_ROLES.md) |
| Quick Reference | [USER_TYPES_QUICK_REFERENCE.md](USER_TYPES_QUICK_REFERENCE.md) |
| Implementation Guide | [IMPLEMENT_USER_TYPES.md](IMPLEMENT_USER_TYPES.md) |
| Authentication System | [RLS_AND_AUTH_SETUP.md](RLS_AND_AUTH_SETUP.md) |
| Database Migrations | [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) |

---

## ✅ Takeaways

1. ✅ System currently has **2 user types:** Master Admin and Regular Admin
2. ✅ They're identified by **checking username** in admin_users table
3. ✅ Future system will support **4 user types** with a role column
4. ✅ You can check user type with **utility functions** (`isMasterAdmin()`, `isAdmin()`, etc.)
5. ✅ RLS policies **enforce access** based on user type
6. ✅ Frontend can conditionally **show/hide features** based on user type

---

**Ready to implement? Start with [IMPLEMENT_USER_TYPES.md](IMPLEMENT_USER_TYPES.md)! 🚀**

