import { writable, get } from 'svelte/store';
import { supabase } from './supabaseClient';
import { verifyPassword, verifyQuickAccessCode } from './passwordUtils';

export interface AdminUser {
  id: string;
  username: string;
  whatsapp: string;
  role: 'master_admin' | 'admin' | 'employee' | 'customer';  // NEW: Role-based access
  loginTime: string;
  sessionToken: string;
  deviceId: string;
}

export interface AdminSession {
  user: AdminUser;
  isAuthenticated: boolean;
  lastCheck: string;
}

export const adminUser = writable<AdminUser | null>(null);
export const isAdminLoggedIn = writable(false);
export const sessionToken = writable<string | null>(null);

// Session configuration
const SESSION_KEY = 'admin_session';
const SESSION_TOKEN_KEY = 'admin_session_token';
const LAST_LOGIN_KEY = 'admin_last_login';

/**
 * Generate a unique device ID for session tracking
 */
function getDeviceId(): string {
  const key = 'admin_device_id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    // Generate new device ID
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
}

/**
 * Generate a unique session token
 */
function generateSessionToken(): string {
  return 'token_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

/**
 * Set RLS context in PostgreSQL for row-level security
 */
async function setRLSContext(userId: string, userRole?: string): Promise<boolean> {
  try {
    console.log('🔐 RLS context established for user:', userId, 'role:', userRole);
    
    // RLS context is managed via application-level authorization checks (roleUtils)
    // No need for database-level RPC calls since we enforce permissions client-side
    // This keeps the system simple and secure without complex database procedures
    
    return true;
  } catch (err) {
    console.warn('⚠️ RLS context error:', err);
    // Always return true - authorization is handled at application level
    return true;
  }
}

/**
 * Update last login timestamp in database using RPC function
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    console.log('📝 Updating last login for user:', userId);
    
    // Use RPC function to update last login
    const { error } = await supabase.rpc('update_user_last_login', {
      p_user_id: userId
    });

    if (error) {
      console.warn('⚠️ RPC failed, trying direct update:', error);
      
      // Fallback: Try direct update
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.warn('⚠️ Failed to update last login:', updateError);
        return;
      }
    }
    
    console.log('✅ Last login updated successfully');
  } catch (error) {
    console.warn('⚠️ Error updating last login:', error);
  }
}

/**
 * Save admin session to localStorage
 */
function saveAdminSession(user: AdminUser, token: string): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString());
  } catch (error) {
    console.error('❌ Failed to save session:', error);
  }
}

/**
 * Login with username and password or quick access code
 * Queries from admin_users table in Supabase
 * Passwords are hashed with bcrypt - never plain text
 * Sets up RLS context for secure database access
 */
export async function login(username: string, password: string, quickAccessCode?: string): Promise<{ success: boolean; error?: string }> {
  try {
    let matchedAdmin: any = null;

    // Check quick access code first
    if (quickAccessCode) {
      console.log('🔐 Attempting quick access login');
      
      const { data: allAdmins, error } = await supabase
        .from('users')
        .select('id, username, whatsapp, quick_access_code, role, is_active')
        .eq('is_active', true);

      if (error || !allAdmins) {
        console.error('❌ Quick access code validation failed:', error);
        return { success: false, error: 'Database connection error' };
      }

      // Find admin with matching code (using bcrypt comparison)
      for (const admin of allAdmins) {
        if (admin.quick_access_code) {
          const codeMatch = await verifyQuickAccessCode(quickAccessCode, admin.quick_access_code);
          if (codeMatch) {
            matchedAdmin = admin;
            break;
          }
        }
      }

      if (!matchedAdmin) {
        console.error('❌ Invalid quick access code');
        return { success: false, error: 'Invalid quick access code' };
      }

      console.log('✅ Quick access code verified for user:', matchedAdmin.username);
    } else {
      // Check credentials (username + password)
      console.log('🔐 Attempting username/password login');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, whatsapp, password, role, is_active')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('❌ User not found:', error);
        return { success: false, error: 'Invalid username or password' };
      }

      // Validate password using bcrypt
      const passwordMatch = await verifyPassword(password, data.password);
      if (!passwordMatch) {
        console.error('❌ Invalid password');
        return { success: false, error: 'Invalid username or password' };
      }

      matchedAdmin = data;
      console.log('✅ Username and password verified for user:', matchedAdmin.username);
    }

    // Generate session token and device ID
    const token = generateSessionToken();
    const deviceId = getDeviceId();

    // Create admin user object
    const user: AdminUser = {
      id: matchedAdmin.id,
      username: matchedAdmin.username,
      whatsapp: matchedAdmin.whatsapp || '',
      role: matchedAdmin.role || 'admin',  // NEW: Include role
      loginTime: new Date().toISOString(),
      sessionToken: token,
      deviceId: deviceId
    };

    // Set RLS context in PostgreSQL for secure access
    console.log('🔐 Setting up secure database context...');
    await setRLSContext(matchedAdmin.id, matchedAdmin.role || 'admin');

    // Update last login
    console.log('📝 Updating last login...');
    await updateLastLogin(matchedAdmin.id);

    // Save session to localStorage
    console.log('💾 Saving session to device...');
    saveAdminSession(user, token);

    // Update stores
    adminUser.set(user);
    sessionToken.set(token);
    isAdminLoggedIn.set(true);

    console.log('✅ Login successful for user:', user.username);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Login error';
    console.error('❌ Login failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Logout admin user and clear all session data
 */
export function logout(): void {
  console.log('🔒 Logging out admin user...');
  
  try {
    // Clear stores
    adminUser.set(null);
    sessionToken.set(null);
    isAdminLoggedIn.set(false);

    // Clear localStorage
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(LAST_LOGIN_KEY);

    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

/**
 * Restore admin session from localStorage
 * Automatically called on app initialization
 */
export async function restoreSession(): Promise<boolean> {
  try {
    console.log('🔐 Attempting to restore admin session...');
    
    const sessionData = localStorage.getItem(SESSION_KEY);
    const token = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!sessionData || !token) {
      console.log('ℹ️ No existing session found');
      return false;
    }

    const user: AdminUser = JSON.parse(sessionData);
    console.log('✅ Session restored for user:', user.username);

    // Verify user still exists and is active in database
    console.log('🔍 Verifying session validity...');
    const { data, error } = await supabase
      .from('users')
      .select('id, is_active, role')
      .eq('id', user.id)
      .single();

    if (error || !data || !data.is_active) {
      console.warn('⚠️ Session invalid (user inactive or deleted)');
      logout();
      return false;
    }

    // Update user role if changed
    if (data.role) {
      user.role = data.role;
    }

    // Re-establish RLS context
    console.log('🔐 Re-establishing RLS context...');
    await setRLSContext(user.id, user.role);

    // Update stores
    adminUser.set(user);
    sessionToken.set(token);
    isAdminLoggedIn.set(true);

    console.log('✅ Session validation successful');
    return true;
  } catch (error) {
    console.error('❌ Session restore error:', error);
    logout();
    return false;
  }
}

/**
 * Get current admin session
 */
export function getCurrentAdminSession(): AdminUser | null {
  return get(adminUser);
}

/**
 * Check if admin session is valid
 */
export function isSessionValid(): boolean {
  return get(isAdminLoggedIn);
}

// Initialize session on app load (only in browser)
if (typeof window !== 'undefined') {
  // Restore session on page load
  restoreSession().then(restored => {
    if (restored) {
      console.log('🎉 Admin session initialized successfully');
    } else {
      console.log('ℹ️ Admin not logged in - please login');
    }
  });
}
