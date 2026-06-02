<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  export let categories: any[] = [];

  let categoryName = '';
  let categoryImage = '';
  let categoryImageFile: File | null = null;
  let error = '';
  let loading = false;
  let showAddForm = false;
  let localCategories = [...categories];

  function handleImageChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      categoryImageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        categoryImage = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAddCategory() {
    error = '';

    if (!categoryName.trim()) {
      error = 'Category name is required';
      return;
    }

    if (!categoryImage) {
      error = 'Category image is required';
      return;
    }

    loading = true;

    try {
      // Add new category to local list
      const newCategory = {
        id: localCategories.length + 1,
        name: categoryName.toUpperCase(),
        image: categoryImage,
      };

      localCategories = [...localCategories, newCategory];

      // Reset form
      categoryName = '';
      categoryImage = '';
      categoryImageFile = null;
      showAddForm = false;

      console.log('Category added:', newCategory);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error adding category';
    } finally {
      loading = false;
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Delete this category?')) {
      return;
    }

    try {
      localCategories = localCategories.filter(c => c.id !== id);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  }

  function handleSaveCategories() {
    dispatch('success');
  }
</script>

<div class="modal-overlay" on:click={() => dispatch('close')}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Manage Categories</h2>
      <button class="btn-close" on:click={() => dispatch('close')}>✕</button>
    </div>

    <div class="modal-content">
      <div class="categories-list">
        <h3>Current Categories</h3>
        {#if localCategories.length === 0}
          <p class="empty">No categories yet</p>
        {:else}
          <div class="category-grid">
            {#each localCategories as category (category.id)}
              <div class="category-card">
                <img src={category.image} alt={category.name} />
                <h4>{category.name}</h4>
                <button
                  class="btn-delete-category"
                  on:click={() => handleDeleteCategory(category.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#if !showAddForm}
          <button class="btn-add-category" on:click={() => showAddForm = true}>
            + Add Category
          </button>
        {/if}
      </div>

      {#if showAddForm}
        <div class="add-category-form">
          <h3>Add New Category</h3>

          <div class="form-group">
            <label for="cat-name">Category Name *</label>
            <input
              id="cat-name"
              type="text"
              bind:value={categoryName}
              placeholder="E.g., SAREES"
              disabled={loading}
              style="text-transform: uppercase;"
            />
          </div>

          <div class="form-group">
            <label for="cat-image">Category Image *</label>
            <div class="image-upload">
              {#if categoryImage}
                <img src={categoryImage} alt={categoryName} class="preview" />
              {/if}
              <input
                id="cat-image"
                type="file"
                accept="image/*"
                on:change={handleImageChange}
                disabled={loading}
              />
              <p class="help-text">
                {categoryImage ? 'Click to change image' : 'Select category image'}
              </p>
            </div>
          </div>

          {#if error}
            <div class="error-message">{error}</div>
          {/if}

          <div class="form-actions">
            <button
              type="button"
              class="btn-cancel"
              on:click={() => {
                showAddForm = false;
                categoryName = '';
                categoryImage = '';
                error = '';
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-submit"
              on:click={handleAddCategory}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button type="button" class="btn-cancel" on:click={() => dispatch('close')}>
        Close
      </button>
      <button type="button" class="btn-save" on:click={handleSaveCategories}>
        Save Changes
      </button>
    </div>
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
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
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

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .categories-list h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .empty {
    color: #999;
    text-align: center;
    padding: 20px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .category-card {
    position: relative;
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-card:hover {
    border-color: var(--primary-gold);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .category-card img {
    width: 100%;
    height: 100px;
    object-fit: cover;
  }

  .category-card h4 {
    margin: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-black);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-delete-category {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(244, 67, 54, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .category-card:hover .btn-delete-category {
    opacity: 1;
  }

  .btn-add-category {
    display: block;
    width: 100%;
    padding: 12px;
    margin-top: 12px;
    border: 2px dashed var(--primary-gold);
    background: transparent;
    color: var(--primary-gold);
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-add-category:hover {
    background: rgba(212, 175, 55, 0.05);
  }

  .add-category-form {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  .add-category-form h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .form-group {
    margin-bottom: 16px;
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

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: var(--sans);
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  input:disabled {
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
    margin-top: 16px;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid #eee;
    background: #f9f9f9;
  }

  .btn-cancel,
  .btn-submit,
  .btn-save {
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

  .btn-submit,
  .btn-save {
    background: var(--primary-gold);
    color: var(--primary-black);
    border-color: var(--primary-gold);
  }

  .btn-submit:hover:not(:disabled),
  .btn-save:hover:not(:disabled) {
    background: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
