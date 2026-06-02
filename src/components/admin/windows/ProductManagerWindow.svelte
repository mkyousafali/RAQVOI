<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../lib/supabaseClient';
  import ProductForm from '../popups/ProductForm.svelte';
  import CategoryManager from '../popups/CategoryManager.svelte';

  interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    image: string;
    is_active: boolean;
    created_at: string;
  }

  interface Category {
    id: number;
    name: string;
    image: string;
  }

  let products: Product[] = [];
  let categories: Category[] = [];
  let loading = true;
  let showProductForm = false;
  let showCategoryManager = false;
  let editingProduct: Product | null = null;

  async function loadProducts() {
    try {
      // For now, use data from the main site
      // Later we can create a products table in Supabase
      const { products: mainProducts } = await import('../../../lib/data');
      products = mainProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: 'DRESSES', // Default category
        price: p.price,
        image: p.image,
        is_active: true,
        created_at: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      loading = false;
    }
  }

  async function loadCategories() {
    try {
      const { categories: mainCategories } = await import('../../../lib/data');
      categories = mainCategories.map((c: any, idx: number) => ({
        id: idx + 1,
        name: c.name,
        image: c.image,
      }));
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  function handleProductAdded() {
    showProductForm = false;
    editingProduct = null;
    loadProducts();
  }

  function handleEditProduct(product: Product) {
    editingProduct = product;
    showProductForm = true;
  }

  async function handleDeleteProduct(product: Product) {
    if (!confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    try {
      products = products.filter(p => p.id !== product.id);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  }

  function handleCategoriesUpdated() {
    showCategoryManager = false;
    loadCategories();
  }

  onMount(() => {
    loadProducts();
    loadCategories();
  });
</script>

<div class="product-manager-window">
  <div class="tabs">
    <button class="tab active">Products</button>
    <button class="tab">Categories</button>
  </div>

  <div class="tab-content">
    <div class="products-tab">
      <div class="header">
        <h3>Product Management</h3>
        <div class="buttons-group">
          <button class="btn-role btn-add" on:click={() => { editingProduct = null; showProductForm = true; }}>
            ➕ Add Product
          </button>
          <button class="btn-role btn-categories" on:click={() => showCategoryManager = true}>
            📁 Manage Categories
          </button>
        </div>
      </div>

      {#if loading}
        <div class="loading">Loading products...</div>
      {:else}
        <div class="table-wrapper">
          <table class="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Image</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each products as product (product.id)}
                <tr>
                  <td class="product-name">{product.name}</td>
                  <td class="category">{product.category}</td>
                  <td class="price">₹{product.price.toLocaleString()}</td>
                  <td class="image">
                    <img src={product.image} alt={product.name} />
                  </td>
                  <td class="status">
                    <span class="badge {product.is_active ? 'active' : 'inactive'}">
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="created">{new Date(product.created_at).toLocaleDateString()}</td>
                  <td class="actions">
                    <button class="btn-edit" on:click={() => handleEditProduct(product)}>Edit</button>
                    <button class="btn-delete" on:click={() => handleDeleteProduct(product)}>Delete</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if showProductForm}
          <ProductForm 
            editingProduct={editingProduct}
            {categories}
            on:close={() => { showProductForm = false; editingProduct = null; }}
            on:success={handleProductAdded}
          />
        {/if}

        {#if showCategoryManager}
          <CategoryManager
            {categories}
            on:close={() => showCategoryManager = false}
            on:success={handleCategoriesUpdated}
          />
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .product-manager-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    background: var(--white);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #eee;
    background: #f9f9f9;
  }

  .tab {
    flex: 1;
    padding: 12px 16px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #666;
    transition: all 0.2s ease;
  }

  .tab.active {
    color: var(--primary-gold);
    border-bottom-color: var(--primary-gold);
  }

  .tab-content {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }

  .products-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .header h3 {
    margin: 0;
    font-size: 18px;
    color: var(--primary-black);
  }

  .buttons-group {
    display: flex;
    gap: 8px;
  }

  .btn-role {
    padding: 8px 12px;
    border: 1px solid var(--primary-gold);
    background: transparent;
    color: var(--primary-gold);
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-role:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: var(--primary-gold);
  }

  .btn-add {
    border-color: #4CAF50;
    color: #4CAF50;
  }

  .btn-add:hover {
    background: rgba(76, 175, 80, 0.1);
  }

  .btn-categories {
    border-color: #2196F3;
    color: #2196F3;
  }

  .btn-categories:hover {
    background: rgba(33, 150, 243, 0.1);
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    border: 1px solid #eee;
    border-radius: 4px;
  }

  .products-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .products-table thead,
  .products-table th {
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .products-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: var(--primary-black);
  }

  .products-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  .products-table tr:hover {
    background: #fafafa;
  }

  .product-name {
    font-weight: 600;
    color: var(--primary-black);
  }

  .category {
    color: #666;
  }

  .price {
    font-weight: 600;
    color: var(--primary-gold);
  }

  .image {
    text-align: center;
  }

  .image img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 3px;
  }

  .status {
    text-align: center;
  }

  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .badge.active {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .badge.inactive {
    background: #ffebee;
    color: #c62828;
  }

  .created {
    color: #999;
    font-size: 12px;
  }

  .actions {
    display: flex;
    gap: 8px;
    white-space: nowrap;
  }

  .btn-edit,
  .btn-delete {
    padding: 4px 8px;
    border: 1px solid #ddd;
    background: var(--white);
    cursor: pointer;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-edit {
    color: #2196F3;
    border-color: #2196F3;
  }

  .btn-edit:hover {
    background: rgba(33, 150, 243, 0.1);
  }

  .btn-delete {
    color: #f44336;
    border-color: #f44336;
  }

  .btn-delete:hover {
    background: rgba(244, 67, 54, 0.1);
  }
</style>
