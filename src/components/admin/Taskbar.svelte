<script lang="ts">
  import { windows, minimizeWindow } from '../../lib/windowStore';
  import type { Window as AppWindow } from '../../lib/windowStore';

  function handleTaskbarClick(window: AppWindow) {
    if (window.isMinimized) {
      minimizeWindow(window.id);
    } else {
      minimizeWindow(window.id);
    }
  }
</script>

<div class="taskbar">
  <div class="taskbar-items">
    {#each $windows as window (window.id)}
      <button
        class="taskbar-item {window.isMinimized ? 'minimized' : 'active'}"
        on:click={() => handleTaskbarClick(window)}
        title={window.title}
      >
        <span class="taskbar-icon">□</span>
        <span class="taskbar-text">{window.title}</span>
      </button>
    {/each}
  </div>

  <div class="taskbar-right">
    <div class="clock">
      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
    </div>
  </div>
</div>

<style>
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 150px;
    right: 0;
    height: 50px;
    background: linear-gradient(to right, var(--primary-black), #2a2a2a);
    border-top: 3px solid var(--primary-gold);
    border-left: 2px solid var(--primary-gold);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 16px;
    font-family: var(--sans);
    z-index: 999;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    transition: left 0.3s ease;
  }

  .taskbar-left {
    display: none;
  }

  .taskbar-label {
    display: none;
  }

  .taskbar-items {
    flex: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    overflow-x: auto;
    padding: 0 8px;
  }

  .taskbar-item {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--white);
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .taskbar-item:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .taskbar-item.active {
    background: var(--primary-gold);
    color: var(--primary-black);
    border-color: var(--primary-gold);
  }

  .taskbar-item.minimized {
    background: rgba(180, 153, 104, 0.3);
    border-color: rgba(180, 153, 104, 0.5);
  }

  .taskbar-icon {
    font-size: 10px;
  }

  .taskbar-text {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .taskbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .clock {
    color: var(--primary-gold);
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    text-align: right;
    border: 2px solid var(--primary-gold);
    padding: 6px 12px;
    border-radius: 4px;
    background: rgba(180, 153, 104, 0.1);
  }

  @media (max-width: 768px) {
    .taskbar {
      left: 0;
      padding: 0 8px;
    }

    .taskbar-text {
      max-width: 80px;
    }
  }
</style>
