import { mount } from 'svelte';
import App from './App.svelte';
import './styles.css';
import './styles/home-refresh.css';
import './lib/admin/layout.css';
import './lib/admin/theme.css';
mount(App, { target: document.getElementById('app')! });

// Keep protected previews network-only; the worker never caches app content.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      console.warn('App installation support is unavailable in this browser session.');
    });
  });
}
