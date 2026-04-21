'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types';

type ProductUpdateData = {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  inventory_count?: number;
  images?: string[];
  is_active?: boolean;
};

export async function updateProduct(productId: string, updateData: ProductUpdateData) {
  try {
    console.log('Server action: Starting product update...');
    console.log('Server action: Product ID:', productId);
    console.log('Server action: Update data:', updateData);
    
    // Use server-side Supabase client with proper authentication
    const supabase = await createClient();
    
    // Get current user from server - this is more reliable for server actions
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError);
      console.error('Cookie debug - available cookies:', await supabase.auth.getSession());
      return { 
        success: false, 
        error: 'User authentication required. Please sign in again.',
        requiresAuth: true
      };
    }
    
    const authenticatedUserId = user.id;
    console.log('Server action: Authenticated user ID:', authenticatedUserId);
    
    // Get vendor ID for authenticated user
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', authenticatedUserId)
      .maybeSingle() as { data: { id: string } | null; error: any };
      
    console.log('Vendor fetch result:', { vendorData: !!vendorData, error: vendorError });

    if (vendorError || !vendorData) {
      console.error('Vendor fetch error:', vendorError);
      console.error('User ID used for vendor lookup:', authenticatedUserId);
      return { 
        success: false, 
        error: 'Vendor account not found. Please set up your vendor profile first.'
      };
    }

    // First verify the product exists and belongs to this vendor
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, updated_at, vendor_id')
      .eq('id', productId)
      .eq('vendor_id', vendorData.id)
      .maybeSingle() as { data: { id: string; updated_at: string; vendor_id: string } | null; error: any };

    if (fetchError) {
      console.error('Product fetch error:', fetchError);
      return { 
        success: false, 
        error: `Product not found: ${fetchError.message}`
      };
    }

    if (!existingProduct) {
      return { 
        success: false, 
        error: 'Product not found or you do not have permission to edit it'
      };
    }

    // Update the product using RLS policies
    console.log('Server action: Attempting update with RLS enforcement');
    console.log('Updating product with ID:', productId);
    console.log('Server action: Update query conditions:', {
      productId,
      vendorId: vendorData.id,
      updateData,
      imagesCount: updateData.images?.length || 0,
      firstImageUrl: updateData.images?.[0] || 'none'
    });
    
    // Update with vendor_id check for RLS compliance
    const { error, data } = await (supabase as any)
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('vendor_id', vendorData.id) // Ensure vendor matches for RLS
      .select('id, updated_at, vendor_id');

    console.log('Server action: Update result:', { 
      error: !!error, 
      errorMessage: error?.message,
      dataLength: data?.length,
      data: data 
    });

    if (error) {
      console.error('Product update error:', error);
      return { 
        success: false, 
        error: `Update failed: ${error.message}`
      };
    }

    // Check if data was returned and has at least one row
    if (!data || data.length === 0) {
      console.error('No data returned from update operation');
      console.error('This usually means RLS policy blocked the update or vendor_id mismatch');
      return { 
        success: false, 
        error: 'No permission to edit this product. The product may not exist or you may not have permission to edit it.'
      };
    }

    // Get the first (and should be only) updated product
    const updatedProduct = data?.[0];

    // Revalidate the products list to clear cache
    revalidatePath('/vendor/products');
    revalidatePath(`/vendor/products/edit/${productId}`);
    
    console.log('Server action: Update successful, returning success with data:', updatedProduct);
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error('Server action error updating product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update product' 
    };
  }
}
