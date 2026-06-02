<script lang="ts">
  import { login } from '../../lib/adminStore';

  let username = '';
  let password = '';
  let quickAccessCode = '';
  let error = '';
  let isLoading = false;
  let loginMethod: 'credentials' | 'quickaccess' = 'credentials';

  async function handleLogin() {
    isLoading = true;
    error = '';

    try {
      if (loginMethod === 'credentials') {
        const result = await login(username, password);
        if (!result.success) {
          error = result.error || 'Invalid username or password';
        }
      } else {
        const result = await login('', '', quickAccessCode);
        if (!result.success) {
          error = result.error || 'Invalid quick access code';
        }
      }
    } catch (e) {
      error = 'Login failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo-section">
      <h1>RAQVOI</h1>
      <p>Admin Panel</p>
    </div>

    <div class="login-tabs">
      <button
        class="tab {loginMethod === 'credentials' ? 'active' : ''}"
        on:click={() => (loginMethod = 'credentials')}
      >
        Credentials
      </button>
      <button
        class="tab {loginMethod === 'quickaccess' ? 'active' : ''}"
        on:click={() => (loginMethod = 'quickaccess')}
      >
        Quick Access
      </button>
    </div>

    {#if loginMethod === 'credentials'}
      <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            placeholder="Enter username"
            disabled={isLoading}
            on:keypress={handleKeyPress}
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="Enter password"
            disabled={isLoading}
            on:keypress={handleKeyPress}
          />
        </div>

        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <button type="submit" class="login-btn" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    {:else}
      <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
          <label for="quickaccess">Quick Access Code</label>
          <input
            id="quickaccess"
            type="text"
            bind:value={quickAccessCode}
            placeholder="Enter code"
            disabled={isLoading}
            on:keypress={handleKeyPress}
          />
        </div>

        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <button type="submit" class="login-btn" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    {/if}

    <div class="footer-text">
      <p>© 2026 RAQVOI. All rights reserved.</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary-black) 0%, #2a2a2a 100%);
    font-family: var(--sans);
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 48px 32px;
    background: var(--white);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .logo-section {
    text-align: center;
    margin-bottom: 40px;
  }

  .logo-section h1 {
    font-family: var(--serif);
    font-size: 36px;
    font-weight: 700;
    color: var(--primary-black);
    margin: 0 0 8px 0;
    letter-spacing: 2px;
  }

  .logo-section p {
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--primary-gold);
    margin: 0;
  }

  .login-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 32px;
    border-bottom: 2px solid #e0e0e0;
  }

  .tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    color: #999;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }

  .tab:hover {
    color: var(--primary-black);
  }

  .tab.active {
    color: var(--primary-black);
    border-bottom-color: var(--primary-gold);
  }

  .form-group {
    margin-bottom: 24px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--primary-black);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 12px;
    margin-bottom: 16px;
    background-color: #fee;
    color: #c33;
    border-left: 4px solid #c33;
    font-size: 13px;
    border-radius: 2px;
  }

  .login-btn {
    width: 100%;
    padding: 12px 16px;
    background-color: var(--primary-black);
    color: var(--white);
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .login-btn:hover:not(:disabled) {
    background-color: var(--primary-gold);
    color: var(--primary-black);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .footer-text {
    text-align: center;
    margin-top: 32px;
    font-size: 12px;
    color: #999;
  }

  .footer-text p {
    margin: 0;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 32px 24px;
    }

    .logo-section h1 {
      font-size: 28px;
    }
  }
</style>
