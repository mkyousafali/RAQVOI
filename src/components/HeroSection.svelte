<script lang="ts">
  import { onMount } from 'svelte';
  import { getHeroImages, type HeroImage } from '../lib/productUtils';

  let heroImages: HeroImage[] = [];
  let loading = true;
  let currentIndex = 0;
  let error: string | null = null;

  onMount(async () => {
    try {
      console.log('🎬 Loading hero images...');
      heroImages = await getHeroImages();
      console.log('✅ Hero images loaded:', heroImages.length);
      
      if (heroImages.length === 0) {
        console.log('ℹ️  No hero images found, showing fallback');
        loading = false;
        return;
      }

      console.log('🎠 Starting carousel with', heroImages.length, 'images');
      // Auto-scroll every 5 seconds
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % heroImages.length;
      }, 5000);

      loading = false;
      return () => clearInterval(interval);
    } catch (err) {
      console.error('❌ Error loading hero images:', err);
      error = err instanceof Error ? err.message : 'Failed to load hero images';
      loading = false;
    }
  });

  function goToSlide(index: number) {
    currentIndex = index;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % heroImages.length;
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + heroImages.length) % heroImages.length;
  }
</script>

{#if loading}
  <section class="hero-loading">
    <p>Loading hero section...</p>
  </section>
{:else if heroImages.length > 0}
  <section class="hero-section">
    <div class="carousel-container">
      {#each heroImages as image, index}
        <div
          class="slide"
          class:active={index === currentIndex}
          style="background-image: url('{image.image_url}')"
        >
          <div class="slide-overlay">
            {#if image.title}
              <h1 class="slide-title">{image.title}</h1>
            {/if}
            {#if image.description}
              <p class="slide-description">{image.description}</p>
            {/if}
          </div>
        </div>
      {/each}

      {#if heroImages.length > 1}
        <button class="nav-button prev" on:click={prevSlide}>❮</button>
        <button class="nav-button next" on:click={nextSlide}>❯</button>

        <div class="indicators">
          {#each heroImages as _, index}
            <button
              class="indicator"
              class:active={index === currentIndex}
              on:click={() => goToSlide(index)}
              aria-label="Go to slide {index + 1}"
            />
          {/each}
        </div>
      {/if}
    </div>
  </section>
{:else}
  <!-- Fallback to static hero if no images -->
  <section class="hero">
    <div class="hero-content">
      <div class="hero-text">
        <div class="hero-label">NEW COLLECTION</div>
        <h1 class="hero-title">
          ELEGANCE
          <br />
          IN EVERY
          <br />
          DETAIL
        </h1>
        <p class="hero-subtitle">Timeless styles for the modern woman</p>
        <button class="cta-button">SHOP NOW</button>
      </div>

      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1595607774223-ef52624120d2?w=600&h=700&fit=crop" alt="Fashion model wearing elegant outfit" />
      </div>
    </div>

    <div class="hero-indicators">
      {#each [0, 1, 2, 3] as index}
        <button
          class="indicator {0 === index ? 'active' : ''}"
          aria-label="Go to slide {index + 1}"
        ></button>
      {/each}
    </div>
  </section>
{/if}

<style>
  .hero-loading {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    color: #999;
  }

  .hero-section {
    width: 100%;
    position: relative;
  }

  .carousel-container {
    position: relative;
    width: 100%;
    height: 500px;
    min-height: 500px;
    overflow: hidden;
    background: #000;
  }

  .slide {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
  }

  .slide.active {
    opacity: 1;
  }

  .slide-overlay {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    text-align: center;
    padding: 40px 20px;
    box-sizing: border-box;
  }

  .slide-title {
    font-size: 36px;
    font-weight: 300;
    letter-spacing: 2px;
    margin: 0 0 16px;
    font-family: 'Playfair Display', serif;
  }

  .slide-description {
    font-size: 16px;
    letter-spacing: 0.5px;
    margin: 0;
    max-width: 600px;
  }

  .nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.3);
    color: #ffffff;
    border: none;
    width: 50px;
    height: 50px;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
    z-index: 10;
  }

  .nav-button:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .nav-button.prev {
    left: 20px;
  }

  .nav-button.next {
    right: 20px;
  }

  .indicators {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .indicator.active {
    background: #b89968;
    border-color: #b89968;
    width: 12px;
  }

  .indicator:hover {
    border-color: #ffffff;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .carousel-container {
      height: 250px;
    }

    .slide-title {
      font-size: 24px;
    }

    .slide-description {
      font-size: 14px;
    }

    .nav-button {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .nav-button.prev {
      left: 10px;
    }

    .nav-button.next {
      right: 10px;
    }
  }

  /* Static Fallback Hero Styles */
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(135deg, #f5f1ed 0%, #ede8e2 100%);
    padding: 40px 20px;
  }

  .hero-content {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
  }

  .hero-text {
    flex: 1;
  }

  .hero-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 2px;
    color: #b89968;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .hero-title {
    font-size: 72px;
    font-weight: 300;
    letter-spacing: 2px;
    color: #1a1a1a;
    margin: 0 0 24px;
    font-family: 'Playfair Display', serif;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0 0 32px;
    font-weight: 300;
  }

  .cta-button {
    background: #1a1a1a;
    color: #ffffff;
    border: none;
    padding: 16px 40px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cta-button:hover {
    background: #333;
  }

  .hero-image {
    flex: 1;
    min-width: 0;
  }

  .hero-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .hero-indicators {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
  }

  .hero-indicators .indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(26, 26, 26, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .hero-indicators .indicator.active {
    background: #b89968;
    width: 24px;
    border-radius: 5px;
  }

  @media (max-width: 768px) {
    .hero {
      min-height: auto;
      padding: 40px 20px;
    }

    .hero-content {
      flex-direction: column;
      gap: 30px;
    }

    .hero-title {
      font-size: 40px;
    }

    .hero-subtitle {
      font-size: 14px;
    }

    .hero-indicators {
      bottom: 20px;
      gap: 8px;
    }
  }
</style>
