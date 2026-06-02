/**
 * Role and Permission Utilities
 * Use these functions to check user types and permissions throughout the app
 */

import type { AdminUser } from './adminStore';

export type UserRole = 'master_admin' | 'admin' | 'employee' | 'customer';

/**
 * Check if user is a master admin (can do everything)
 */
export function isMasterAdmin(user: AdminUser | null): boolean {
  return user?.role === 'master_admin';
}

/**
 * Check if user is any kind of admin (master or regular)
 */
export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'master_admin';
}

/**
 * Check if user is an employee
 */
export function isEmployee(user: AdminUser | null): boolean {
  return user?.role === 'employee';
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: AdminUser | null): boolean {
  return user?.role === 'customer';
}

/**
 * Get user type as readable string
 */
export function getUserType(user: AdminUser | null): string {
  if (!user) return 'GUEST';
  if (user.role === 'master_admin') return 'MASTER_ADMIN';
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'employee') return 'EMPLOYEE';
  if (user.role === 'customer') return 'CUSTOMER';
  return 'UNKNOWN';
}

/**
 * Get user display name with role badge
 */
export function getUserDisplayName(user: AdminUser | null): string {
  if (!user) return 'Guest';
  return user.username || 'Unknown';
}

/**
 * Get role badge with emoji and label
 */
export function getRoleBadge(role: UserRole | undefined): string {
  const badges: Record<UserRole, string> = {
    'master_admin': '👑 Master Admin',
    'admin': '👤 Admin',
    'employee': '💼 Employee',
    'customer': '🛍️ Customer',
  };
  return badges[role || 'admin'] || 'Unknown';
}

/**
 * Get available roles that a user can create
 */
export function getCreatableRoles(user: AdminUser | null): UserRole[] {
  if (isMasterAdmin(user)) {
    // Master admins can create all role types
    return ['master_admin', 'admin', 'employee', 'customer'];
  } else if (isAdmin(user)) {
    // Regular admins can create employees and customers
    return ['employee', 'customer'];
  }
  // Employees and customers cannot create users
  return [];
}

/**
 * Check if user can create a specific role
 */
export function canCreateRole(user: AdminUser | null, role: UserRole): boolean {
  const creatableRoles = getCreatableRoles(user);
  return creatableRoles.includes(role);
}

/**
 * Check if user can edit/delete another user
 */
export function canEditUser(currentUser: AdminUser | null, targetUserId: string): boolean {
  if (!currentUser) return false;
  
  // Master admins can edit anyone
  if (isMasterAdmin(currentUser)) return true;
  
  // Regular admins can only edit themselves
  if (isAdmin(currentUser)) {
    return currentUser.id === targetUserId;
  }
  
  // Others cannot edit users
  return false;
}

/**
 * Check if user can delete another user
 */
export function canDeleteUser(currentUser: AdminUser | null, targetUserId: string): boolean {
  if (!currentUser) return false;
  
  // Only master admins can delete users
  if (isMasterAdmin(currentUser)) return true;
  
  return false;
}

/**
 * Get permissions summary for a user
 */
export function getPermissions(user: AdminUser | null) {
  return {
    canCreateMasterAdmin: isMasterAdmin(user),
    canCreateAdmin: isMasterAdmin(user),
    canCreateEmployee: isAdmin(user),
    canCreateCustomer: isAdmin(user),
    canEditOthers: isMasterAdmin(user),
    canDeleteUsers: isMasterAdmin(user),
    canViewAllUsers: isAdmin(user),
    canEditSelf: !!user,
  };
}
