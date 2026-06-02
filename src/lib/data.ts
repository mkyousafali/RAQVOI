import type { Product, Category, Collection } from './types';

export const products: Product[] = [
  {
    id: 1,
    name: 'Embroidered Anarkali',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1626577174025-01fb8d3a4bfe?w=400&h=500&fit=crop',
    isNew: true,
  },
  {
    id: 2,
    name: 'Embroidered Kurta Set',
    price: 2699,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop',
    isNew: true,
  },
  {
    id: 3,
    name: 'Floral Printed Dress',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1612336307429-8a88e8d08dbb?w=400&h=500&fit=crop',
    isNew: true,
  },
  {
    id: 4,
    name: 'Premium Co-ord Set',
    price: 3299,
    image: 'https://images.unsplash.com/photo-1595777707802-52317d826dcd?w=400&h=500&fit=crop',
    isNew: true,
  },
  {
    id: 5,
    name: 'Elegant Ethnic Wear',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1617896398562-f3c4baf27fbc?w=400&h=500&fit=crop',
    isNew: true,
  },
];

export const categories: Category[] = [
  {
    name: 'DRESSES',
    image: 'https://images.unsplash.com/photo-1595607774223-ef52624120d2?w=300&h=300&fit=crop',
    href: '#dresses',
  },
  {
    name: 'ETHNIC WEAR',
    image: 'https://images.unsplash.com/photo-1617896398562-f3c4baf27fbc?w=300&h=300&fit=crop',
    href: '#ethnic',
  },
  {
    name: 'TOPS',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop',
    href: '#tops',
  },
  {
    name: 'CO-ORD SETS',
    image: 'https://images.unsplash.com/photo-1595777707802-52317d826dcd?w=300&h=300&fit=crop',
    href: '#coords',
  },
  {
    name: 'SALE',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop',
    href: '#sale',
  },
];

export const collections: Collection[] = [
  {
    name: 'FESTIVE EDIT',
    image: 'https://images.unsplash.com/photo-1626577174025-01fb8d3a4bfe?w=400&h=500&fit=crop',
  },
  {
    name: 'EVERYDAY',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
  },
  {
    name: 'WORKWEAR',
    image: 'https://images.unsplash.com/photo-1595607774223-ef52624120d2?w=400&h=500&fit=crop',
  },
];
