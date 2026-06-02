<script lang="ts">
  import { onMount } from 'svelte';
  import { focusWindow, moveWindow, resizeWindow, closeWindow, minimizeWindow, maximizeWindow } from '../../lib/windowStore';
  import type { Window as AppWindow } from '../../lib/windowStore';
  import AdminUsersWindow from './windows/AdminUsersWindow.svelte';
  import DashboardWindow from './windows/DashboardWindow.svelte';
  import ProductManagerWindow from './windows/ProductManagerWindow.svelte';

  export let windowData: AppWindow;

  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = windowData.x;
    startY = windowData.y;
    focusWindow(windowData.id);
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      moveWindow(windowData.id, startX + dx, startY + dy);
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleResizeStart(e: MouseEvent) {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    startWidth = windowData.width;
    startHeight = windowData.height;
    e.preventDefault();
  }

  function handleResizeMove(e: MouseEvent) {
    if (isResizing) {
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;
      resizeWindow(windowData.id, startWidth + dx, startHeight + dy);
    }
  }

  function handleResizeEnd() {
    isResizing = false;
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  });
</script>

<div
  class="window"
  style="
    left: {windowData.x}px;
    top: {windowData.y}px;
    width: {windowData.width}px;
    height: {windowData.height}px;
    z-index: {windowData.zIndex};
    display: {windowData.isMinimized ? 'none' : 'flex'};
  "
>
  <!-- Title Bar -->
  <div class="title-bar" on:mousedown={handleMouseDown}>
    <h3 class="title">{windowData.title}</h3>
    <div class="controls">
      <button class="btn-minimize" on:click={() => minimizeWindow(windowData.id)} title="Minimize">
        <span>−</span>
      </button>
      <button class="btn-maximize" on:click={() => maximizeWindow(windowData.id)} title="Maximize">
        <span>□</span>
      </button>
      <button class="btn-close" on:click={() => closeWindow(windowData.id)} title="Close">
        <span>✕</span>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="window-content">
    {#if windowData.component === 'dashboard'}
      <DashboardWindow />
    {:else if windowData.component === 'admin-users'}
      <AdminUsersWindow />
    {:else if windowData.component === 'product-manager'}
      <ProductManagerWindow />
    {/if}
  </div>

  <!-- Resize Handle -->
  <div class="resize-handle" on:mousedown={handleResizeStart} />
</div>

<style>
  .window {
    position: fixed;
    background: var(--white);
    border: 2px solid var(--primary-gold);
    border-top: 4px solid var(--primary-gold);
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: var(--sans);
  }

  .title-bar {
    background: var(--primary-gold);
    color: var(--primary-black);
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
    border-top: 4px solid var(--primary-gold);
    border-bottom: 1px solid #444;
  }

  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--primary-black);
  }

  .controls {
    display: flex;
    gap: 8px;
  }

  .btn-minimize,
  .btn-maximize,
  .btn-close {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: #1a1a1a;
    color: var(--primary-gold);
    cursor: pointer;
    border-radius: 3px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-minimize:hover,
  .btn-maximize:hover {
    background: #333;
    color: #fff;
  }

  .btn-close:hover {
    background: #c33;
    color: var(--white);
  }

  .window-content {
    flex: 1;
    overflow: hidden;
    background: var(--white);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, var(--primary-gold) 50%);
  }
</style>