<script lang="ts">
  import { collections } from '../lib/data';
</script>

<section class="collection-section">
  <h2 class="section-title">SHOP BY COLLECTION</h2>

  <div class="collection-grid">
    {#each collections as collection}
      <a href="#" class="collection-card">
        <div class="collection-image">
          <img src={collection.image} alt={collection.name} />
          <div class="collection-overlay">
            <span class="collection-label">{collection.name}</span>
          </div>
        </div>
      </a>
    {/each}
  </div>
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
