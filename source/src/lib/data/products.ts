export type Category = 'Kurta sets' | 'Dresses' | 'Occasionwear' | 'Everyday';
export interface Product { id: string; name: string; category: Category; price: number; originalPrice?: number; image: string; color: string; colors: string[]; sizes: string[]; fabric: string; badge?: string; description: string; details: string[]; }
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const make = (id: string, name: string, category: Category, price: number, image: string, color: string, fabric: string, originalPrice?: number, badge?: string): Product => ({ id, name, category, price: price * 10, originalPrice: originalPrice ? originalPrice * 10 : undefined, image: `assets/${image}.png`, color, colors: [color], sizes, fabric, badge, description: `The ${name} brings a considered touch to your wardrobe. An Indian-inspired silhouette with thoughtful detailing, made for your own way of dressing.`, details: ['Includes the pieces shown in the concept image', 'Relaxed, comfortable silhouette', 'Product photography is illustrative; this is a sample product', 'Demo catalogue — not available for purchase'] });
export const products: Product[] = [
 make('emerald-noor', 'Noor Embroidered Anarkali', 'Occasionwear', 329, 'emerald', 'Emerald', 'Viscose silk blend', 429, 'Bestseller'),
 make('rose-meher', 'Meher Rose Kurta Set', 'Kurta sets', 249, 'rose', 'Dusty rose', 'Cotton blend', 299, 'New'),
 make('ivory-aara', 'Aara Ivory Three-Piece Set', 'Kurta sets', 289, 'ivory', 'Ivory', 'Cotton silk', undefined, 'New'),
 make('blue-inaya', 'Inaya Sapphire Kurta Set', 'Kurta sets', 279, 'blue', 'Sapphire', 'Viscose blend', 349),
 make('wine-zoya', 'Zoya Festive Anarkali', 'Occasionwear', 389, 'wine', 'Wine', 'Viscose silk blend', 489, 'Occasion edit'),
 make('sage-tara', 'Tara Printed Cotton Set', 'Everyday', 179, 'sage', 'Sage', 'Cotton', 229, 'Bestseller'),
 make('emerald-saira', 'Saira Heritage Dress', 'Dresses', 299, 'emerald', 'Emerald', 'Viscose silk blend', undefined, 'New'),
 make('rose-gul', 'Gul Embroidered Day Dress', 'Dresses', 219, 'rose', 'Dusty rose', 'Cotton blend', 269),
 make('ivory-sana', 'Sana Everyday Set', 'Everyday', 199, 'ivory', 'Ivory', 'Cotton silk', 249),
 make('blue-nila', 'Nila Evening Silhouette', 'Dresses', 319, 'blue', 'Sapphire', 'Viscose blend', 399, 'Occasion edit'),
 make('wine-reva', 'Reva Celebration Set', 'Occasionwear', 359, 'wine', 'Wine', 'Viscose silk blend', undefined, 'New'),
 make('sage-isha', 'Isha Weekend Kurta Set', 'Everyday', 159, 'sage', 'Sage', 'Cotton', 199)
];
export const categories: Category[] = ['Kurta sets', 'Dresses', 'Occasionwear', 'Everyday'];
export const colorHex: Record<string, string> = { Emerald: '#165442', 'Dusty rose': '#c38b98', Ivory: '#eee4cd', Sapphire: '#244f80', Wine: '#702c45', Sage: '#a0b09b' };
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

