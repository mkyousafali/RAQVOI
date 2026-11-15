import { writable, derived, get } from 'svelte/store';
import { products } from '../data/products';
export interface CartItem { productId: string; size: string; color: string; quantity: number; }
export interface DemoOrder { id: string; date: string; name: string; email: string; city: string; items: CartItem[]; subtotal: number; discount: number; shipping: number; total: number; }
function read<T>(key: string, fallback: T, validate: (v: unknown) => boolean): T { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return validate(value) ? value : fallback; } catch { return fallback; } }
function persisted<T>(key: string, initial: T, validate: (v: unknown) => boolean) { const store = writable<T>(read(key, initial, validate)); store.subscribe(value => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser storage may be disabled. */ } }); return store; }
const validCart = (v: unknown) => Array.isArray(v) && v.every(i => i && typeof i.productId === 'string' && products.some(p => p.id === i.productId && p.sizes.includes(i.size) && p.colors.includes(i.color)) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 10);
export const cart = persisted<CartItem[]>('raqvoi-cart-v1', [], validCart);
export const wishlist = persisted<string[]>('raqvoi-wishlist-v1', [], v => Array.isArray(v) && v.every(id => products.some(p => p.id === id)));
export const orders = persisted<DemoOrder[]>('raqvoi-orders-v1', [], v => Array.isArray(v) && v.every(o => o && typeof o.id === 'string' && Array.isArray(o.items) && typeof o.total === 'number'));
export const coupon = persisted<string>('raqvoi-coupon-v1', '', v => typeof v === 'string' && ['', 'HER10', 'WELCOME15'].includes(v));
export const cartCount = derived(cart, $cart => $cart.reduce((n, i) => n + i.quantity, 0));
export const totals = derived([cart, coupon], ([$cart, $coupon]) => {
 const subtotal = $cart.reduce((n, i) => n + (products.find(p => p.id === i.productId)?.price || 0) * i.quantity, 0);
 const rate = $coupon === 'WELCOME15' ? .15 : $coupon === 'HER10' ? .1 : 0;
 const discount = Math.round(subtotal * rate * 100) / 100;
 const shipping = subtotal === 0 || subtotal >= 3500 ? 0 : 99;
 return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
});
export function addToCart(productId: string, size: string, color: string, quantity = 1) { const product = products.find(p => p.id === productId); if (!product || !product.sizes.includes(size) || !product.colors.includes(color)) return; cart.update(items => { const found = items.find(i => i.productId === productId && i.size === size && i.color === color); return found ? items.map(i => i === found ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i) : [...items, { productId, size, color, quantity: Math.max(1, Math.min(10, quantity)) }]; }); }
export function setQuantity(item: CartItem, value: number) { cart.update(items => value <= 0 ? items.filter(i => !(i.productId === item.productId && i.size === item.size && i.color === item.color)) : items.map(i => i.productId === item.productId && i.size === item.size && i.color === item.color ? { ...i, quantity: Math.max(1, Math.min(10, Math.floor(value))) } : i)); }
export function toggleWishlist(id: string) { wishlist.update(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); }
export function applyCoupon(code: string) { const normalized = code.trim().toUpperCase(); if (!['HER10', 'WELCOME15'].includes(normalized)) return false; coupon.set(normalized); return true; }
export function placeDemoOrder(customer: { name: string; email: string; city: string }): DemoOrder | null { if (!get(cart).length) return null; const order: DemoOrder = { id: `RQ-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, date: new Date().toISOString(), ...customer, items: get(cart).map(i => ({ ...i })), ...get(totals) }; orders.update(list => [order, ...list]); cart.set([]); coupon.set(''); return order; }
export const toast = writable('');
let toastTimer: ReturnType<typeof setTimeout>;
export function notify(message: string) { toast.set(message); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.set(''), 3500); }

