export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  isNew: boolean;
}

export interface Category {
  name: string;
  image: string;
  href: string;
}

export interface Collection {
  name: string;
  image: string;
}
