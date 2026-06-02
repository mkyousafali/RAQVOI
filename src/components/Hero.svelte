<script lang="ts">
  let activeSlide = 0;

  function goToSlide(index: number) {
    activeSlide = index;
  }
</script>

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
        class="indicator {activeSlide === index ? 'active' : ''}"
        on:click={() => goToSlide(index)}
        aria-label="Go to slide {index + 1}"
      ></button>
    {/each}
  </div>
</section>

<style>
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
    display: flex;
    flex-direction: column;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    gap: 30px;
    align-items: center;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    order: 2;
  }

  .hero-image {
    width: 100%;
    max-width: 500px;
    order: 1;
  }

  .hero-image img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 2px;
  }

  .hero-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 2px;
    color: #b89968;
    text-transform: uppercase;
  }

  .hero-title {
    font-size: 48px;
    font-weight: 300;
    letter-spacing: 2px;
    line-height: 1.2;
    color: #1a1a1a;
    margin: 0;
    font-family: 'Playfair Display', serif;
  }

  .hero-subtitle {
    font-size: 14px;
    color: #666;
    font-weight: 400;
    letter-spacing: 0.5px;
    margin: 0;
  }

  .cta-button {
    background-color: #1a1a1a;
    color: #ffffff;
    border: none;
    padding: 16px 32px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
    align-self: flex-start;
    text-transform: uppercase;
  }

  .cta-button:hover {
    background-color: #333;
    transform: translateX(4px);
  }

  .hero-indicators {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 40px;
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid #b89968;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }

  .indicator.active {
    background-color: #b89968;
  }

  @media (min-width: 768px) {
    .hero {
      min-height: 80vh;
      padding: 60px 40px;
    }

    .hero-content {
      flex-direction: row;
      gap: 60px;
      align-items: center;
    }

    .hero-text {
      flex: 1;
      order: 1;
      justify-content: flex-start;
    }

    .hero-image {
      flex: 1;
      order: 2;
      max-width: 100%;
    }

    .hero-title {
      font-size: 64px;
    }

    .hero-indicators {
      position: relative;
      bottom: auto;
      transform: none;
      margin-top: 60px;
    }
  }
</style>
