import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  is_vendor: boolean;
  subscription_status: string;
}

interface StorageError {
  message: string;
}

export interface ImageUploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Enhanced upload function with proper authentication handling
 */
export async function uploadImageFixed(
  file: File,
  bucketName: string = 'product-images',
  folder?: string,
  productId?: string,
  user?: User | null
): Promise<ImageUploadResult> {
  try {
    // First, ensure we have a fresh authentication session
    let currentUser = user;
    
    if (!currentUser) {
      console.log('No user provided, checking current session...');
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return {
          url: '',
          path: '',
          error: `Authentication error: ${sessionError.message}`
        };
      }
      
      if (!sessionUser) {
        console.error('No authenticated user found');
        return {
          url: '',
          path: '',
          error: 'User must be authenticated to upload images. Please sign in again.'
        };
      }
      
      currentUser = sessionUser;
    }
    
    if (!currentUser.id) {
      console.error('User object exists but no ID');
      return {
        url: '',
        path: '',
        error: 'User ID is missing - invalid session'
      };
    }

    // Verify user has vendor permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_vendor, subscription_status')
      .eq('id', currentUser.id)
      .single();

    const userProfile = profile as UserProfile | null;
    
    if (profileError || !userProfile?.is_vendor) {
      console.error('User is not a vendor:', profileError);
      return {
        url: '',
        path: '',
        error: 'Only vendors can upload product images'
      };
    }

    if (userProfile?.subscription_status !== 'active') {
      console.error('Vendor subscription not active:', userProfile?.subscription_status);
      return {
        url: '',
        path: '',
        error: 'Vendor subscription must be active to upload images'
      };
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const fileName = productId 
      ? `${productId}_${timestamp}.${fileExt}`
      : `${timestamp}_${randomSuffix}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Debug logging
    console.log('=== ENHANCED STORAGE UPLOAD DEBUG ===');
    console.log('User ID:', currentUser.id);
    console.log('User email:', currentUser.email);
    console.log('Is vendor:', userProfile?.is_vendor);
    console.log('Subscription status:', userProfile?.subscription_status);
    console.log('Bucket name:', bucketName);
    console.log('File path:', filePath);
    console.log('=====================================');

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 2097152
        });
        
        if (createError && !createError.message.includes('already exists')) {
          console.error('Bucket creation error:', createError);
          return {
            url: '',
            path: '',
            error: `Failed to create storage bucket: ${createError.message}`
          };
        }
      }
    } catch (bucketError) {
      console.error('Bucket check error:', bucketError);
      // Continue with upload attempt
    }

    // Attempt upload with retry logic
    let uploadAttempts = 0;
    const maxAttempts = 3;
    
    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      
      try {
        console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          console.error(`Upload attempt ${uploadAttempts} failed:`, error);
          
          if (error.message.includes('row-level security policy')) {
            // Try refreshing the session
            if (uploadAttempts === 1) {
              console.log('Refreshing auth session...');
              await supabase.auth.refreshSession();
              continue;
            }
            
            return {
              url: '',
              path: '',
              error: `Storage permission denied. This usually means:\n1. Your vendor subscription is not active\n2. Row Level Security policies need to be updated\n3. Authentication session expired\n\nPlease try signing out and back in, or contact support.\n\nError details: ${error.message}`
            };
          }
          
          if (uploadAttempts < maxAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
            continue;
          }
          
          return {
            url: '',
            path: '',
            error: `Failed to upload image after ${maxAttempts} attempts: ${error.message}`
          };
        }

        // Success - get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        console.log('Upload successful:', publicUrl);
        
        return {
          url: publicUrl,
          path: filePath
        };

      } catch (uploadError) {
        console.error(`Upload attempt ${uploadAttempts} exception:`, uploadError);
        
        if (uploadAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          continue;
        }
        
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        return {
          url: '',
          path: '',
          error: `Upload failed with exception: ${errorMessage}`
        };
      }
    }

    return {
      url: '',
      path: '',
      error: 'Upload failed after all retry attempts'
    };

  } catch (error) {
    console.error('Unexpected error in uploadImageFixed:', error);
    return {
      url: '',
      path: '',
      error: 'Unexpected error occurred during upload'
    };
  }
}

/**
 * Upload multiple images with enhanced error handling
 */
export async function uploadMultipleImagesFixed(
  files: File[],
  bucketName: string = 'product-images',
  folder?: string,
  productId?: string,
  user?: User | null
): Promise<ImageUploadResult[]> {
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

  console.log(`Starting enhanced upload of ${files.length} images to bucket '${bucketName}'`);
  
  const results: ImageUploadResult[] = [];
  
  // Upload images sequentially to better handle errors
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Uploading image ${i + 1}/${files.length}: ${file.name}`);
    
    const result = await uploadImageFixed(file, bucketName, folder, productId, user);
    results.push(result);
    
    if (result.error) {
      console.error(`Failed to upload image ${i + 1}: ${result.error}`);
    } else {
      console.log(`Successfully uploaded image ${i + 1}: ${result.url}`);
    }
    
    // Small delay between uploads to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}
