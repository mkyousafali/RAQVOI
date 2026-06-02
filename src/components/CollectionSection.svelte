<script lang="ts">
  import { onMount } from 'svelte';
  import { getCollections, type Collection } from '../lib/productUtils';

  let collections: Collection[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      loading = true;
      collections = await getCollections();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error loading collections';
      console.error('Error loading collections:', err);
    } finally {
      loading = false;
    }
  });
</script>

<section class="collection-section">
  <h2 class="section-title">SHOP BY COLLECTION</h2>

  {#if loading}
    <div class="loading">Loading collections...</div>
  {:else if error}
    <div class="error-state">
      <p>❌ {error}</p>
    </div>
  {:else if collections.length === 0}
    <div class="empty-state">
      <p>No collections available</p>
    </div>
  {:else}
    <div class="collection-grid">
      {#each collections as collection}
        <a href="#" class="collection-card">
          <div class="collection-image">
            {#if collection.image_url}
              <img src={collection.image_url} alt={collection.name} />
            {:else}
              <div class="placeholder">No Image</div>
            {/if}
            <div class="collection-overlay">
              <span class="collection-label">{collection.name}</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .collection-section {
    padding: 60px 20px;
    background-color: #ffffff;
  }

  .section-title {
    font-size: 28px;
    font-weight: 300;
    letter-spacing: 2px;
    color: #1a1a1a;
    text-align: center;
    margin: 0 0 40px;
    font-family: 'Playfair Display', serif;
    text-transform: uppercase;
  }

  .loading,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: 16px;
  }

  .error-state {
    color: #c33;
    background: #fee;
    border: 1px solid #f99;
    border-radius: 4px;
    max-width: 600px;
    margin: 0 auto;
  }

  .error-state p {
    margin: 0;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    color: #999;
    font-size: 14px;
  }

  .collection-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .collection-card {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4/3;
    text-decoration: none;
    display: block;
  }

  .collection-image {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .collection-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .collection-card:hover .collection-image img {
    transform: scale(1.05);
  }

  .collection-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.4), transparent);
    display: flex;
    align-items: center;
    padding-left: 40px;
  }

  .collection-label {
    color: #ffffff;
    font-size: 28px;
    font-weight: 300;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-family: 'Playfair Display', serif;
  }

  @media (min-width: 768px) {
    .collection-section {
      padding: 80px 40px;
    }

    .section-title {
      font-size: 40px;
      margin-bottom: 60px;
    }

    .collection-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
  }
</style>
