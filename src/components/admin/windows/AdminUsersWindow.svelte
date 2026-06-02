<script lang="ts">
  import { onMount } from 'svelte';
  import { adminUser } from '../../../lib/adminStore';
  import { supabase } from '../../../lib/supabaseClient';
  import { isMasterAdmin, isAdmin, canEditUser, canDeleteUser, getRoleBadge, getCreatableRoles } from '../../../lib/roleUtils';
  import AdminUserForm from '../popups/AdminUserForm.svelte';

  interface User {
    id: string;
    username: string;
    whatsapp: string;
    role: 'master_admin' | 'admin' | 'employee' | 'customer';
    is_active: boolean;
    created_at: string;
  }

  let users: User[] = [];
  let loading = true;
  let showForm = false;
  let activeTab: 'admin' | 'employee' | 'customer' = 'admin';
  let editingUser: User | null = null;
  let creatableRoles: ('master_admin' | 'admin' | 'employee' | 'customer')[] = [];

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, whatsapp, role, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      users = data || [];
    } catch (err) {
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }

  function handleUserAdded() {
    showForm = false;
    editingUser = null;
    loadUsers();
  }

  function handleEditUser(user: User) {
    // Check permissions
    if (!canEditUser($adminUser, user.id)) {
      alert('You can only edit your own record');
      return;
    }
    editingUser = user;
    showForm = true;
  }

  async function handleDeleteUser(user: User) {
    // Check permissions
    if (!canDeleteUser($adminUser, user.id)) {
      alert('You do not have permission to delete users');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
        return;
      }

      loadUsers();
    } catch (err) {
      console.error('Error:', err);
      alert('Error deleting user');
    }
  }

  function handleCreateRole(role: 'master_admin' | 'admin' | 'employee' | 'customer') {
    editingUser = null;
    // Pass the role as context to the form somehow
    showForm = true;
  }

  // Update creatable roles when adminUser changes
  $: {
    creatableRoles = getCreatableRoles($adminUser);
  }

  onMount(() => {
    loadUsers();
  });
</script>

<div class="users-window">
  <div class="tabs">
    <button 
      class="tab {activeTab === 'admin' ? 'active' : ''}"
      on:click={() => activeTab = 'admin'}
    >
      Admin
    </button>
    <button 
      class="tab {activeTab === 'employee' ? 'active' : ''}"
      on:click={() => activeTab = 'employee'}
    >
      Employee
    </button>
    <button 
      class="tab {activeTab === 'customer' ? 'active' : ''}"
      on:click={() => activeTab = 'customer'}
    >
      Customer
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'admin'}
      <div class="admin-tab">
        <div class="header">
          <h3>Admin Users</h3>
          <div class="buttons-group">
            <!-- Master Admin button - only for master admins -->
            {#if isMasterAdmin($adminUser)}
              <button class="btn-role btn-master-admin" on:click={() => handleCreateRole('master_admin')}>
                👑 Master Admin
              </button>
            {/if}
            
            <!-- Admin button - only for master admins -->
            {#if isMasterAdmin($adminUser)}
              <button class="btn-role btn-admin" on:click={() => handleCreateRole('admin')}>
                👤 Admin
              </button>
            {/if}
          </div>
        </div>

        {#if loading}
          <div class="loading">Loading users...</div>
        {:else}
          <div class="table-wrapper">
            <table class="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users.filter(u => u.role === 'master_admin' || u.role === 'admin') as user (user.id)}
                <tr>
                  <td class="username">
                    {user.username}
                    {#if user.username === 'madmin'}
                      <span class="badge-master">Master</span>
                    {/if}
                  </td>
                  <td class="role">{getRoleBadge(user.role)}</td>
                  <td class="whatsapp">{user.whatsapp || '—'}</td>
                  <td class="status">
                    <span class="badge {user.is_active ? 'active' : 'inactive'}">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="created">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td class="actions">
                    {#if canEditUser($adminUser, user.id)}
                      <button class="btn-edit" on:click={() => handleEditUser(user)}>Edit</button>
                    {/if}
                    {#if canDeleteUser($adminUser, user.id)}
                      <button class="btn-delete" on:click={() => handleDeleteUser(user)}>Delete</button>
                    {/if}
                    {#if !canEditUser($adminUser, user.id) && !canDeleteUser($adminUser, user.id)}
                      <span class="no-permission">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
            </table>
          </div>
        {/if}

        {#if showForm}
          <AdminUserForm 
            editingUser={editingUser}
            on:close={() => {
              showForm = false;
              editingUser = null;
            }} 
            on:success={handleUserAdded} 
          />
        {/if}
      </div>
    {:else if activeTab === 'employee'}
      <div class="employee-tab">
        <div class="header">
          <h3>Employees</h3>
          {#if isAdmin($adminUser)}
            <button class="btn-role btn-employee" on:click={() => handleCreateRole('employee')}>
              💼 Create Employee
            </button>
          {/if}
        </div>
        <div class="content-placeholder">
          <p>Employee management coming soon...</p>
        </div>
      </div>
    {:else if activeTab === 'customer'}
      <div class="customer-tab">
        <div class="header">
          <h3>Customers</h3>
          {#if isAdmin($adminUser)}
            <button class="btn-role btn-customer" on:click={() => handleCreateRole('customer')}>
              🛍️ Create Customer
            </button>
          {/if}
        </div>
        <div class="content-placeholder">
          <p>Customer management coming soon...</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .users-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    background: var(--white);
  }

  .tabs {
    display: flex;
    gap: 0;
    padding: 0;
    background: #f9f9f9;
    border-bottom: 1px solid #eee;
  }

  .tab {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tab:hover {
    color: var(--primary-black);
    background: rgba(212, 175, 55, 0.05);
  }

  .tab.active {
    color: var(--primary-gold);
    border-bottom-color: var(--primary-gold);
    background: rgba(212, 175, 55, 0.02);
  }

  .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .admin-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
  }

  .employee-tab,
  .customer-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .content-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 16px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
    background: #f9f9f9;
    flex-shrink: 0;
    gap: 12px;
  }

  .header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-black);
    flex-shrink: 0;
  }

  .buttons-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn-role {
    padding: 10px 16px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    white-space: nowrap;
  }

  .btn-master-admin {
    background: rgba(212, 175, 55, 0.15);
    color: var(--primary-black);
  }

  .btn-master-admin:hover {
    background: rgba(212, 175, 55, 0.25);
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }

  .btn-admin {
    background: rgba(212, 175, 55, 0.12);
    color: var(--primary-black);
  }

  .btn-admin:hover {
    background: rgba(212, 175, 55, 0.22);
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }

  .btn-employee {
    background: rgba(100, 150, 200, 0.12);
    color: var(--primary-black);
    border-color: rgba(100, 150, 200, 0.3);
  }

  .btn-employee:hover {
    background: rgba(100, 150, 200, 0.22);
    border-color: rgba(100, 150, 200, 0.5);
    transform: translateY(-2px);
  }

  .btn-customer {
    background: rgba(100, 200, 150, 0.12);
    color: var(--primary-black);
    border-color: rgba(100, 200, 150, 0.3);
  }

  .btn-customer:hover {
    background: rgba(100, 200, 150, 0.22);
    border-color: rgba(100, 200, 150, 0.5);
    transform: translateY(-2px);
  }

  .loading,
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }

  .empty button {
    margin-top: 16px;
    padding: 10px 20px;
    background: rgba(212, 175, 55, 0.15);
    color: var(--primary-black);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .empty button:hover {
    background: rgba(212, 175, 55, 0.25);
    border-color: rgba(212, 175, 55, 0.5);
  }

  .btn-primary {
    margin-top: 16px;
    padding: 10px 20px;
    background: rgba(212, 175, 55, 0.15);
    color: var(--primary-black);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .btn-primary:hover {
    background: rgba(212, 175, 55, 0.25);
    border-color: rgba(212, 175, 55, 0.5);
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    flex: 1;
    overflow: auto;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
    flex: 1;
    overflow: auto;
  }

  .table-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    width: 100%;
    min-height: 0;
  }

  .admin-table thead,
  .users-table thead {
    background: #f5f5f5;
    border-bottom: 2px solid var(--primary-gold);
    position: sticky;
    top: 0;
  }

  .admin-table th,
  .users-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-black);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid #ddd;
    border-bottom: 2px solid var(--primary-gold);
  }

  .admin-table th:last-child,
  .users-table th:last-child {
    border-right: none;
  }

  .admin-table td,
  .users-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
    border-right: 1px solid #eee;
    font-size: 14px;
    color: #333;
  }

  .admin-table td:last-child,
  .users-table td:last-child {
    border-right: none;
  }

  .admin-table tbody tr:hover,
  .users-table tbody tr:hover {
    background: #f9f9f9;
  }

  .username {
    font-weight: 600;
    color: var(--primary-black);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge-master {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(212, 175, 55, 0.3);
    color: var(--primary-black);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  .role {
    font-weight: 500;
    color: var(--primary-black);
  }

  .whatsapp {
    color: #666;
  }

  .status {
    text-align: center;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge.active {
    background: #d4f0d4;
    color: #2d6a2d;
  }

  .badge.inactive {
    background: #f0d4d4;
    color: #6a2d2d;
  }

  .created {
    color: #999;
    font-size: 13px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .no-permission {
    color: #ccc;
    font-size: 12px;
  }

  .btn-edit,
  .btn-delete {
    padding: 6px 12px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary-black);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .btn-edit:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: rgba(212, 175, 55, 0.5);
    color: var(--primary-black);
  }

  .btn-delete:hover {
    background: rgba(192, 51, 51, 0.2);
    border-color: rgba(192, 51, 51, 0.5);
    color: #c33;
  }
</style>
