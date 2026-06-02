<script lang="ts">
  import { isAdminLoggedIn } from '../../lib/adminStore';
  import AdminLogin from './AdminLogin.svelte';
  import AdminLayout from './AdminLayout.svelte';
</script>

{#if $isAdminLoggedIn}
  <AdminLayout />
{:else}
  <AdminLogin />
{/if}
