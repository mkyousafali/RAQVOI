<script lang="ts">
 import { Menu } from 'lucide-svelte';
 import { onMount } from 'svelte';
 import { adminApi, type AdminAccess } from '../admin';
 import AdminSidebar from './AdminSidebar.svelte';
 import AdminTaskbar from './AdminTaskbar.svelte';
 import AdminWindow from './AdminWindow.svelte';

 type PanelId = 'admins' | 'customers';
 type AdminPanel = {
  id: PanelId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
 };

 let { email, busy, error, access, onLogout }: { email: string; busy: boolean; error: string; access: AdminAccess; onLogout: () => void } = $props();
 let refreshedAccess = $state<AdminAccess | null>(null);
 const currentAccess = $derived(refreshedAccess ?? access);

 const titles: Record<PanelId, string> = {
  admins: 'Admins',
  customers: 'Customers'
 };

 let panels = $state<AdminPanel[]>([]);
 let activeId = $state<PanelId | null>(null);
 let mobileMenuOpen = $state(false);
 let workspaceElement: HTMLElement | undefined;
 let topZ = 1;

 const allowed = (id: PanelId) => currentAccess.isOwner || currentAccess.permissions[id];
 onMount(() => {
  async function syncAccess() {
   try {
    const result=await adminApi<AdminAccess & {authenticated:boolean}>('session');
    refreshedAccess = result.authenticated ? {isOwner:result.isOwner,permissions:result.permissions} : {isOwner:false,permissions:{admins:false,customers:false}};
    panels = panels.filter(panel => allowed(panel.id));
    if (activeId && !allowed(activeId)) activeId = topVisible(panels);
   } catch { /* Existing endpoint authorization remains authoritative while offline. */ }
  }
  const interval = setInterval(() => void syncAccess(), 30000);
  return () => clearInterval(interval);
 });

 function topVisible(list: AdminPanel[]): PanelId | null {
  return list.filter(panel => !panel.minimized).reduce<AdminPanel | null>(
   (top, panel) => !top || panel.z > top.z ? panel : top,
   null
  )?.id ?? null;
 }

 function focusPanel(id: string) {
  const panel = panels.find(item => item.id === id);
  if (!panel) return;
  const z = ++topZ;
  panels = panels.map(item => item.id === id ? { ...item, minimized: false, z } : item);
  activeId = panel.id;
  mobileMenuOpen = false;
 }

 function openPanel(id: PanelId) {
  if (!allowed(id)) return;
  if (panels.some(panel => panel.id === id)) {
   focusPanel(id);
   return;
  }
  const areaWidth = workspaceElement?.clientWidth ?? 960;
  const areaHeight = workspaceElement?.clientHeight ?? 680;
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const width = Math.max(280, Math.min(650, areaWidth - 40));
  const height = Math.max(220, Math.min(430, areaHeight - 40));
  const offset = panels.length % 5;
  const panel: AdminPanel = {
   id,
   title: titles[id],
   x: mobile ? 0 : Math.min(24 + offset * 30, Math.max(0, areaWidth - width)),
   y: mobile ? 0 : Math.min(24 + offset * 30, Math.max(0, areaHeight - height)),
   width,
   height,
   z: ++topZ,
   minimized: false,
   maximized: mobile
  };
  panels = [...panels, panel];
  activeId = id;
  mobileMenuOpen = false;
 }

 function movePanel(id: string, x: number, y: number) {
  const panel = panels.find(item => item.id === id);
  if (!panel || panel.maximized) return;
  const maxX = Math.max(0, (workspaceElement?.clientWidth ?? panel.width) - panel.width);
  const maxY = Math.max(0, (workspaceElement?.clientHeight ?? panel.height) - panel.height);
  panels = panels.map(item => item.id === id
   ? { ...item, x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) }
   : item
  );
 }

 function minimizePanel(id: string) {
  panels = panels.map(panel => panel.id === id ? { ...panel, minimized: true } : panel);
  if (activeId === id) activeId = topVisible(panels);
 }

 function maximizePanel(id: string) {
  panels = panels.map(panel => panel.id === id ? { ...panel, maximized: !panel.maximized } : panel);
  focusPanel(id);
 }

 function closePanel(id: string) {
  panels = panels.filter(panel => panel.id !== id);
  if (activeId === id) activeId = topVisible(panels);
 }
</script>

<div class="admin-shell" data-testid="admin-shell" aria-busy={busy}>
 <AdminSidebar mobileOpen={mobileMenuOpen} {activeId} onOpen={openPanel} access={currentAccess}/>
 {#if mobileMenuOpen}
  <button class="sidebar-scrim" type="button" aria-label="Close Admin menu" onclick={() => mobileMenuOpen = false}></button>
 {/if}
 <div class="admin-body">
  <header class="mobile-topbar">
   <button class="menu-button" type="button" aria-label={mobileMenuOpen ? 'Close Admin menu' : 'Open Admin menu'} aria-expanded={mobileMenuOpen} onclick={() => mobileMenuOpen = !mobileMenuOpen}><Menu size={20}/></button>
   <div class="topbar-title"><small>RAQVOI ADMIN</small><strong>Desktop</strong></div>
  </header>
  <section class="workspace" bind:this={workspaceElement} data-testid="admin-workspace" aria-label="Admin workspace">
   {#if error}<div class="error" role="alert">{error}</div>{/if}
   {#each panels as panel (panel.id)}
     <AdminWindow
      {panel}
      active={activeId === panel.id}
      onFocus={focusPanel}
      onMove={movePanel}
      onMinimize={minimizePanel}
      onMaximize={maximizePanel}
      onClose={closePanel}
     />
   {/each}
  </section>
 </div>
 <AdminTaskbar {panels} {activeId} onSelect={focusPanel} {email} {busy} {onLogout}/>
</div>

<style>
 .admin-shell{--admin-sidebar-width:150px;display:grid;grid-template-columns:var(--admin-sidebar-width) minmax(0,1fr);height:100dvh;min-height:520px;overflow:hidden;background:#eef2f0;color:#1f3738;font-family:'DM Sans',Arial,sans-serif}
 .admin-body{display:flex;flex-direction:column;min-width:0;height:100dvh;padding-bottom:52px}
 .workspace{position:relative;flex:1;min-width:0;min-height:0;overflow:hidden;background:radial-gradient(circle at 93% 8%,#d8e9e380,transparent 29%),#eef2f0}
 .error{position:absolute;z-index:900;top:16px;right:16px;max-width:min(440px,calc(100% - 32px));padding:12px 14px;border:1px solid #ecc5c5;border-radius:9px;background:#fff0f0;color:#8a3139;font-size:12px}
 .mobile-topbar,.sidebar-scrim{display:none}
 @media(max-width:760px){
  .admin-shell{display:block;min-height:0}
  .admin-body{height:100dvh}
  .mobile-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:63px;padding:9px 14px;border-bottom:1px solid #dbe3e1;background:#fbfcfb}
  .menu-button{display:grid;place-items:center;flex:none;width:36px;height:36px;border:1px solid #dce5e1;border-radius:9px;background:#fff;color:#2d5145}
  .menu-button{background:#19392f;color:#dfcc93}
  .topbar-title{display:grid;gap:2px;margin-right:auto}
  .topbar-title small{color:#879a95;font-size:8px;font-weight:800;letter-spacing:.15em}
  .topbar-title strong{font-size:12px}
  .sidebar-scrim{position:fixed;z-index:1050;top:0;right:0;bottom:52px;left:0;display:block;border:0;background:#10232199}
 }
</style>
