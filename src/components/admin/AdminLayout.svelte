<script lang="ts">
  import { logout, adminUser } from '../../lib/adminStore';
  import { windows, openWindow } from '../../lib/windowStore';
  import { onMount } from 'svelte';
  import Window from './Window.svelte';
  import Taskbar from './Taskbar.svelte';

  let sidebarOpen = true;

  onMount(() => {
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) {
        sidebarOpen = false;
      } else {
        sidebarOpen = true;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function openAdminUsersWindow() {
    openWindow('admin-users', 'Users', 'admin-users');
  }

  function openDashboardWindow() {
    openWindow('dashboard', 'Dashboard', 'dashboard');
  }

  function openProductManagerWindow() {
    openWindow('product-manager', 'Product Manager', 'product-manager');
  }
</script>

<div class="admin-container">
  <!-- Sidebar -->
  <aside class="sidebar {sidebarOpen ? 'open' : 'closed'}">
    <div class="sidebar-header">
      <div class="logo-container">
        <img src="/static/logo.png.png" alt="RAQVOI Logo" class="logo" />
      </div>
      <button class="close-btn" on:click={toggleSidebar}>
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
        </svg>
      </button>
    </div>

    <div class="sidebar-divider"></div>

    <nav class="sidebar-nav">
      <button
        class="nav-item"
        on:click={openDashboardWindow}
        title="Dashboard"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
        <span>Dashboard</span>
      </button>
      
      <button
        class="nav-item"
        on:click={openAdminUsersWindow}
        title="Users"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <span>Users</span>
      </button>

      <button
        class="nav-item"
        on:click={openProductManagerWindow}
        title="Products"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-0.16.28-0.25.61-0.25 0.96 0 1.1.9 2 2 2h12v-2H7.42c-0.14 0-0.25-0.11-0.25-0.25l0.03-0.12 0.9-1.63h7.45c0.75 0 1.41-0.41 1.75-1.03l3.58-6.49c0.08-0.14 0.12-0.31 0.12-0.48 0-0.55-0.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
        </svg>
        <span>Products</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <p class="user-name">{$adminUser?.username}</p>
        <p class="user-role">Admin</p>
      </div>
      <button class="logout-btn" on:click={handleLogout} title="Logout">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
          />
        </svg>
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">

    <!-- Page Content -->
    <div class="content">
      {#if $windows.length === 0}
        <div class="empty-state">
          <div class="empty-logo">
            <img src="/static/logo.png.png" alt="RAQVOI" />
          </div>
          <h2>Welcome to RAQVOI Admin</h2>
          <p>Select an option from the sidebar to get started</p>
        </div>
      {/if}
    </div>

    <!-- Windows Container -->
    <div class="windows-container">
      {#each $windows as window (window.id)}
        <Window windowData={window} />
      {/each}
    </div>

    <!-- Taskbar -->
    <Taskbar />
  </main>
</div>

<style>
  .admin-container {
    display: flex;
    height: 100vh;
    background-color: #ffffff;
    font-family: var(--sans);
  }

  /* Sidebar */
  .sidebar {
    width: 150px;
    background-color: var(--primary-black);
    color: var(--white);
    padding: 24px 0 50px 0;
    overflow-y: auto;
    transition: transform 0.3s ease, width 0.3s ease;
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  .sidebar.closed {
    transform: translateX(-100%);
  }

  .sidebar-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px 8px;
    margin-bottom: 2px;
    position: relative;
  }

  .logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: transparent;
    border: 2px solid var(--primary-gold);
    border-radius: 6px;
    box-shadow: 
      0 4px 8px rgba(212, 175, 55, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    margin-bottom: 2px;
  }

  .logo {
    width: 90px;
    height: auto;
    object-fit: contain;
  }

  .sidebar-divider {
    height: 2px;
    background: linear-gradient(
      to right,
      transparent,
      var(--primary-gold) 20%,
      var(--primary-gold) 80%,
      transparent
    );
    margin: 8px 12px;
    box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
  }

  .sidebar-header h1 {
    font-family: var(--serif);
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
    color: var(--primary-gold);
  }

  .close-btn {
    display: none;
    background: none;
    border: none;
    color: var(--white);
    cursor: pointer;
    padding: 4px;
    transition: color 0.3s ease;
  }

  .close-btn:hover {
    color: var(--primary-gold);
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 12px;
  }

  .nav-section h3 {
    display: none;
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 8px 6px;
    background: none;
    border: 2px solid var(--primary-gold);
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    text-align: center;
  }

  .nav-item span {
    display: block;
    font-size: 12px;
    font-weight: 600;
  }

  .nav-item:hover:not(.disabled) {
    color: var(--primary-gold);
    background: rgba(180, 153, 104, 0.1);
    border-radius: 8px;
  }

  .nav-item.active {
    color: var(--primary-gold);
  }

  .nav-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-item svg {
    flex-shrink: 0;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 150px;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    transition: margin-left 0.3s ease;
    padding-bottom: 60px;
    background-color: #ffffff;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 6px 8px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-info {
    text-align: center;
    padding: 4px 0;
  }

  .user-name {
    font-size: 10px;
    font-weight: 600;
    color: var(--primary-gold);
    margin: 0;
  }

  .user-role {
    font-size: 9px;
    color: #999;
    margin: 1px 0 0 0;
  }

  .logout-btn {
    background: var(--primary-gold);
    color: var(--primary-black);
    border: none;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 600;
    font-size: 11px;
  }

  .logout-btn:hover {
    background: #d4af37;
    transform: translateY(-1px);
  }

  /* Top Bar */
  .top-bar {
    display: none;
  }

  .hamburger {
    display: none;
  }

  .page-title {
    display: none;
  }

  .admin-info {
    display: none;
  }

  .admin-details {
    display: none;
  }

  .admin-name {
    display: none;
  }

  .admin-role {
    display: none;
  }

  /* Content Area */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    padding-bottom: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
  }

  .empty-state {
    text-align: center;
    max-width: 400px;
  }

  .empty-logo {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    border: 3px solid var(--primary-black);
    border-radius: 4px;
    padding: 8px;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-logo img {
    width: 180px;
    height: auto;
    opacity: 1;
  }

  .empty-state h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-black);
    margin: 0 0 12px 0;
    display: none;
  }

  .empty-state p {
    font-size: 14px;
    color: #999;
    margin: 0;
    display: none;
  }

  .dashboard-section {
    display: none;
  }

  .dashboard-section h1 {
    display: none;
    font-size: 28px;
    font-weight: 600;
    color: var(--primary-black);
    margin: 0 0 8px 0;
  }

  .dashboard-section p {
    font-size: 14px;
    color: #666;
    margin: 0 0 32px 0;
  }

  .dashboard-grid {
    display: none;
  }

  .dashboard-card {
    display: none;
  }

  .card-icon {
    display: none;
  }

  .windows-container {
    position: relative;
  }

  /* Bottom Bar */
  .bottom-bar {
    padding: 16px 32px;
    background-color: var(--white);
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
  }

  .bottom-bar p {
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar-header .close-btn {
      display: block;
    }

    .main-content {
      margin-left: 0;
    }

    .hamburger {
      display: block;
    }

    .page-title {
      margin-left: 0;
    }

    .top-bar {
      padding: 12px 16px;
    }

    .content {
      padding: 16px;
    }

    .bottom-bar {
      padding: 12px 16px;
    }

    .admin-info {
      gap: 8px;
    }

    .admin-details {
      display: none;
    }
  }
</style>
