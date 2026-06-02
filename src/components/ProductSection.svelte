<script lang="ts">
  import { products } from '../lib/data';
</script>

<section class="products-section">
  <div class="products-header">
    <div class="section-label">NEW ARRIVALS</div>
    <h2 class="section-title">JUST IN</h2>
    <a href="#all" class="view-all">VIEW ALL</a>
  </div>

  <div class="desktop-grid">
    {#each products as product}
      <div class="product-card">
        {#if product.isNew}
          <div class="new-badge">NEW</div>
        {/if}
        <button class="wishlist-btn" title="Add to wishlist">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div class="product-image">
          <img src={product.image} alt={product.name} />
        </div>
        <h3 class="product-name">{product.name}</h3>
        <p class="product-price">₹{product.price.toLocaleString('en-IN')}</p>
      </div>
    {/each}
  </div>

  <div class="mobile-scroll">
    {#each products as product}
      <div class="product-card-mobile">
        {#if product.isNew}
          <div class="new-badge">NEW</div>
        {/if}
        <button class="wishlist-btn" title="Add to wishlist">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div class="product-image">
          <img src={product.image} alt={product.name} />
        </div>
        <h3 class="product-name">{product.name}</h3>
        <p class="product-price">₹{product.price.toLocaleString('en-IN')}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .products-section {
    padding: 60px 20px;
    background-color: #ffffff;
  }

  .products-header {
    max-width: 1400px;
    margin: 0 auto 40px;
    text-align: center;
    position: relative;
  }

  .section-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 2px;
    color: #b89968;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 40px;
    font-weight: 300;
    letter-spacing: 2px;
    color: #1a1a1a;
    margin: 0 0 20px;
    font-family: 'Playfair Display', serif;
  }

  .view-all {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #1a1a1a;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
  }

  .view-all:hover {
    gap: 12px;
  }

  .desktop-grid {
    display: none;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .product-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    transition: all 0.3s ease;
  }

  .product-card:hover {
    transform: translateY(-4px);
  }

  .new-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    background-color: #1a1a1a;
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 8px;
    z-index: 2;
  }

  .wishlist-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background-color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 2;
    color: #1a1a1a;
  }

  .wishlist-btn:hover {
    background-color: #f0f0f0;
    border-color: #1a1a1a;
  }

  .product-image {
    position: relative;
    overflow: hidden;
    aspect-ratio: 3/4;
    background-color: #f5f1ed;
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .product-card:hover .product-image img {
    transform: scale(1.05);
  }

  .product-name {
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.4;
  }

  .product-price {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }

  /* Mobile horizontal scroll */
  .mobile-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 8px 0;
    max-width: 1400px;
    margin: 0 auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .mobile-scroll::-webkit-scrollbar {
    display: none;
  }

  .product-card-mobile {
    flex: 0 0 180px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  .product-card-mobile .product-image {
    aspect-ratio: 3/4;
  }

  .product-card-mobile .product-name {
    font-size: 12px;
  }

  .product-card-mobile .product-price {
    font-size: 13px;
  }

  @media (min-width: 768px) {
    .products-section {
      padding: 80px 40px;
    }

    .section-title {
      font-size: 48px;
    }

    .desktop-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }

    .mobile-scroll {
      display: none;
    }

    .view-all {
      position: static;
      transform: none;
      display: inline-block;
      margin-left: 12px;
    }

    .products-header {
      text-align: center;
    }
  }
</style>
