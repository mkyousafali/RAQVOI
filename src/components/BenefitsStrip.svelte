<script lang="ts">
</script>

<section class="benefits-strip">
  <div class="benefits-container">
    <div class="benefit-item">
      <div class="benefit-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
      </div>
      <div class="benefit-text">
        <p class="benefit-title">FREE SHIPPING</p>
        <p class="benefit-desc">ON ORDERS ABOVE ₹1999</p>
      </div>
    </div>

    <div class="benefit-item">
      <div class="benefit-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11H7a4 4 0 0 0-4 4v7h20v-7a4 4 0 0 0-4-4h-2m0-4h6m-6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
        </svg>
      </div>
      <div class="benefit-text">
        <p class="benefit-title">EASY RETURNS</p>
        <p class="benefit-desc">WITHIN 7 DAYS</p>
      </div>
    </div>

    <div class="benefit-item">
      <div class="benefit-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
        </svg>
      </div>
      <div class="benefit-text">
        <p class="benefit-title">SECURE PAYMENTS</p>
        <p class="benefit-desc">100% SAFE</p>
      </div>
    </div>

    <div class="benefit-item">
      <div class="benefit-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </div>
      <div class="benefit-text">
        <p class="benefit-title">CUSTOMER CARE</p>
        <p class="benefit-desc">+91 98765 43210</p>
      </div>
    </div>
  </div>
</section>

<style>
  .benefits-strip {
    display: flex;
    background-color: #ffffff;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    padding: 24px 20px;
  }

  .benefits-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  .benefit-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .benefit-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    color: #1a1a1a;
  }

  .benefit-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .benefit-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #1a1a1a;
    margin: 0;
    text-transform: uppercase;
  }

  .benefit-desc {
    font-size: 10px;
    color: #666;
    margin: 0;
    font-weight: 400;
    letter-spacing: 0.3px;
  }

  @media (min-width: 768px) {
    .benefits-strip {
      display: none;
    }
  }
</style>
