<script lang="ts">
 import { onMount } from 'svelte';import Checkout from '../../pages/Checkout.svelte';import { customerApi,type CustomerSession } from '../customer';
 let allowed=$state(false),loading=$state(true),error=$state('');
 onMount(()=>{customerApi<CustomerSession>('session').then(s=>allowed=!!(s.email&&s.profile)).catch(e=>error=e.message).finally(()=>loading=false);});
</script>
{#if loading}<section class="empty-state"><p role="status">Checking your account…</p></section>{:else if allowed}<Checkout/>{:else}<section class="empty-state"><h1>{error?'Account service unavailable':'Sign in to continue.'}</h1><p>{error||'Verify your email and complete your profile before checkout.'}</p><a class="button dark" href="#/account?next=checkout">Go to your account</a><p>Checkout remains a demonstration while order management is being built.</p></section>{/if}
