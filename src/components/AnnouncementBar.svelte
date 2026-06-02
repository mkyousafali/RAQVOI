<script lang="ts">
</script>

<header class="announcement-bar">
  <div class="announcement-content">
    <div class="left">
      <span>FREE SHIPPING ON ORDERS ABOVE ₹1999</span>
    </div>
    <div class="right">
      <a href="#store">Store Locator</a>
      <span class="divider">|</span>
      <a href="#track">Track Order</a>
      <span class="divider">|</span>
      <a href="#help">Help</a>
      <span class="divider">|</span>
      <button class="region-select">India (IN)</button>
    </div>
  </div>
  <div class="mobile-announcement">
    <span>FREE SHIPPING ON ORDERS ABOVE ₹1999</span>
    <span class="divider-mobile">|</span>
    <span>EASY RETURNS</span>
  </div>
</header>

<style>
  .announcement-bar {
    background-color: #1a1a1a;
    color: #ffffff;
    padding: 0;
  }

  .announcement-content {
    display: none;
    justify-content: space-between;
    align-items: center;
    padding: 8px 40px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .mobile-announcement {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    gap: 4px;
  }

  .left {
    flex: 1;
  }

  .right {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  a {
    color: #ffffff;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.3s;
  }

  a:hover {
    opacity: 0.8;
  }

  .divider,
  .divider-mobile {
    color: #666;
  }

  .region-select {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    padding: 0;
    transition: opacity 0.3s;
  }

  .region-select:hover {
    opacity: 0.8;
  }

  @media (min-width: 768px) {
    .announcement-content {
      display: flex;
    }

    .mobile-announcement {
      display: none;
    }
  }
</style>
