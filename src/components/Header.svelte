<script lang="ts">
  let mobileMenuOpen = false;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
</script>

<nav class="navbar">
  <div class="nav-content">
    <div class="nav-left">
      <button class="hamburger" on:click={toggleMobileMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <a href="#" class="logo-desktop">RAQVOI</a>
    </div>

    <a href="#" class="logo-mobile">RAQVOI</a>

    <ul class="nav-menu {mobileMenuOpen ? 'active' : ''}">
      <li><a href="#new">NEW IN</a></li>
      <li class="dropdown">
        <a href="#clothing">CLOTHING</a>
        <div class="dropdown-menu">
          <a href="#clothing/dresses">Dresses</a>
          <a href="#clothing/tops">Tops</a>
          <a href="#clothing/sets">Co-ord Sets</a>
        </div>
      </li>
      <li><a href="#dresses">DRESSES</a></li>
      <li><a href="#ethnic">ETHNIC WEAR</a></li>
      <li><a href="#collections">COLLECTIONS</a></li>
      <li><a href="#sale">SALE</a></li>
      <li><a href="#about">ABOUT</a></li>
    </ul>

    <div class="nav-icons">
      <a href="#search" class="icon search-icon" title="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </a>
      <a href="#account" class="icon user-icon" title="Account">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </a>
      <a href="#wishlist" class="icon wishlist-icon" title="Wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </a>
      <a href="#cart" class="icon cart-icon" title="Cart">
        <span class="cart-badge">0</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      </a>
    </div>
  </div>
</nav>

<style>
  .navbar {
    background-color: #ffffff;
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 20px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 30px;
    flex: 0 0 auto;
  }

  .logo-desktop {
    display: none;
    font-size: 20px;
    font-weight: 300;
    letter-spacing: 3px;
    color: #000;
    text-decoration: none;
    white-space: nowrap;
  }

  .logo-mobile {
    display: flex;
    flex: 1;
    justify-content: center;
    font-size: 18px;
    font-weight: 300;
    letter-spacing: 2px;
    color: #000;
    text-decoration: none;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 24px;
  }

  .hamburger span {
    width: 24px;
    height: 2px;
    background-color: #000;
    transition: all 0.3s ease;
  }

  .nav-menu {
    display: none;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 30px;
    flex: 1;
    justify-content: center;
  }

  .nav-menu li {
    position: relative;
  }

  .nav-menu a {
    color: #000;
    text-decoration: none;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    transition: opacity 0.3s;
  }

  .nav-menu a:hover {
    opacity: 0.6;
  }

  .dropdown {
    position: relative;
  }

  .dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: #ffffff;
    border: 1px solid #f0f0f0;
    padding: 10px 0;
    min-width: 150px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .dropdown-menu a {
    display: block;
    padding: 10px 16px;
    font-size: 12px;
    color: #000;
  }

  .dropdown:hover .dropdown-menu {
    display: block;
  }

  .nav-icons {
    display: flex;
    gap: 16px;
    align-items: center;
    flex: 0 0 auto;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #000;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.3s;
    position: relative;
  }

  .icon:hover {
    opacity: 0.6;
  }

  .cart-icon {
    position: relative;
  }

  .cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #d4af37;
    color: #000;
    font-size: 10px;
    font-weight: 700;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .navbar {
      padding: 20px 40px;
    }

    .nav-left {
      gap: 50px;
    }

    .logo-desktop {
      display: block;
    }

    .logo-mobile {
      display: none;
    }

    .hamburger {
      display: none;
    }

    .nav-menu {
      display: flex;
    }

    .nav-menu.active {
      display: flex;
    }
  }
</style>
