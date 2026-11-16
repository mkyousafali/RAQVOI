<script lang="ts">
 import { LogOut, UserRound } from 'lucide-svelte';
 type TaskbarPanel = { id: string; title: string; minimized: boolean };

 let {
  panels,
  activeId,
  onSelect,
  email,
  busy = false,
  onLogout
 }: {
  panels: TaskbarPanel[];
  activeId: string | null;
  onSelect: (id: string) => void;
  email?: string;
  busy?: boolean;
  onLogout?: () => void;
 } = $props();
</script>

<div class="admin-taskbar" data-testid="admin-taskbar">
 {#if email}
  <div class="taskbar-identity" title={email}><small>SIGNED IN AS</small><strong>{email}</strong></div>
 {/if}
 <div class="open-windows" role="group" aria-label="Open Admin windows">
  {#each panels as panel (panel.id)}
   <button
    type="button"
    class="window-task"
    class:active={activeId === panel.id && !panel.minimized}
    class:minimized={panel.minimized}
    aria-label={panel.minimized ? `Restore ${panel.title} window` : `Show ${panel.title} window`}
    title={panel.title}
    onclick={() => onSelect(panel.id)}
   >
    <span class="window-marker" aria-hidden="true"></span>
    <span class="window-title">{panel.title}</span>
   </button>
  {/each}
 </div>
 {#if onLogout}
  <a class="account-task" href="#/account" aria-label="Return to your account" title="Return to your account"><UserRound size={18}/></a>
  <button class="signout-task" type="button" aria-label="Sign out of Admin" title="Sign out of Admin" onclick={onLogout} disabled={busy}><LogOut size={18}/></button>
 {/if}
</div>

<style>
 .admin-taskbar{position:fixed;z-index:1000;right:0;bottom:0;left:0;display:flex;align-items:center;height:52px;padding:5px 13px;border-top:2px solid #cdbd8c;background:#15262a;box-shadow:0 -12px 30px #142f2b3d;color:#eaf0ed}
 .taskbar-identity{display:grid;gap:2px;flex:none;max-width:230px;min-width:0;margin-right:14px;line-height:1.1}
 .taskbar-identity small{color:#9cb7ae;font-size:8px;font-weight:800;letter-spacing:.13em}
 .taskbar-identity strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:700}
 .open-windows{display:flex;align-items:center;gap:7px;flex:1;min-width:0;height:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:#55766c transparent}
 .window-task{display:flex;align-items:center;gap:9px;flex:0 0 auto;min-width:118px;max-width:190px;height:38px;padding:0 12px;border:1px solid #506b62;border-radius:8px;background:#27433a;color:#d6e5de;font-size:11px;font-weight:700;text-align:left;cursor:pointer}
 .window-task:hover{background:#345449;color:#fff}
 .window-task.active{border-color:#bbba8c;background:#416854;color:#fff;box-shadow:inset 0 -2px #d7c696}
 .window-task.minimized{background:#1c3330;color:#a9bdb3}
 .window-marker{flex:none;width:7px;height:7px;border-radius:2px;background:#a8c9b7}
 .window-task.active .window-marker{background:#e6d39f}
 .window-task.minimized .window-marker{background:#708e80}
 .window-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .account-task,.signout-task{display:grid;place-items:center;flex:none;width:38px;height:38px;border:1px solid #506b62;border-radius:8px;background:#27433a;color:#eaf0ed;cursor:pointer}
 .account-task{margin-left:10px}
 .signout-task{margin-left:6px;border-color:#843b45;background:#6c2630;color:#fff}
 .account-task:hover{border-color:#cdbd8c;background:#375a4c}
 .signout-task:hover:not(:disabled){border-color:#a8555f;background:#87343f}
 .signout-task:disabled{opacity:.5;cursor:wait}
 @media(max-width:760px){.admin-taskbar{padding:5px 8px}.taskbar-identity{max-width:130px;margin-right:7px}.taskbar-identity strong{font-size:9px}.window-task{min-width:108px;max-width:150px}}
</style>
