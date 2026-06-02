<script lang="ts">
  import { categories } from '../lib/data';
</script>

<section class="category-section">
  <div class="category-container">
    <div class="desktop-categories">
      {#each categories as category}
        <a href={category.href} class="category-card">
          <div class="category-image">
            <img src={category.image} alt={category.name} />
            <div class="category-overlay">
              <span class="shop-link">Shop Now</span>
            </div>
          </div>
          <h3 class="category-name">{category.name}</h3>
        </a>
      {/each}
    </div>

    <div class="mobile-categories">
      {#each categories as category}
        <a href={category.href} class="mobile-category">
          <div class="mobile-category-image">
            <img src={category.image} alt={category.name} />
          </div>
          <p class="mobile-category-name">{category.name}</p>
          <span class="mobile-shop-link">Shop Now</span>
        </a>
      {/each}
    </div>
  </div>
</section>

<style>
  .category-section {
    padding: 40px 20px;
    background-color: #ffffff;
  }

  .category-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .desktop-categories {
    display: none;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .category-card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease;
  }

  .category-card:hover {
    transform: translateY(-4px);
  }

  .category-image {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1;
    background-color: #f5f1ed;
  }

  .category-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .category-card:hover .category-image img {
    transform: scale(1.05);
  }

  .category-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .category-card:hover .category-overlay {
    opacity: 1;
  }

  .shop-link {
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .category-name {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    color: #1a1a1a;
    margin: 0;
    text-transform: uppercase;
  }

  /* Mobile styles */
  .mobile-categories {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 8px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .mobile-categories::-webkit-scrollbar {
    display: none;
  }

  .mobile-category {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    flex: 0 0 auto;
    min-width: 80px;
  }

  .mobile-category-image {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f5f1ed;
  }

  .mobile-category-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .mobile-category-name {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    color: #1a1a1a;
    margin: 0;
    text-align: center;
    text-transform: uppercase;
  }

  .mobile-shop-link {
    font-size: 10px;
    color: #666;
    text-decoration: none;
  }

  @media (min-width: 768px) {
    .category-section {
      padding: 60px 40px;
    }

    .desktop-categories {
      display: grid;
    }

    .mobile-categories {
      display: none;
    }
  }
</style>
