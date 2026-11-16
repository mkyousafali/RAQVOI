<script lang="ts">
 import { Copy, Minus, RefreshCw, ShieldCheck, UserRound, Square, X } from 'lucide-svelte';
 import AdminManagement from './AdminManagement.svelte';

 type Panel = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  maximized: boolean;
  minimized?: boolean;
 };

 let {
  panel,
  active,
  onFocus,
  onMove,
  onMinimize,
  onMaximize,
  onClose
 }: {
  panel: Panel;
  active: boolean;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onClose: (id: string) => void;
 } = $props();

 let dragging = false;
 let refreshVersion = $state(0);
 let pointerId = -1;
 let pointerX = 0;
 let pointerY = 0;
 let startX = 0;
 let startY = 0;

 function startDrag(event: PointerEvent) {
  if (panel.maximized || event.button !== 0) return;
  dragging = true;
  pointerId = event.pointerId;
  pointerX = event.clientX;
  pointerY = event.clientY;
  startX = panel.x;
  startY = panel.y;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  event.preventDefault();
 }

 function moveDrag(event: PointerEvent) {
  if (!dragging || event.pointerId !== pointerId) return;
  onMove(panel.id, startX + event.clientX - pointerX, startY + event.clientY - pointerY);
 }

 function endDrag(event: PointerEvent) {
  if (event.pointerId !== pointerId) return;
  dragging = false;
  pointerId = -1;
  const handle = event.currentTarget as HTMLElement;
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
 }

 function moveWithKeys(event: KeyboardEvent) {
  if (panel.maximized) return;
  const step = event.shiftKey ? 40 : 12;
  const offsets: Record<string, [number, number]> = {
   ArrowLeft: [-step, 0],
   ArrowRight: [step, 0],
   ArrowUp: [0, -step],
   ArrowDown: [0, step]
  };
  const offset = offsets[event.key];
  if (!offset) return;
  event.preventDefault();
  onFocus(panel.id);
  onMove(panel.id, panel.x + offset[0], panel.y + offset[1]);
 }
</script>

<div
 class:active
 class:maximized={panel.maximized}
 class="admin-window"
 role="group"
 aria-label="{panel.title} window"
 style:display={panel.minimized ? 'none' : undefined}
 style:left={panel.maximized ? '0' : `${panel.x}px`}
 style:top={panel.maximized ? '0' : `${panel.y}px`}
 style:width={panel.maximized ? '100%' : `${panel.width}px`}
 style:height={panel.maximized ? '100%' : `${panel.height}px`}
 style:z-index={panel.z}
 onpointerdown={() => onFocus(panel.id)}
>
 <div class="titlebar">
  <button
   class="drag-handle"
   type="button"
   aria-label="Move {panel.title} window"
   title={panel.maximized ? 'Double-click to restore' : 'Drag to move, or use arrow keys'}
   onpointerdown={startDrag}
   onpointermove={moveDrag}
   onpointerup={endDrag}
   onpointercancel={endDrag}
   onkeydown={moveWithKeys}
   ondblclick={() => onMaximize(panel.id)}
  >
   {#if panel.id === 'admins'}
    <ShieldCheck size={16} aria-hidden="true"/>
   {:else if panel.id === 'customers'}
    <UserRound size={16} aria-hidden="true"/>
   {:else}
    <Square size={16} aria-hidden="true"/>
   {/if}
   <span>{panel.title}</span>
  </button>
  <div class="window-controls">
   <button type="button" aria-label="Refresh {panel.title}" title="Refresh" onclick={() => refreshVersion++}><RefreshCw size={14}/></button>
   <button type="button" aria-label="Minimize {panel.title}" title="Minimize" onclick={() => onMinimize(panel.id)}><Minus size={17}/></button>
   <button type="button" aria-label="{panel.maximized ? 'Restore' : 'Maximize'} {panel.title}" title={panel.maximized ? 'Restore' : 'Maximize'} onclick={() => onMaximize(panel.id)}>
    {#if panel.maximized}<Copy size={12}/>{:else}<Square size={12}/>{/if}
   </button>
   <button class="close" type="button" aria-label="Close {panel.title}" title="Close" onclick={() => onClose(panel.id)}><X size={17}/></button>
  </div>
 </div>
 <div class="window-body" role="region" aria-label="{panel.title} content">
  {#key refreshVersion}
   {#if panel.id === 'admins'}<AdminManagement/>{/if}
  {/key}
 </div>
</div>

<style>
 .admin-window{position:absolute;display:flex;flex-direction:column;min-width:260px;min-height:180px;max-width:100%;max-height:100%;overflow:hidden;border:1px solid #cddad5;border-radius:12px;background:#fdfefd;box-shadow:0 22px 55px #18352f27,0 4px 14px #18352f13;color:#1f3738}
 .admin-window.active{border-color:#80a899;box-shadow:0 26px 70px #18352f3b,0 5px 18px #18352f1a}
 .admin-window.maximized{min-width:0;min-height:0;border:0;border-radius:0;box-shadow:none}
 .titlebar{display:flex;align-items:stretch;justify-content:space-between;flex:none;height:47px;border-bottom:1px solid #dce5e1;background:#f3f7f5}
 .admin-window.active .titlebar{background:#e8f2ed}
 .drag-handle{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:0 14px;border:0;background:transparent;color:#2a5145;text-align:left;cursor:grab;touch-action:none}
 .drag-handle:active{cursor:grabbing}
 .drag-handle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700}
 .window-controls{display:flex;align-items:stretch;flex:none}
 .window-controls button{display:grid;place-items:center;width:43px;border:0;border-left:1px solid #dce5e1;background:transparent;color:#49665d}
 .window-controls button:hover{background:#dce9e2}
 .window-controls .close:hover{background:#b44e50;color:#fff}
 .window-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;background:#fdfefd}
 @media(max-width:760px){.admin-window{min-width:0;min-height:0;border-radius:0}.titlebar{height:45px}.window-controls button{width:39px}}
</style>
