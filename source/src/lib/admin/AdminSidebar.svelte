<script lang="ts">
 import { UsersRound, ShieldCheck, UserRound } from 'lucide-svelte';
 import type { AdminAccess } from '../admin';
 type UserPanel = 'admins' | 'customers';

 let {
  mobileOpen,
  activeId,
  access,
  onOpen
 }: {
  mobileOpen: boolean;
  activeId: UserPanel | null;
  access: AdminAccess;
  onOpen: (id: UserPanel) => void;
 } = $props();

 let userManagementOpen = $state(false);

 function openUserPanel(id: UserPanel) {
  userManagementOpen = false;
  onOpen(id);
 }
</script>

<aside class="sidebar" class:open={mobileOpen} data-testid="admin-sidebar" aria-label="Admin sidebar">
 <div class="identity">
  <div class="identity-brand">
   <img class="identity-logo" src="/assets/brand/logo.png" alt="RAQVOI"/>
  </div>
 </div>

 <div class="sidebar-content">
 {#if access.isOwner || access.permissions.admins || access.permissions.customers}
  <button
   class="section-toggle"
   class:expanded={userManagementOpen}
   class:section-active={activeId !== null}
   type="button"
   aria-expanded={userManagementOpen}
   aria-controls="admin-user-management"
   onclick={() => userManagementOpen = !userManagementOpen}
  ><span class="menu-button-label"><UsersRound size={16}/><span>Users</span></span><span class="menu-chevron" aria-hidden="true"></span></button>
  {#if userManagementOpen}
   <nav class="subnav" id="admin-user-management" aria-label="Users">
    {#if access.isOwner || access.permissions.admins}<button class="subitem" class:active={activeId === 'admins'} type="button" aria-pressed={activeId === 'admins'} onclick={() => openUserPanel('admins')}><ShieldCheck size={15}/><span>Admins</span></button>{/if}
    {#if access.isOwner || access.permissions.customers}<button class="subitem" class:active={activeId === 'customers'} type="button" aria-pressed={activeId === 'customers'} onclick={() => openUserPanel('customers')}><UserRound size={15}/><span>Customers</span></button>{/if}
   </nav>
  {/if}
 {/if}
 </div>

 <small class="identity-label sidebar-label">ADMIN CONSOLE</small>
</aside>

<style>
 .sidebar{position:sticky;top:0;display:flex;flex-direction:column;width:var(--admin-sidebar-width,150px);height:100dvh;min-height:520px;padding-bottom:52px;overflow:auto;background:#15262a;color:#eaf0ed;border-right:1px solid #2f4343}
 .identity{display:grid;gap:5px;padding:9px 10px 12px;border-bottom:1px solid #ffffff19}
 .identity-brand{display:flex;align-items:center;justify-content:center;min-height:38px;padding:5px 4px;border-radius:8px;background:#f7f3eb}
 .identity-logo{width:130px;max-width:100%;height:auto;object-fit:contain}
 .identity-label{color:#9cb7ae;font-size:8px;font-weight:800;letter-spacing:.2em;text-align:center}
 .sidebar-content{flex:1;padding:18px 10px}
 .section-toggle{display:block;width:100%;min-height:40px;padding:8px 9px;border:0;border-radius:8px;background:transparent;color:#e4eee9;font-size:11px;font-weight:700;text-align:left;cursor:pointer}
 .section-toggle:hover,.section-toggle.section-active{background:#ffffff12}
 .subnav{display:grid;gap:2px;margin:4px 0 0 8px;padding-left:8px;border-left:1px solid #ffffff30}
 .subitem{display:block;width:100%;min-height:36px;padding:7px 8px;border:0;border-radius:7px;background:transparent;color:#abc0ba;font-size:11px;font-weight:600;text-align:left;cursor:pointer}
 .subitem:hover{background:#ffffff12;color:#fff}
 .subitem.active{background:#2d4a48;color:#fff;box-shadow:inset 2px 0 #cdbd8c}
 @media(max-width:760px){
  .sidebar{position:fixed;z-index:1100;top:0;bottom:52px;left:0;height:calc(100dvh - 52px);min-height:0;padding-bottom:0;visibility:hidden;transform:translateX(-100%);transition:transform .2s ease,visibility .2s}
  .sidebar.open{visibility:visible;transform:translateX(0)}
 }
 @media(prefers-reduced-motion:reduce){.sidebar{transition:none}}
</style>
