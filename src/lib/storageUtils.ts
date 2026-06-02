import { supabase } from './supabaseClient';

/**
 * Upload an image file to Supabase Storage
 * @param file - Image file to upload
 * @param bucket - Bucket name ('product-images' or 'category-images')
 * @param folder - Folder within bucket
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: string, folder: string = '') {
  if (!file) {
    throw new Error('No file provided');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop();
  const filename = `${timestamp}-${random}.${ext}`;

  const path = folder ? `${folder}/${filename}` : filename;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - Public URL of the image
 * @param bucket - Bucket name
 */
export async function deleteImage(imageUrl: string, bucket: string) {
  try {
    // Extract path from URL
    const urlParts = imageUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }

    const path = urlParts[1].split('/').slice(1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (err) {
    console.error('Error deleting image:', err);
    // Don't throw - image deletion failure shouldn't block the operation
  }
}

/**
 * Create storage buckets if they don't exist
 */
export async function initializeStorageBuckets() {
  try {
    // Check and create product-images bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketNames = buckets.map(b => b.name);

    // Create product-images bucket if not exists
    if (!bucketNames.includes('product-images')) {
      const { error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
      });
      
      if (createError) {
        console.warn('Could not create product-images bucket:', createError.message);
      }
    }

    // Create category-images bucket if not exists
    if (!bucketNames.includes('category-images')) {
      const { error: createError } = await supabase.storage.createBucket('category-images', {
        public: true,
      });
      
      if (createError) {
        console.warn('Could not create category-images bucket:', createError.message);
      }
    }

    console.log('✅ Storage buckets initialized');
  } catch (err) {
    console.error('Error initializing storage buckets:', err);
  }
}
