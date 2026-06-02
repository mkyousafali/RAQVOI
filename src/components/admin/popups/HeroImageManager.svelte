<script lang="ts">
  import { onMount } from 'svelte';
  import { uploadImage, deleteImage } from '../../../lib/storageUtils';
  import {
    getHeroImages,
    createHeroImage,
    updateHeroImage,
    deleteHeroImage,
    type HeroImage,
  } from '../../../lib/productUtils';

  let heroImages: HeroImage[] = [];
  let loading = true;
  let error = '';
  let showForm = false;
  let editingImage: HeroImage | null = null;
  let formTitle = '';
  let formDescription = '';
  let formImageFile: File | null = null;
  let formImagePreview = '';
  let formOrder = 0;
  let saving = false;

  async function loadHeroImages() {
    try {
      heroImages = await getHeroImages();
      loading = false;
    } catch (err) {
      error = 'Failed to load hero images';
      loading = false;
    }
  }

  function handleImageChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      formImageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        formImagePreview = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function resetForm() {
    showForm = false;
    editingImage = null;
    formTitle = '';
    formDescription = '';
    formImageFile = null;
    formImagePreview = '';
    formOrder = 0;
  }

  function startEdit(image: HeroImage) {
    editingImage = image;
    formTitle = image.title || '';
    formDescription = image.description || '';
    formOrder = image.display_order;
    formImagePreview = image.image_url;
    formImageFile = null;
    showForm = true;
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      error = 'Title is required';
      return;
    }

    saving = true;
    try {
      let imageUrl = formImagePreview;

      // Upload new image if selected
      if (formImageFile) {
        imageUrl = await uploadImage(formImageFile, 'hero-images', 'hero');
      }

      if (editingImage) {
        // Update existing
        await updateHeroImage(editingImage.id, {
          image_url: imageUrl,
          title: formTitle,
          description: formDescription,
          display_order: formOrder,
        });
      } else {
        // Create new
        await createHeroImage(imageUrl, formTitle, formDescription, formOrder);
      }

      await loadHeroImages();
      resetForm();
    } catch (err) {
      error = `Failed to save: ${err}`;
    } finally {
      saving = false;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this hero image?')) return;

    try {
      await deleteHeroImage(id);
      await loadHeroImages();
    } catch (err) {
      error = `Failed to delete: ${err}`;
    }
  }

  function handleAddNew() {
    resetForm();
    showForm = true;
  }

  onMount(loadHeroImages);
</script>

<div class="hero-manager">
  <div class="manager-header">
    <h2>Hero Section Images</h2>
    <button class="btn-primary" on:click={handleAddNew}>+ Add Hero Image</button>
  </div>

  {#if error}
    <div class="error-message">❌ {error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading hero images...</div>
  {:else if showForm}
    <div class="hero-form">
      <div class="form-header">
        <h3>{editingImage ? '✏️ Edit Hero Image' : '➕ Add Hero Image'}</h3>
        <button class="btn-back" on:click={resetForm}>← Back</button>
      </div>

      <div class="form-group">
        <label>Title</label>
        <input type="text" bind:value={formTitle} placeholder="Hero image title" />
      </div>

      <div class="form-group">
        <label>Description (optional)</label>
        <textarea
          bind:value={formDescription}
          placeholder="Hero image description"
          rows="3"
        />
      </div>

      <div class="form-group">
        <label>Display Order</label>
        <input type="number" bind:value={formOrder} min="0" />
      </div>

      <div class="form-group">
        <label>Image</label>
        {#if formImagePreview}
          <div class="image-preview">
            <img src={formImagePreview} alt="Preview" />
          </div>
        {/if}
        <input
          type="file"
          accept="image/*"
          on:change={handleImageChange}
          disabled={saving}
        />
        <p class="image-guidelines">
          Recommended: Desktop 1200×400px, Mobile 600×300px, Max 5MB
        </p>
      </div>

      <div class="form-actions">
        <button
          class="btn-primary"
          on:click={handleSave}
          disabled={saving || !formTitle.trim()}
        >
          {saving ? 'Saving...' : 'Save Hero Image'}
        </button>
        <button class="btn-secondary" on:click={resetForm} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <div class="images-table">
      {#if heroImages.length === 0}
        <p class="empty-state">No hero images yet. Add one to get started!</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each heroImages as image}
              <tr>
                <td>
                  <img src={image.image_url} alt={image.title} class="thumb" />
                </td>
                <td>{image.title}</td>
                <td>{image.display_order}</td>
                <td>
                  <button class="btn-edit" on:click={() => startEdit(image)}>
                    Edit
                  </button>
                  <button
                    class="btn-delete"
                    on:click={() => handleDelete(image.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>

<style>
  .hero-manager {
    padding: 20px;
    background: #ffffff;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 4px solid #b89968;
  }

  .manager-header h2 {
    margin: 0;
    font-size: 20px;
    color: #1a1a1a;
  }

  .error-message {
    background: #ffebee;
    border: 1px solid #ef5350;
    color: #c62828;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .loading {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-size: 14px;
  }

  .hero-form {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    padding: 20px;
    border-radius: 4px;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #b89968;
  }

  .form-header h3 {
    margin: 0;
    font-size: 16px;
    color: #1a1a1a;
  }

  .btn-back {
    background: transparent;
    border: none;
    color: #b89968;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 8px;
  }

  .btn-back:hover {
    text-decoration: underline;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .form-group input[type='text'],
  .form-group input[type='number'],
  .form-group textarea,
  .form-group input[type='file'] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
  }

  .form-group textarea {
    resize: vertical;
  }

  .image-preview {
    margin-bottom: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    max-height: 200px;
  }

  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
  }

  .image-guidelines {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .btn-primary {
    flex: 1;
    padding: 10px 16px;
    background: #b89968;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  }

  .btn-primary:hover:not(:disabled) {
    background: #a0845a;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    padding: 10px 16px;
    background: #f0f0f0;
    color: #1a1a1a;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e0e0e0;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .images-table {
    background: #ffffff;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-size: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
  }

  .thumb {
    width: 80px;
    height: 40px;
    object-fit: cover;
    border-radius: 2px;
  }

  .btn-edit,
  .btn-delete {
    padding: 4px 8px;
    margin: 0 2px;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }

  .btn-edit {
    background: #d4af37;
    color: #1a1a1a;
  }

  .btn-edit:hover {
    background: #b89968;
  }

  .btn-delete {
    background: #ef5350;
    color: #ffffff;
  }

  .btn-delete:hover {
    background: #e53935;
  }
</style>
