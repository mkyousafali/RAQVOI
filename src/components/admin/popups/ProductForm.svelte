<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { createProduct, updateProduct, type Category, type Collection } from '../../../lib/productUtils';
  import { uploadImage, deleteImage } from '../../../lib/storageUtils';

  const dispatch = createEventDispatcher();

  export let editingProduct: any = null;
  export let categories: Category[] = [];
  export let collections: Collection[] = [];

  let name = '';
  let categoryId = '';
  let collectionId = '';
  let price = '';
  let imageUrl = '';
  let imageFile: File | null = null;
  let description = '';
  let isNew = false;
  let stockQuantity = '0';
  let error = '';
  let loading = false;
  let isEditing = false;

  onMount(() => {
    if (editingProduct) {
      isEditing = true;
      name = editingProduct.name;
      categoryId = editingProduct.category_id;
      collectionId = editingProduct.collection_id || '';
      price = editingProduct.price.toString();
      imageUrl = editingProduct.image_url || '';
      description = editingProduct.description || '';
      isNew = editingProduct.is_new || false;
      stockQuantity = editingProduct.stock_quantity?.toString() || '0';
    } else {
      categoryId = categories[0]?.id || '';
      collectionId = collections[0]?.id || '';
    }
  });

  function handleImageChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      imageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        imageUrl = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit() {
    error = '';

    if (!name.trim()) {
      error = 'Product name is required';
      return;
    }

    if (!categoryId) {
      error = 'Category is required';
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      error = 'Valid price is required';
      return;
    }

    if (!imageUrl && !isEditing) {
      error = 'Product image is required';
      return;
    }

    loading = true;

    try {
      let finalImageUrl = imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, 'product-images', 'products');
      }

      const productData = {
        name: name.trim(),
        category_id: categoryId,
        collection_id: collectionId || null,
        price: parseFloat(price),
        image_url: finalImageUrl,
        description: description.trim() || null,
        is_new: isNew,
        stock_quantity: parseInt(stockQuantity) || 0,
        is_active: true,
      };

      if (isEditing) {
        await updateProduct(editingProduct.id, productData);
        console.log('✅ Product updated:', editingProduct.id);
      } else {
        const result = await createProduct({
          ...productData,
          is_active: true,
        } as any);
        console.log('✅ Product created:', result.id);
      }

      dispatch('success');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error saving product';
      console.error('Error saving product:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="modal-overlay" on:click={() => dispatch('close')}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{isEditing ? 'Edit Product' : 'Create New Product'}</h2>
      <button class="btn-close" on:click={() => dispatch('close')}>✕</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">Product Name *</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Enter product name"
          disabled={loading}
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="category">Category *</label>
          <select
            id="category"
            bind:value={categoryId}
            disabled={loading}
          >
            <option value="">-- Select Category --</option>
            {#each categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="collection">Collection</label>
          <select
            id="collection"
            bind:value={collectionId}
            disabled={loading}
          >
            <option value="">-- Select Collection (Optional) --</option>
            {#each collections as col}
              <option value={col.id}>{col.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="price">Price (₹) *</label>
          <input
            id="price"
            type="number"
            bind:value={price}
            placeholder="Enter price"
            min="0"
            step="0.01"
            disabled={loading}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Enter product description (optional)"
          disabled={loading}
          rows="3"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock">Stock Quantity</label>
          <input
            id="stock"
            type="number"
            bind:value={stockQuantity}
            placeholder="0"
            min="0"
            disabled={loading}
          />
        </div>

        <div class="checkbox-group">
          <label>
            <input
              type="checkbox"
              bind:checked={isNew}
              disabled={loading}
            />
            <span>Mark as New</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="image">Product Image {isEditing ? '(optional)' : '*'}</label>
        <div class="image-upload">
          {#if imageUrl}
            <img src={imageUrl} alt={name} class="preview" />
          {/if}
          <input
            id="image"
            type="file"
            accept="image/*"
            on:change={handleImageChange}
            disabled={loading}
          />
          <p class="help-text">
            {imageUrl ? 'Click to change image' : 'Select product image'}
          </p>
          <div class="image-guidelines">
            <p><strong>📐 Recommended Size:</strong></p>
            <ul>
              <li>Mobile: 400×500px (vertical format)</li>
              <li>Desktop: 500×600px (vertical format)</li>
              <li>Max file size: 5MB</li>
              <li>Formats: JPG, PNG, WebP</li>
            </ul>
          </div>
        </div>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-actions">
        <button type="button" class="btn-cancel" on:click={() => dispatch('close')} disabled={loading}>
          Cancel
        </button>
        <button type="submit" class="btn-submit" disabled={loading}>
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .modal {
    background: var(--white);
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    font-family: var(--sans);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-black);
  }

  .btn-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 24px;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .btn-close:hover {
    color: var(--primary-black);
  }

  form {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary-black);
    margin-bottom: 8px;
  }

  input,
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
    resize: vertical;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  input:disabled,
  select:disabled,
  textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    padding: 12px 0;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
  }

  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    padding: 0;
    cursor: pointer;
  }

  .checkbox-group span {
    color: var(--primary-black);
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
    max-width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .help-text {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #999;
  }

  .image-guidelines {
    margin-top: 12px;
    padding: 12px;
    background: #f0f7ff;
    border-left: 3px solid #2196F3;
    border-radius: 3px;
  }

  .image-guidelines p {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-black);
  }

  .image-guidelines ul {
    margin: 0;
    padding-left: 20px;
    list-style: disc;
  }

  .image-guidelines li {
    font-size: 11px;
    color: #555;
    margin-bottom: 4px;
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
    margin-top: 24px;
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
    background: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
