<script lang="ts">
 import { Heart, ArrowUpRight } from 'lucide-svelte';
 import type { Product } from '../data/products';
 import { money, colorHex } from '../data/products';
 import { wishlist, toggleWishlist, notify } from '../stores/commerce';
 let { product }: { product: Product } = $props();
</script>
<article class="product-card">
 <div class="product-photo"><a href={`#/product/${product.id}`} aria-label={`View ${product.name}`}><img src={product.image} alt={`${product.name} in ${product.color}`} loading="lazy" /></a>
 {#if product.badge}<span class:badge-sale={product.originalPrice} class="product-badge">{product.badge}</span>{/if}
 <button class:hearted={$wishlist.includes(product.id)} class="wish-button" aria-label={`${$wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name} ${$wishlist.includes(product.id) ? 'from' : 'to'} wishlist`} aria-pressed={$wishlist.includes(product.id)} onclick={() => { toggleWishlist(product.id); notify($wishlist.includes(product.id) ? 'Saved to your wishlist' : 'Removed from wishlist'); }}><Heart size={17} fill={$wishlist.includes(product.id) ? 'currentColor' : 'none'}/></button>
 <a class="quick-view" href={`#/product/${product.id}`}>CHOOSE YOUR SIZE <ArrowUpRight size={14}/></a></div>
 <div class="product-meta"><span>{product.category}</span><span class="color-dot" style={`background:${colorHex[product.color]}`} title={product.color}></span></div>
 <h3><a href={`#/product/${product.id}`}>{product.name}</a></h3><div class="price"><strong>{money(product.price)}</strong>{#if product.originalPrice}<s>{money(product.originalPrice)}</s><span class="saving">−{Math.round((1-product.price/product.originalPrice)*100)}%</span>{/if}</div>
</article>
