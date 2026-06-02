import { supabase } from './supabaseClient';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  collection_id?: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  is_new: boolean;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all categories using RPC
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_categories');

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in getCategories:', err);
    return [];
  }
}

/**
 * Fetch all products using RPC
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_products');

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in getProducts:', err);
    return [];
  }
}

/**
 * Fetch products by category using RPC
 */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase.rpc('get_products_by_category', {
      cat_id: categoryId
    });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in getProductsByCategory:', err);
    return [];
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in createProduct:', err);
    throw err;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in updateProduct:', err);
    throw err;
  }
}

/**
 * Delete a product (soft delete - mark as inactive)
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    throw err;
  }
}

/**
 * Create a new category
 */
export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in createCategory:', err);
    throw err;
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in updateCategory:', err);
    throw err;
  }
}

/**
 * Delete a category (only if no products use it)
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    // Check if any products use this category
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('category_id', id);

    if (countError) {
      throw new Error(`Failed to check category usage: ${countError.message}`);
    }

    if (count && count > 0) {
      throw new Error('Cannot delete category that has products. Move products first.');
    }

    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in deleteCategory:', err);
    throw err;
  }
}

/**
 * Fetch all collections using RPC
 */
export async function getCollections(): Promise<Collection[]> {
  try {
    console.log('📡 Calling get_all_collections RPC...');
    const { data, error } = await supabase.rpc('get_all_collections');

    console.log('📊 RPC Response:', { data, error });

    if (error) {
      console.error('❌ RPC Error fetching collections:', error);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    console.log('✅ Collections fetched:', data);
    return data || [];
  } catch (err) {
    console.error('❌ Error in getCollections:', err);
    return [];
  }
}

/**
 * Create a new collection
 */
export async function createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert([collection])
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in createCollection:', err);
    throw err;
  }
}

/**
 * Update an existing collection
 */
export async function updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      throw new Error(`Failed to update collection: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in updateCollection:', err);
    throw err;
  }
}

/**
 * Delete a collection (only if no products use it)
 */
export async function deleteCollection(id: string): Promise<void> {
  try {
    // Check if any products use this collection
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('collection_id', id);

    if (countError) {
      throw new Error(`Failed to check collection usage: ${countError.message}`);
    }

    if (count && count > 0) {
      throw new Error('Cannot delete collection that has products. Move products first.');
    }

    // Delete the collection
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting collection:', error);
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in deleteCollection:', err);
    throw err;
  }
}

/**
 * Fetch products by collection using RPC
 */
export async function getProductsByCollection(collectionId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase.rpc('get_products_by_collection', {
      col_id: collectionId
    });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in getProductsByCollection:', err);
    return [];
  }
}

/**
 * Hero Image Interface
 */
export interface HeroImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all active hero images using RPC
 */
export async function getHeroImages(): Promise<HeroImage[]> {
  try {
    const { data, error } = await supabase.rpc('get_hero_images');

    if (error) {
      console.error('Error fetching hero images:', error);
      throw new Error(`Failed to fetch hero images: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in getHeroImages:', err);
    return [];
  }
}

/**
 * Create a new hero image
 */
export async function createHeroImage(
  imageUrl: string,
  title?: string,
  description?: string,
  displayOrder: number = 0
): Promise<HeroImage> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .insert({
        image_url: imageUrl,
        title,
        description,
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hero image:', error);
      throw new Error(`Failed to create hero image: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in createHeroImage:', err);
    throw err;
  }
}

/**
 * Update a hero image
 */
export async function updateHeroImage(
  id: string,
  updates: Partial<HeroImage>
): Promise<HeroImage> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating hero image:', error);
      throw new Error(`Failed to update hero image: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in updateHeroImage:', err);
    throw err;
  }
}

/**
 * Delete a hero image
 */
export async function deleteHeroImage(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('hero_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting hero image:', error);
      throw new Error(`Failed to delete hero image: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in deleteHeroImage:', err);
    throw err;
  }
}
