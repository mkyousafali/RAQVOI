<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { createCategory, updateCategory, deleteCategory, type Category } from '../../../lib/productUtils';
  import { uploadImage } from '../../../lib/storageUtils';

  const dispatch = createEventDispatcher();

  export let categories: Category[] = [];

  let categoryName = '';
  let categoryDescription = '';
  let categoryImage = '';
  let categoryImageFile: File | null = null;
  let error = '';
  let loading = false;
  let showAddForm = false;
  let editingCategory: Category | null = null;
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

  function resetForm() {
    categoryName = '';
    categoryDescription = '';
    categoryImage = '';
    categoryImageFile = null;
    editingCategory = null;
    error = '';
  }

  function startEdit(category: Category) {
    console.log('✏️ Edit category clicked:', category.id);
    editingCategory = category;
    categoryName = category.name;
    categoryDescription = category.description || '';
    categoryImage = category.image_url || '';
    showAddForm = true;
  }

  async function handleSaveCategory() {
    error = '';
    const isEdit = !!editingCategory;
    console.log(isEdit ? '✏️ Update category:' : '➕ Add category:', categoryName);

    if (!categoryName.trim()) {
      error = 'Category name is required';
      console.warn('Category name is empty');
      return;
    }

    if (!categoryImage && !isEdit) {
      error = 'Category image is required for new categories';
      console.warn('Category image not provided');
      return;
    }

    loading = true;

    try {
      // Upload image if a new file was selected
      let imageUrl = categoryImage;
      if (categoryImageFile) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(categoryImageFile, 'category-images', 'categories');
        console.log('Image uploaded:', imageUrl);
      }

      if (isEdit && editingCategory) {
        // Update existing category
        console.log('Updating category in database...');
        const updated = await updateCategory(editingCategory.id, {
          name: categoryName.toUpperCase(),
          description: categoryDescription || null,
          image_url: imageUrl,
        });
        
        localCategories = localCategories.map(c => c.id === updated.id ? updated : c);
        console.log('✅ Category updated:', updated.id);
      } else {
        // Create new category
        console.log('Creating category in database...');
        const newCategory = await createCategory({
          name: categoryName.toUpperCase(),
          description: categoryDescription || null,
          image_url: imageUrl,
        });

        localCategories = [...localCategories, newCategory];
        console.log('✅ Category added:', newCategory.id);
      }

      resetForm();
      showAddForm = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error saving category';
      console.error('❌ Error saving category:', err);
    } finally {
      loading = false;
    }
  }

  async function handleDeleteCategory(id: string) {
    console.log('🗑️ Delete category clicked:', id);
    if (!confirm('Delete this category? This action cannot be undone.')) {
      console.log('Delete cancelled');
      return;
    }

    try {
      console.log('Deleting category from database...');
      await deleteCategory(id);
      localCategories = localCategories.filter(c => c.id !== id);
      console.log('✅ Category deleted:', id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error deleting category';
      console.error('❌ Error deleting category:', err);
    }
  }

  function handleSaveChanges() {
    console.log('💾 Save all categories clicked');
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
      <div class="categories-section">
        {#if !editingCategory}
          <div class="section-header">
            <h3>All Categories</h3>
            <button class="btn-add-new" on:click={() => { resetForm(); showAddForm = true; }} disabled={loading}>
              + Add New Category
            </button>
          </div>

          {#if localCategories.length === 0}
            <p class="empty">No categories yet</p>
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
                {#each localCategories as category (category.id)}
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
                      <button class="btn-edit" on:click={() => startEdit(category)} disabled={loading}>
                        Edit
                      </button>
                      <button class="btn-delete" on:click={() => handleDeleteCategory(category.id)} disabled={loading}>
                        Delete
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
        {/if}
      </div>

      {#if showAddForm}
        <div class="add-category-form" class:editing={editingCategory}>
          <div class="form-title-bar">
            <div class="form-title-content">
              {#if editingCategory}
                <button class="btn-back" on:click={() => { editingCategory = null; showAddForm = false; resetForm(); }} disabled={loading}>
                  ← Back to Categories
                </button>
              {/if}
              <h3>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h3>
              {#if editingCategory}
                <span class="editing-badge">{editingCategory.name}</span>
              {/if}
            </div>
          </div>

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
            <label for="cat-description">Description</label>
            <textarea
              id="cat-description"
              bind:value={categoryDescription}
              placeholder="Category description (optional)"
              disabled={loading}
              rows="2"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="cat-image">Category Image {editingCategory ? '(optional)' : '*'}</label>
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
              on:click={() => { showAddForm = false; resetForm(); }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-submit"
              on:click={handleSaveCategory}
              disabled={loading}
            >
              {loading ? (editingCategory ? 'Updating...' : 'Adding...') : (editingCategory ? 'Update Category' : 'Add Category')}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button type="button" class="btn-cancel" on:click={() => dispatch('close')}>
        Close
      </button>
      <button type="button" class="btn-save" on:click={handleSaveChanges}>
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
    background: #ffffff !important;
    border: 4px solid var(--primary-gold);
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
    border-bottom: 2px solid var(--primary-gold);
    background: #ffffff;
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
    background: #ffffff;
  }

  .categories-list h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .categories-section {
    margin-bottom: 20px;
    background: #ffffff;
    border-radius: 4px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .btn-add-new {
    padding: 8px 12px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-add-new:hover:not(:disabled) {
    background: #45a049;
  }

  .btn-add-new:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .table-wrapper {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 16px;
    background: #ffffff;
  }

  .categories-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: #ffffff;
  }

  .categories-table thead {
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

  .image-cell {
    width: 60px;
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
  }

  .name-cell {
    font-weight: 600;
    color: var(--primary-black);
  }

  .description-cell {
    color: #666;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions-cell {
    display: flex;
    gap: 8px;
    white-space: nowrap;
  }

  .btn-edit,
  .btn-delete {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-edit {
    color: #2196F3;
    border-color: #2196F3;
  }

  .btn-edit:hover:not(:disabled) {
    background: rgba(33, 150, 243, 0.1);
  }

  .btn-delete {
    color: #f44336;
    border-color: #f44336;
  }

  .btn-delete:hover:not(:disabled) {
    background: rgba(244, 67, 54, 0.1);
  }

  .btn-edit:disabled,
  .btn-delete:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Old grid styles removed - now using table layout */

  .add-category-form {
    margin-top: 20px;
    padding: 16px;
    border-top: 2px solid var(--primary-gold);
    background: #ffffff;
    border-radius: 4px;
  }

  .add-category-form.editing {
    background: rgba(212, 175, 55, 0.05);
    border-left: 4px solid var(--primary-gold);
  }

  .form-title-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .form-title-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .btn-back {
    padding: 6px 12px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    transition: all 0.2s ease;
    white-space: nowrap;
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

  .add-category-form h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--primary-black);
  }

  .editing-badge {
    display: inline-block;
    padding: 4px 12px;
    background: var(--primary-gold);
    color: var(--primary-black);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
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
  textarea:focus {
    outline: none;
    border-color: var(--primary-gold);
    box-shadow: 0 0 0 3px rgba(180, 153, 104, 0.1);
  }

  input:disabled,
  textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .empty {
    color: #999;
    text-align: center;
    padding: 20px;
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
    border-top: 2px solid var(--primary-gold);
    background: #ffffff;
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
