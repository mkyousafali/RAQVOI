<script lang="ts">
  import { onMount } from 'svelte';
  import { Download, X } from 'lucide-svelte';
  type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  let promptEvent = $state<InstallPrompt | null>(null);
  let installed = $state(false);
  let instructions = $state(false);
  let ios = $state(false);
  let installing = $state(false);
  onMount(() => {
    installed = matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const before = (event: Event) => { event.preventDefault(); promptEvent = event as InstallPrompt; };
    const done = () => { installed = true; promptEvent = null; instructions = false; };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', done); };
  });
  async function install() {
    if (!promptEvent) { instructions = !instructions; return; }
    installing = true;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      promptEvent = null;
    } catch { instructions = true; }
    finally { installing = false; }
  }
</script>

{#if !installed}
  <div class="install-app">
    <button class="install-button" type="button" onclick={install} disabled={installing} aria-expanded={instructions} aria-controls="install-instructions"><Download size={15}/>{installing ? 'Opening install…' : 'Install RAQVOI app'}</button>
    {#if instructions}
      <div id="install-instructions" class="install-instructions" role="status">
        <button type="button" class="dismiss" aria-label="Close install instructions" onclick={() => instructions = false}><X size={14}/></button>
        {#if ios}<p>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>
        {:else}<p>Use your browser’s <strong>Install app</strong> option in the address bar or menu. On mobile, look for <strong>Add to Home Screen</strong>.</p>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .install-app{margin-top:20px;max-width:270px}.install-button{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px solid #b9bfaf;border-radius:4px;padding:10px 13px;color:var(--forest);font:inherit;font-size:11px;cursor:pointer}.install-button:hover{background:#e9ecdf}.install-button:disabled{opacity:.6}.install-instructions{position:relative;margin-top:12px;padding:14px 26px 14px 14px;border:1px solid #d5d9ca;border-radius:4px;background:#f3f1e9}.install-instructions p{font-size:11px;line-height:1.7;margin:0}.dismiss{position:absolute;top:5px;right:5px;padding:2px;background:none;border:0;cursor:pointer}
</style>
