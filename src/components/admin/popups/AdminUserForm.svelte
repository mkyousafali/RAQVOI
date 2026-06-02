<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { adminUser } from '../../../lib/adminStore';
  import { supabase } from '../../../lib/supabaseClient';
  import { hashPassword, hashQuickAccessCode } from '../../../lib/passwordUtils';
  import { isMasterAdmin, isAdmin, getCreatableRoles } from '../../../lib/roleUtils';

  const dispatch = createEventDispatcher();

  export let editingUser: any = null;

  type UserRole = 'master_admin' | 'admin' | 'employee' | 'customer';

  let username = '';
  let password = '';
  let whatsapp = '';
  let quickAccessCode = '';
  let role: UserRole = 'admin';
  let error = '';
  let loading = false;
  let isEditing = false;
  let availableRoles: UserRole[] = [];

  onMount(() => {
    // Update available roles based on current user
    availableRoles = getCreatableRoles($adminUser);

    if (editingUser) {
      isEditing = true;
      username = editingUser.username;
      whatsapp = editingUser.whatsapp || '';
      role = editingUser.role || 'admin';
      // Don't pre-populate password for editing
    } else {
      // Set default role to first available
      role = availableRoles[0] || 'admin';
    }
  });

  async function handleSubmit() {
    error = '';

    // Validate username
    if (!username.trim()) {
      error = 'Username is required';
      return;
    }

    // Validate password on create
    if (!isEditing && !password.trim()) {
      error = 'Password is required';
      return;
    }

    // Validate password length
    if (password && password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    // Validate role permission
    if (!isEditing && !availableRoles.includes(role)) {
      error = `You do not have permission to create ${role} users`;
      return;
    }

    loading = true;

    try {
      if (isEditing) {
        // Update existing user
        console.log('📝 Updating user:', editingUser.username);
        
        const updatePayload: any = {
          username,
          whatsapp: whatsapp || null,
        };

        // Only update password if a new one is provided
        if (password) {
          console.log('🔐 Hashing new password...');
          const hashedPassword = await hashPassword(password);
          updatePayload.password = hashedPassword;
          console.log('✅ Password hashed');
        }

        // Only update quick access code if provided
        if (quickAccessCode) {
          console.log('🔐 Hashing new quick access code...');
          const hashedCode = await hashQuickAccessCode(quickAccessCode);
          updatePayload.quick_access_code = hashedCode;
          console.log('✅ Quick access code hashed');
        }

        // Regular admins can only update themselves
        // Master admins can update anyone
        if (!isMasterAdmin($adminUser) && editingUser.id !== $adminUser?.id) {
          error = 'You can only edit your own record';
          loading = false;
          return;
        }

        console.log('📤 Sending update to database:', { id: editingUser.id, fields: Object.keys(updatePayload) });
        const { error: updateError, data: updateResult } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', editingUser.id)
          .select();

        if (updateError) {
          console.error('❌ Update failed:', updateError);
          error = `Update failed: ${updateError.message}`;
          loading = false;
          return;
        }

        console.log('✅ User updated successfully:', updateResult);
      } else {
        // Create new user
        console.log('👤 Creating new user with role:', role);
        
        const hashedPassword = await hashPassword(password);
        const hashedCode = quickAccessCode ? await hashQuickAccessCode(quickAccessCode) : null;

        console.log('📤 Sending new user to database');
        const { error: insertError, data: insertResult } = await supabase.from('users').insert([
          {
            username,
            password: hashedPassword,
            whatsapp: whatsapp || null,
            quick_access_code: hashedCode,
            role: role,  // NEW: Include role
            is_active: true,
          },
        ]).select();

        if (insertError) {
          console.error('❌ Insert failed:', insertError);
          if (insertError.message.includes('duplicate key')) {
            error = 'Username already exists';
          } else {
            error = insertError.message;
          }
          loading = false;
          return;
        }
        
        console.log('✅ User created successfully:', insertResult);
      }

      // Success
      console.log('✅ Operation completed successfully');
      dispatch('success');
    } catch (err) {
      console.error('❌ Error during operation:', err);
      error = err instanceof Error ? err.message : 'Error processing user';
    } finally {
      loading = false;
    }
  }
</script>

<div class="modal-overlay" on:click={() => dispatch('close')}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
      <button class="btn-close" on:click={() => dispatch('close')}>✕</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      {#if !isEditing}
        <div class="form-group">
          <label for="role">User Role *</label>
          <select
            id="role"
            bind:value={role}
            disabled={loading || availableRoles.length === 0}
          >
            <option value="">-- Select Role --</option>
            {#each availableRoles as r}
              <option value={r}>
                {r === 'master_admin' ? '👑 Master Admin' : r === 'admin' ? '👤 Admin' : r === 'employee' ? '💼 Employee' : '🛍️ Customer'}
              </option>
            {/each}
          </select>
          {#if availableRoles.length === 0}
            <div class="info-message">You do not have permission to create users</div>
          {/if}
        </div>
      {/if}

      <div class="form-group">
        <label for="username">Username *</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          placeholder="Enter username"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">Password {isEditing ? '(leave blank to keep current)' : '*'}</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password (min 6 chars)'}
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="whatsapp">WhatsApp</label>
        <input
          id="whatsapp"
          type="text"
          bind:value={whatsapp}
          placeholder="e.g., +966501234567"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="quickaccess">Quick Access Code (6 digits)</label>
        <input
          id="quickaccess"
          type="text"
          bind:value={quickAccessCode}
          placeholder="e.g., 123456"
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-actions">
        <button type="button" class="btn-cancel" on:click={() => dispatch('close')} disabled={loading}>
          Cancel
        </button>
        <button type="submit" class="btn-submit" disabled={loading || (availableRoles.length === 0 && !isEditing)}>
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .modal {
    background: var(--white);
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    font-family: var(--sans);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-black);
  }

  .btn-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 24px;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .btn-close:hover {
    color: var(--primary-black);
  }

  form {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary-black);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
    background: var(--white);
    cursor: pointer;
  }

  select:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  select:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .info-message {
    padding: 8px 12px;
    background: #ffe;
    border-left: 3px solid #fc0;
    color: #880;
    border-radius: 3px;
    font-size: 12px;
    margin-top: 8px;
  }

  .error-message {
    padding: 12px;
    background: #fee;
    border-left: 4px solid #c33;
    color: #c33;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .btn-cancel,
  .btn-submit {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-cancel {
    background: var(--white);
    color: var(--primary-black);
  }

  .btn-cancel:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #999;
  }

  .btn-submit {
    background: var(--primary-gold);
    color: var(--primary-black);
    border-color: var(--primary-gold);
  }

  .btn-submit:hover:not(:disabled) {
    background: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
