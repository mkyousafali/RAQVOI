<script lang="ts">
  import { onMount } from 'svelte';
  import AnnouncementBar from './components/AnnouncementBar.svelte';
  import Header from './components/Header.svelte';
  import Hero from './components/Hero.svelte';
  import CategorySection from './components/CategorySection.svelte';
  import ProductSection from './components/ProductSection.svelte';
  import BenefitsStrip from './components/BenefitsStrip.svelte';
  import CollectionSection from './components/CollectionSection.svelte';
  import AdminPanel from './components/admin/AdminPanel.svelte';
  import { restoreSession } from './lib/adminStore';

  let currentPage = 'home';

  function checkRoute() {
    const path = window.location.pathname;
    console.log('Current path:', path);
    if (path.includes('/admin')) {
      currentPage = 'admin';
    } else {
      currentPage = 'home';
    }
  }

  onMount(() => {
    restoreSession();
    
    // Check route on initial load
    checkRoute();
    
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', checkRoute);
    
    // Also check route periodically for direct navigation
    const interval = setInterval(checkRoute, 500);

    return () => {
      window.removeEventListener('popstate', checkRoute);
      clearInterval(interval);
    };
  });
</script>

{#if currentPage === 'admin'}
  <AdminPanel />
{:else}
  <main>
    <AnnouncementBar />
    <Header />
    <Hero />
    <CategorySection />
    <ProductSection />
    <BenefitsStrip />
    <CollectionSection />
  </main>
{/if}

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
      'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #1a1a1a;
  }

  :global(a) {
    color: inherit;
    text-decoration: none;
  }

  :global(button) {
    font-family: inherit;
  }

  main {
    width: 100%;
  }
</style>
