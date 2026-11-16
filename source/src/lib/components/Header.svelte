<script lang="ts">
 import { Search, Heart, ShoppingBag, UserRound, Menu, X } from 'lucide-svelte';
 import { cartCount, wishlist } from '../stores/commerce';
 import { navigate, route } from '../stores/router';
 import { onMount } from 'svelte';
 import { customerApi, customerSession, type CustomerSession } from '../customer';
 onMount(() => { customerApi<CustomerSession>('session').then(session => customerSession.set(session)).catch(() => customerSession.set({ email: null, profile: null, adminState: null })); });
 let mobile = $state(false); let searchOpen = $state(false); let query = $state('');
 function search(event: SubmitEvent) { event.preventDefault(); navigate(`/shop?q=${encodeURIComponent(query.trim())}`); searchOpen = false; mobile = false; }
</script>
<style>
 .mobile-account-nav{display:none}
 .announcement{background:linear-gradient(105deg,#183b34 0%,#254b3c 52%,#362f36 100%);color:#faf4e9;border-bottom:1px solid #d7bb8640}
 .announcement>a{border-radius:999px;padding:5px 12px;background:#ffffff12;border:1px solid #ffffff22;transition:background .2s ease,border-color .2s ease}
 .announcement>a:hover{background:#ffffff26;border-color:#ead5b17d}
 .announcement-email{font-weight:600}
 .site-header{background:var(--paper);color:#252a25;border-bottom:1px solid #203c3215;box-shadow:0 5px 22px #4d3b2910}
 .site-header nav{gap:7px}
 .site-header nav a{padding:10px 13px;border-radius:999px;transition:background .2s ease,color .2s ease}
 .site-header nav a:hover{background:#e8e4da;color:#173e34}
 .site-header nav a.active{background:#eee6d6;color:#193e34}
 .site-header nav a:after{display:none}
 .header-actions .icon-button,.mobile-menu{width:35px;height:35px;border:1px solid #dacdbd80;border-radius:50%;background:#ffffff6b;transition:background .2s ease,border-color .2s ease,transform .2s ease}
 .header-actions .icon-button:hover,.mobile-menu:hover{background:#f0e9df;border-color:#b99b74;transform:translateY(-1px)}
 .header-actions .icon-button b{background:#8d5a66;border:2px solid #fbf9f4;top:-7px;right:-7px;min-width:17px;height:17px;font-size:8px}
 .site-header :is(a,button):focus-visible,.announcement a:focus-visible,.search-panel :is(a,button,input):focus-visible{outline:2px solid #a97939;outline-offset:3px}
 .search-panel{background:#fbf9f4;box-shadow:0 18px 35px #2d362027;border-top:1px solid #e6d7c0}
 .search-panel input{background:transparent}
 @media(max-width:1100px){.site-header nav a{padding:8px 7px}.site-header nav{gap:2px}}
 @media(max-width:800px){.mobile-account-nav{display:block}.site-header nav a{border-radius:10px;padding:11px 12px}.site-header nav a.active{background:#eee6d6}.header-actions .icon-button,.mobile-menu{width:32px;height:32px}.site-header nav{gap:4px}}
 @media(max-width:540px){.announcement>a{padding:4px 9px}.header-actions .icon-button,.mobile-menu{width:30px;height:30px}}
 @media(prefers-reduced-motion:reduce){.site-header nav a,.header-actions .icon-button,.mobile-menu,.announcement>a{transition:none}}
</style>
<div class="site-top" class:shop-page={$route.startsWith('/shop')}>
<div class="announcement"><span>HER STYLE. HER STORY.</span>{#if $customerSession.email}<a href="#/account" class="announcement-email" title={$customerSession.email}>Signed in as {$customerSession.email}</a>{:else}<a href="#/account">Sign in for personalized offers <span>↗</span></a>{/if}<span>COMPLIMENTARY DEMO DELIVERY OVER ₹3,500</span></div>
<header class="site-header"><button class="icon-button mobile-menu" aria-label="Open menu" onclick={() => mobile = !mobile}><Menu size={22}/></button><a href="#/" class="brand" aria-label="RAQVOI home"><img src="assets/brand/logo.png" alt="RAQVOI"/></a><nav class:mobile-open={mobile} aria-label="Main navigation"><a class:active={$route==='/'} onclick={() => mobile = false} href="#/">Home</a><a class:active={$route.startsWith('/shop')} onclick={() => mobile = false} href="#/shop">Shop all</a><a onclick={() => mobile = false} href="#/shop?edit=new">New arrivals</a><a onclick={() => mobile = false} href="#/shop?category=Occasionwear">Occasionwear</a><a onclick={() => mobile = false} href="#/offers">The offers edit</a><a onclick={() => mobile = false} href="#/story">Our story</a><a class="mobile-account-nav" onclick={() => mobile = false} href="#/account">My account</a></nav><div class="header-actions"><button class="icon-button" aria-label="Search products" onclick={() => searchOpen = !searchOpen}>{#if searchOpen}<X size={20}/>{:else}<Search size={20}/>{/if}</button><a class="icon-button account-link" href="#/account" aria-label="Your account"><UserRound size={20}/></a><a class="icon-button" href="#/wishlist" aria-label={`Wishlist, ${$wishlist.length} items`}><Heart size={20}/>{#if $wishlist.length}<b>{$wishlist.length}</b>{/if}</a><a class="icon-button" href="#/bag" aria-label={`Shopping bag, ${$cartCount} items`}><ShoppingBag size={20}/><b>{$cartCount}</b></a></div></header>
{#if searchOpen}<div class="search-panel"><form onsubmit={search}><Search size={20}/><label class="sr-only" for="header-search">Search products</label><input id="header-search" bind:value={query} placeholder="Try emerald, cotton, kurta…"/><button class="button dark" type="submit">Search</button></form><div class="search-suggestions">A little inspiration: <a href="#/shop?category=Kurta%20sets" onclick={() => searchOpen = false}>Kurta sets</a><a href="#/shop?q=emerald" onclick={() => searchOpen = false}>Emerald greens</a><a href="#/shop?edit=sale" onclick={() => searchOpen = false}>Sale favourites</a></div></div>{/if}
</div>
