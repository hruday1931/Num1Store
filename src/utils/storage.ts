import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface ImageUploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload a single image file to Supabase Storage
 */
export async function uploadImage(
  file: File,
  bucketName: string = 'product-images',
  vendorId?: string,
  productName?: string,
  user?: User | null
): Promise<ImageUploadResult> {
  try {
    // Check if user is authenticated
    if (!user || !user.id) {
      console.error('Upload failed: User not authenticated');
      return {
        url: '',
        path: '',
        error: 'User must be authenticated to upload images'
      };
    }

    // Generate proper file path: vendor_id/product_name/image.jpg
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedProductName = productName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'product';
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = vendorId ? `${vendorId}/${sanitizedProductName}/${fileName}` : fileName;

    console.log('=== STORAGE UPLOAD DEBUG ===');
    console.log('User ID:', user.id);
    console.log('Bucket name:', bucketName);
    console.log('File path:', filePath);
    console.log('File type:', file.type);
    console.log('=============================');

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Error uploading file:', error);
      let errorMessage = `Failed to upload image: ${error.message}`;
      
      if (error.message.includes('row-level security policy') || error.message.includes('PGRST')) {
        errorMessage = `Storage permission denied. Please ensure you have an active vendor subscription and proper storage permissions.`;
      }
      
      return {
        url: '',
        path: '',
        error: errorMessage
      };
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return {
      url: '',
      path: '',
      error: 'Unexpected error occurred during upload'
    };
  }
}

/**
 * Upload multiple image files to Supabase Storage
 */
export async function uploadMultipleImages(
  files: File[],
  bucketName: string = 'product-images',
  vendorId?: string,
  productName?: string,
  user?: User | null
): Promise<ImageUploadResult[]> {
  // Validate inputs
  if (!user) {
    return files.map(file => ({
      url: '',
      path: '',
      error: 'User must be authenticated to upload images'
    }));
  }

  if (files.length === 0) {
    return [];
  }

  if (files.length > 5) {
    console.warn(`Warning: ${files.length} files provided, but only first 5 will be uploaded`);
    files = files.slice(0, 5);
  }

  console.log(`Starting upload of ${files.length} images to bucket '${bucketName}'`);
  
  // Upload images one by one to better handle errors and provide progress
  const results: ImageUploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Uploading image ${i + 1}/${files.length}: ${file.name}`);
    
    const result = await uploadImage(file, bucketName, vendorId, productName, user);
    results.push(result);
    
    if (result.error) {
      console.error(`Failed to upload image ${i + 1}: ${result.error}`);
    } else {
      console.log(`Successfully uploaded image ${i + 1}: ${result.url}`);
    }
  }
  
  return results;
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
  path: string,
  bucketName: string = 'product-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: `Failed to delete image: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error deleting image:', error);
    return {
      success: false,
      error: 'Unexpected error occurred during deletion'
    };
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteMultipleImages(
  paths: string[],
  bucketName: string = 'product-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove(paths);

    if (error) {
      console.error('Error deleting files:', error);
      return {
        success: false,
        error: `Failed to delete images: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error deleting images:', error);
    return {
      success: false,
      error: 'Unexpected error occurred during deletion'
    };
  }
}

/**
 * Check if a storage bucket exists (no automatic creation)
 */
export async function checkBucketExists(
  bucketName: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return {
        exists: false,
        error: `Failed to check bucket: ${error.message}`
      };
    }

    const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName);
    return { exists: bucketExists || false };

  } catch (error) {
    console.error('Unexpected error checking bucket:', error);
    return {
      exists: false,
      error: 'Unexpected error occurred while checking storage bucket'
    };
  }
}

/**
 * Generate a unique filename for product images
 */
export function generateUniqueFilename(productId: string, originalName: string): string {
  const fileExt = originalName.split('.').pop();
  const timestamp = Date.now();
  return `${productId}_${timestamp}.${fileExt}`;
}

/**
 * Generate a folder path for product images
 */
export function generateProductFolder(vendorId: string, productId?: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const baseFolder = `vendors/${vendorId}/${timestamp}`;
  return productId ? `${baseFolder}/${productId}` : baseFolder;
}
