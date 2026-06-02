<script lang="ts">
  import AnnouncementBar from './components/AnnouncementBar.svelte';
  import Header from './components/Header.svelte';
  import Hero from './components/Hero.svelte';
  import CategorySection from './components/CategorySection.svelte';
  import ProductSection from './components/ProductSection.svelte';
  import BenefitsStrip from './components/BenefitsStrip.svelte';
  import CollectionSection from './components/CollectionSection.svelte';
</script>

<main>
  <AnnouncementBar />
  <Header />
  <Hero />
  <CategorySection />
  <ProductSection />
  <BenefitsStrip />
  <CollectionSection />
</main>

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
