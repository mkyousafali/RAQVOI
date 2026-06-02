<script lang="ts">
  import { onMount } from 'svelte';
  import ProductForm from '../popups/ProductForm.svelte';
  import CategoryManager from '../popups/CategoryManager.svelte';
  import HeroImageManager from '../popups/HeroImageManager.svelte';
  import { getProducts, getCategories, getCollections, deleteProduct, deleteCategory, deleteCollection, updateCategory, updateCollection, updateProduct, type Product, type Category, type Collection } from '../../../lib/productUtils';
  import { uploadImage } from '../../../lib/storageUtils';

  let products: Product[] = [];
  let categories: Category[] = [];
  let collections: Collection[] = [];
  let loading = true;
  let collectionsLoading = false;
  let error = '';
  let showProductForm = false;
  let showCategoryManager = false;
  let editingProduct: Product | null = null;
  let activeTab: 'products' | 'categories' | 'collections' | 'hero' = 'products';
  let editingCategory: Category | null = null;
  let editingCategoryName = '';
  let editingCategoryDescription = '';
  let editingCategoryImage = '';
  let editingCategoryImageFile: File | null = null;
  let editingCollection: Collection | null = null;
  let editingCollectionName = '';
  let editingCollectionDescription = '';
  let editingCollectionImage = '';
  let editingCollectionImageFile: File | null = null;

  async function loadProducts() {
    try {
      loading = true;
      error = '';
      products = await getProducts();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error loading products';
      console.error('Error loading products:', err);
    } finally {
      loading = false;
    }
  }

  async function loadCategories() {
    try {
      categories = await getCategories();
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  async function loadCollections() {
    try {
      collectionsLoading = true;
      console.log('🔄 Loading collections...');
      collections = await getCollections();
      console.log('✅ Collections loaded:', collections.length, collections);
    } catch (err) {
      console.error('Error loading collections:', err);
    } finally {
      collectionsLoading = false;
    }
  }

  function switchTab(tab: 'products' | 'categories' | 'collections' | 'hero') {
    activeTab = tab;
    if (tab === 'products') {
      loadProducts();
    } else if (tab === 'categories') {
      loadCategories();
    } else if (tab === 'collections') {
      loadCollections();
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
      await deleteProduct(product.id);
      products = products.filter(p => p.id !== product.id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error deleting product';
      console.error('Error deleting product:', err);
    }
  }

  async function handleUpdateProductCollection(productId: string, collectionId: string) {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const finalCollectionId = collectionId || null;
      await updateProduct(productId, {
        collection_id: finalCollectionId,
      });

      // Update local state
      product.collection_id = finalCollectionId as any;
      products = products; // Trigger reactivity
      console.log(`✅ Updated product collection: ${product.name}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error updating collection';
      console.error('Error updating collection:', err);
    }
  }

  function handleCategoriesUpdated() {
    showCategoryManager = false;
    loadCategories();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category?')) {
      return;
    }

    try {
      await deleteCategory(id);
      categories = categories.filter(c => c.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error deleting category';
    }
  }

  function handleEditCategory(category: Category) {
    editingCategory = category;
    editingCategoryName = category.name;
    editingCategoryDescription = category.description || '';
    editingCategoryImage = category.image_url || '';
    editingCategoryImageFile = null;
  }

  function resetEditCategory() {
    editingCategory = null;
    editingCategoryName = '';
    editingCategoryDescription = '';
    editingCategoryImage = '';
    editingCategoryImageFile = null;
  }

  function handleImageChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      editingCategoryImageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        editingCategoryImage = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveCategory() {
    if (!editingCategory || !editingCategoryName.trim()) {
      error = 'Category name is required';
      return;
    }

    try {
      loading = true;
      let imageUrl = editingCategoryImage;
      if (editingCategoryImageFile) {
        imageUrl = await uploadImage(editingCategoryImageFile, 'category-images', editingCategory.id);
      }

      const updated = await updateCategory(editingCategory.id, {
        name: editingCategoryName.toUpperCase(),
        description: editingCategoryDescription || null,
        image_url: imageUrl,
      });

      categories = categories.map(c => c.id === updated.id ? updated : c);
      resetEditCategory();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error saving category';
      console.error('Error saving category:', err);
    } finally {
      loading = false;
    }
  }

  function getCategoryName(categoryId: string): string {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Unknown';
  }

  function getCollectionName(collectionId: string | undefined): string {
    if (!collectionId) return '—';
    const col = collections.find(c => c.id === collectionId);
    return col?.name || '—';
  }

  function handleEditCollection(collection: Collection) {
    editingCollection = collection;
    editingCollectionName = collection.name;
    editingCollectionDescription = collection.description || '';
    editingCollectionImage = collection.image_url || '';
    editingCollectionImageFile = null;
  }

  function resetEditCollection() {
    editingCollection = null;
    editingCollectionName = '';
    editingCollectionDescription = '';
    editingCollectionImage = '';
    editingCollectionImageFile = null;
  }

  function handleCollectionImageChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      editingCollectionImageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        editingCollectionImage = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveCollection() {
    if (!editingCollection || !editingCollectionName.trim()) {
      error = 'Collection name is required';
      return;
    }

    try {
      loading = true;
      let imageUrl = editingCollectionImage;
      if (editingCollectionImageFile) {
        imageUrl = await uploadImage(editingCollectionImageFile, 'collection-images', editingCollection.id);
      }

      const updated = await updateCollection(editingCollection.id, {
        name: editingCollectionName.trim(),
        description: editingCollectionDescription || null,
        image_url: imageUrl,
      });

      collections = collections.map(c => c.id === updated.id ? updated : c);
      resetEditCollection();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error saving collection';
      console.error('Error saving collection:', err);
    } finally {
      loading = false;
    }
  }

  async function handleDeleteCollection(id: string) {
    if (!confirm('Delete this collection?')) {
      return;
    }

    try {
      await deleteCollection(id);
      collections = collections.filter(c => c.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error deleting collection';
    }
  }

  onMount(() => {
    loadProducts();
    loadCategories();
    loadCollections();
  });
</script>

<div class="product-manager-window">
  <div class="tabs">
    <button 
      class="tab {activeTab === 'products' ? 'active' : ''}"
      on:click={() => switchTab('products')}
    >
      Products
    </button>
    <button 
      class="tab {activeTab === 'categories' ? 'active' : ''}"
      on:click={() => switchTab('categories')}
    >
      Categories
    </button>
    <button 
      class="tab {activeTab === 'collections' ? 'active' : ''}"
      on:click={() => switchTab('collections')}
    >
      Collections
    </button>
    <button 
      class="tab {activeTab === 'hero' ? 'active' : ''}"
      on:click={() => switchTab('hero')}
    >
      Hero Section
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'products'}
      <div class="products-tab">
        <div class="header">
          <h3>Product Management</h3>
          <div class="buttons-group">
            <button class="btn-role btn-add" on:click={() => { editingProduct = null; showProductForm = true; }}>
              ➕ Add Product
            </button>
          </div>
        </div>

        {#if loading}
          <div class="loading">Loading products...</div>
        {:else if error}
          <div class="error-state">
            <p>❌ {error}</p>
            <button class="btn-retry" on:click={loadProducts}>Retry</button>
          </div>
        {:else}
          <div class="table-wrapper">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Collection</th>
                  <th>Price</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each products as product (product.id)}
                  <tr>
                    <td class="product-name">{product.name}</td>
                    <td class="category">{getCategoryName(product.category_id)}</td>
                    <td class="collection">
                      <select 
                        value={product.collection_id || ''} 
                        on:change={(e) => handleUpdateProductCollection(product.id, e.currentTarget.value)}
                        class="collection-select"
                      >
                        <option value="">— None —</option>
                        {#each collections as col}
                          <option value={col.id}>{col.name}</option>
                        {/each}
                      </select>
                    </td>
                    <td class="price">₹{product.price.toLocaleString()}</td>
                    <td class="image">
                      {#if product.image_url}
                        <img src={product.image_url} alt={product.name} />
                      {:else}
                        <span class="no-image">—</span>
                      {/if}
                    </td>
                    <td class="status">
                      <span class="badge {product.is_active ? 'active' : 'inactive'}">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="created">{new Date(product.created_at || '').toLocaleDateString()}</td>
                    <td class="actions">
                      <button class="btn-edit" on:click={() => handleEditProduct(product)}>Edit</button>
                      <button class="btn-delete" on:click={() => handleDeleteProduct(product)}>Delete</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>

            {#if products.length === 0}
              <div class="empty-state">
                <p>No products yet. Create your first product!</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'categories'}
      <div class="categories-tab">
        <div class="header">
          <h3>Category Management</h3>
          <div class="buttons-group">
            {#if editingCategory}
              <button class="btn-back" on:click={resetEditCategory} disabled={loading}>
                ← Back to Categories
              </button>
            {:else}
              <button class="btn-role btn-categories" on:click={() => showCategoryManager = true}>
                ➕ Add Category
              </button>
            {/if}
          </div>
        </div>

        {#if editingCategory}
          <!-- Edit Form -->
          <div class="edit-form-section">
            <div class="form-title">
              <h4>✏️ Edit Category: <span class="category-badge">{editingCategory.name}</span></h4>
            </div>

            <div class="form-group">
              <label for="cat-name">Category Name *</label>
              <input
                id="cat-name"
                type="text"
                bind:value={editingCategoryName}
                placeholder="E.g., SAREES"
                disabled={loading}
                style="text-transform: uppercase;"
              />
            </div>

            <div class="form-group">
              <label for="cat-description">Description</label>
              <textarea
                id="cat-description"
                bind:value={editingCategoryDescription}
                placeholder="Category description (optional)"
                disabled={loading}
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="cat-image">Category Image (Optional)</label>
              <div class="image-upload">
                {#if editingCategoryImage}
                  <img src={editingCategoryImage} alt={editingCategoryName} class="preview" />
                {/if}
                <input
                  id="cat-image"
                  type="file"
                  accept="image/*"
                  on:change={handleImageChange}
                  disabled={loading}
                />
                <p class="help-text">
                  {editingCategoryImage ? 'Click to change image' : 'Select category image'}
                </p>
              </div>
            </div>

            {#if error}
              <div class="error-message">{error}</div>
            {/if}

            <div class="form-actions">
              <button
                class="btn-cancel"
                on:click={resetEditCategory}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                class="btn-submit"
                on:click={handleSaveCategory}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Category'}
              </button>
            </div>
          </div>
        {:else}
          <!-- Categories Table -->
          {#if loading}
            <div class="loading">Loading categories...</div>
          {:else if error}
            <div class="error-state">
              <p>❌ {error}</p>
              <button class="btn-retry" on:click={loadCategories}>Retry</button>
            </div>
          {:else}
            <div class="table-wrapper">
              <table class="categories-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each categories as category (category.id)}
                    <tr>
                      <td class="image-cell">
                        {#if category.image_url}
                          <img src={category.image_url} alt={category.name} />
                        {:else}
                          <span class="no-image">—</span>
                        {/if}
                      </td>
                      <td class="name-cell">{category.name}</td>
                      <td class="description-cell">{category.description || '—'}</td>
                      <td class="actions-cell">
                        <button class="btn-edit" on:click={() => handleEditCategory(category)} disabled={loading}>Edit</button>
                        <button class="btn-delete" on:click={() => handleDeleteCategory(category.id)} disabled={loading}>Delete</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>

              {#if categories.length === 0}
                <div class="empty-state">
                  <p>No categories yet. Create your first category!</p>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {:else if activeTab === 'collections'}
      <div class="collections-tab">
        <div class="header">
          <h3>Collection Management</h3>
          <div class="buttons-group">
            {#if editingCollection}
              <button class="btn-back" on:click={resetEditCollection} disabled={loading}>
                ← Back to Collections
              </button>
            {:else}
              <button class="btn-role btn-collections" on:click={() => { editingCollection = { id: '', name: '', image_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any; }}>
                ➕ Add Collection
              </button>
            {/if}
          </div>
        </div>

        {#if editingCollection}
          <!-- Edit Form -->
          <div class="edit-form-section">
            <div class="form-title">
              <h4>✏️ {editingCollection.id ? 'Edit Collection:' : 'Create New Collection:'} <span class="collection-badge">{editingCollectionName || 'New Collection'}</span></h4>
            </div>

            <div class="form-group">
              <label for="col-name">Collection Name *</label>
              <input
                id="col-name"
                type="text"
                bind:value={editingCollectionName}
                placeholder="E.g., Summer 2024"
                disabled={loading}
              />
            </div>

            <div class="form-group">
              <label for="col-description">Description</label>
              <textarea
                id="col-description"
                bind:value={editingCollectionDescription}
                placeholder="Collection description (optional)"
                disabled={loading}
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="col-image">Collection Image (Optional)</label>
              <div class="image-upload">
                {#if editingCollectionImage}
                  <img src={editingCollectionImage} alt={editingCollectionName} class="preview" />
                {/if}
                <input
                  id="col-image"
                  type="file"
                  accept="image/*"
                  on:change={handleCollectionImageChange}
                  disabled={loading}
                />
                <p class="help-text">
                  {editingCollectionImage ? 'Click to change image' : 'Select collection image'}
                </p>
              </div>
            </div>

            {#if error}
              <div class="error-message">{error}</div>
            {/if}

            <div class="form-actions">
              <button
                class="btn-cancel"
                on:click={resetEditCollection}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                class="btn-submit"
                on:click={handleSaveCollection}
                disabled={loading}
              >
                {loading ? (editingCollection.id ? 'Updating...' : 'Creating...') : (editingCollection.id ? 'Update Collection' : 'Create Collection')}
              </button>
            </div>
          </div>
        {:else}
          <!-- Collections Table -->
          {#if collectionsLoading}
            <div class="loading">Loading collections...</div>
          {:else if error}
            <div class="error-state">
              <p>❌ {error}</p>
              <button class="btn-retry" on:click={loadCollections}>Retry</button>
            </div>
          {:else}
            <div class="table-wrapper">
              <table class="collections-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Collection Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each collections as collection (collection.id)}
                    <tr>
                      <td class="image-cell">
                        {#if collection.image_url}
                          <img src={collection.image_url} alt={collection.name} />
                        {:else}
                          <span class="no-image">—</span>
                        {/if}
                      </td>
                      <td class="name-cell">{collection.name}</td>
                      <td class="description-cell">{collection.description || '—'}</td>
                      <td class="actions-cell">
                        <button class="btn-edit" on:click={() => handleEditCollection(collection)} disabled={loading}>Edit</button>
                        <button class="btn-delete" on:click={() => handleDeleteCollection(collection.id)} disabled={loading}>Delete</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>

              {#if collections.length === 0}
                <div class="empty-state">
                  <p>No collections yet. Create your first collection!</p>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {:else if activeTab === 'hero'}
      <div class="hero-tab">
        <HeroImageManager />
      </div>
    {/if}
  </div>

  <!-- Modals rendered outside of scrollable content for proper positioning -->
  {#if showProductForm}
    <ProductForm 
      editingProduct={editingProduct}
      {categories}
      {collections}
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

  .categories-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .collections-tab {
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

  .btn-collections {
    border-color: #FF9800;
    color: #FF9800;
  }

  .btn-collections:hover {
    background: rgba(255, 152, 0, 0.1);
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .error-state {
    text-align: center;
    padding: 20px;
    background: #fee;
    border: 1px solid #f99;
    border-radius: 4px;
    color: #c33;
  }

  .error-state p {
    margin: 0 0 12px 0;
  }

  .btn-retry {
    padding: 8px 16px;
    background: #c33;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-retry:hover {
    background: #a22;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
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

  .collection {
    padding: 8px 12px !important;
  }

  .collection-select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
    background: white;
    color: #333;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .collection-select:hover {
    border-color: var(--primary-gold);
  }

  .collection-select:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
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

  /* Categories Table Styles */
  .categories-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .categories-table thead,
  .categories-table th {
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .categories-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: var(--primary-black);
  }

  .categories-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  .categories-table tbody tr:hover {
    background: #fafafa;
  }

  /* Collections Table Styles */
  .collections-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .collections-table thead,
  .collections-table th {
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .collections-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: var(--primary-black);
  }

  .collections-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  .collections-table tbody tr:hover {
    background: #fafafa;
  }

  .image-cell {
    width: 80px;
    text-align: center;
  }

  .image-cell img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 3px;
  }

  .no-image {
    color: #999;
    font-size: 16px;
  }

  .name-cell {
    font-weight: 600;
    color: var(--primary-black);
    min-width: 120px;
  }

  .description-cell {
    color: #666;
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions-cell {
    display: flex;
    gap: 8px;
    white-space: nowrap;
    justify-content: flex-end;
  }

  /* Edit Form Styles */
  .edit-form-section {
    background: #ffffff;
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 4px;
    padding: 20px;
    max-width: 500px;
  }

  .form-title {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--primary-gold);
  }

  .form-title h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .category-badge {
    display: inline-block;
    padding: 4px 12px;
    background: var(--primary-gold);
    color: var(--primary-black);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
    text-transform: uppercase;
  }

  .collection-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #FF9800;
    color: white;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary-black);
    margin-bottom: 8px;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .image-upload {
    border: 2px dashed #ddd;
    border-radius: 4px;
    padding: 16px;
    text-align: center;
    transition: all 0.2s ease;
  }

  .image-upload:hover {
    border-color: var(--primary-gold);
    background: rgba(212, 175, 55, 0.05);
  }

  .image-upload input {
    border: none;
    padding: 0;
    cursor: pointer;
    width: 100%;
  }

  .preview {
    width: 100%;
    max-width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .help-text {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #999;
  }

  .error-message {
    padding: 12px;
    background: #fee;
    border-left: 4px solid #c33;
    color: #c33;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .btn-cancel,
  .btn-submit {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-cancel {
    background: var(--white);
    color: var(--primary-black);
    border-color: #ddd;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #999;
  }

  .btn-submit {
    background: var(--primary-gold);
    color: var(--primary-black);
    border-color: var(--primary-gold);
  }

  .btn-submit:hover:not(:disabled) {
    background: #c99a3a;
    border-color: #c99a3a;
  }

  .btn-back {
    padding: 8px 12px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    transition: all 0.2s ease;
  }

  .btn-back:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #999;
    color: var(--primary-black);
  }

  .btn-back:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Hero Tab Styles */
  .hero-tab {
    padding: 20px;
    background: #ffffff;
  }
</style>
