'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useToast } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { uploadImage } from '@/utils/storage';
import { EditImageManager } from '@/components/products/edit-image-manager';

export default function EditProductPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inventory_count: '',
    images: [] as string[],
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const productId = params.id;

  useEffect(() => {
    if (productId && user) {
      fetchProduct();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, router, productId]);

  const fetchProduct = async () => {
    if (!user?.id) return;
    
    try {
      // Get vendor ID first
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendor) {
        showError('Vendor account not found');
        router.push('/vendor/products');
        return;
      }

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('vendor_id', (vendor as any).id)
        .single();

      if (productError || !productData) {
        showError('Product not found or you do not have permission to edit it');
        router.push('/vendor/products');
        return;
      }

      setProduct(productData);
      setVendorId((vendor as any).id);
      const productImages = (productData as any).images || [];
      setFormData({
        name: (productData as any).name || '',
        description: (productData as any).description || '',
        price: (productData as any).price?.toString() || '',
        category: (productData as any).category || '',
        inventory_count: (productData as any).inventory_count?.toString() || '',
        images: productImages,
        is_active: (productData as any).is_active ?? true
      });
      
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Client-side authentication check before making any calls
      if (!user?.id) {
        console.error('Client-side: No authenticated user found');
        showError('Please sign in to update products');
        setIsSubmitting(false);
        return;
      }

      if (!vendorId) {
        console.error('Client-side: No vendor ID found');
        showError('Vendor account not found');
        setIsSubmitting(false);
        return;
      }

      let updatedImages = [...formData.images];
      
      // Handle new image uploads
      if (newImages.length > 0) {
        setIsUploadingImage(true);
        try {
          const uploadedUrls: string[] = [];
          for (const file of newImages) {
            const url = await uploadProductImage(file);
            uploadedUrls.push(url);
          }
          // Combine existing images with newly uploaded ones
          updatedImages = [...updatedImages, ...uploadedUrls];
        } catch (error) {
          console.error('Image upload failed:', error);
          showError('Failed to upload images');
          setIsUploadingImage(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        inventory_count: parseInt(formData.inventory_count),
        images: updatedImages,
        is_active: formData.is_active
      };

      // Log IDs for debugging
      console.log('=== UPDATE DEBUG ===');
      console.log('Current User ID:', user?.id);
      console.log('Product Vendor ID:', vendorId);
      console.log('Product ID:', productId);
      console.log('Update Data:', updateData);
      console.log('==================');

      // Import the server action dynamically to avoid client-side issues
      const { updateProduct } = await import('@/app/vendor/products/edit/[id]/actions');
      
      const result = await updateProduct(productId, updateData);

      if (result.success) {
        success('Product updated successfully!');
        router.push('/vendor/products');
      } else {
        // Handle authentication-specific errors
        if (result.requiresAuth) {
          showError('Your session has expired. Please sign in again.');
          // Optionally redirect to sign-in page after a delay
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        } else {
          showError(result.error || 'Failed to update product');
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleDeleteCurrentImage = async () => {
    try {
      // Client-side authentication check
      if (!user?.id) {
        console.error('Client-side: No authenticated user found for image delete');
        showError('Please sign in to delete product images');
        setShowDeleteConfirm(false);
        return;
      }

      if (!vendorId) {
        console.error('Client-side: No vendor ID found for image delete');
        showError('Vendor account not found');
        setShowDeleteConfirm(false);
        return;
      }

      // Log IDs for debugging
      console.log('=== DELETE IMAGE DEBUG ===');
      console.log('Current User ID:', user?.id);
      console.log('Product Vendor ID:', vendorId);
      console.log('Product ID:', productId);
      console.log('========================');

      // Update product to remove all images (set images array to empty)
      const updateData = {
        images: [] // Set images array to empty, not null (database uses TEXT[])
      };

      const { updateProduct } = await import('@/app/vendor/products/edit/[id]/actions');
      const result = await updateProduct(productId, updateData);

      if (result.success) {
        // Update local state
        setFormData(prev => ({ ...prev, images: [] }));
        success('Product image deleted successfully!');
      } else {
        // Handle authentication-specific errors
        if (result.requiresAuth) {
          showError('Your session has expired. Please sign in again.');
          // Optionally redirect to sign-in page after a delay
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        } else {
          showError(result.error || 'Failed to delete product image');
        }
      }
    } catch (error) {
      console.error('Error deleting product image:', error);
      showError('Failed to delete product image');
    }
    setShowDeleteConfirm(false);
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (vendorError || !vendor) {
      throw new Error('Vendor account not found');
    }
    
    const result = await uploadImage(
      file,
      'product-images',
      (vendor as any).id,
      formData.name || 'product',
      user
    );
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to edit products in your store.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/vendor/products')}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vendor/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Product
          </h1>
          <p className="mt-2 text-gray-600">
            Update the product information below.
          </p>
        </div>

        {/* Product Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter product name"
                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Enter product description"
                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-600"
              />
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-black mb-1">
                  Price (§) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-600"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-black mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                >
                  <option value="" className="text-gray-600">Select a category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Food">Food</option>
                  <option value="Books">Books</option>
                  <option value="Home">Home</option>
                  <option value="Sports">Sports</option>
                  <option value="Toys">Toys</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Product Images
              </label>
              <EditImageManager
                existingImages={formData.images}
                newImages={newImages}
                onExistingImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                onNewImagesChange={setNewImages}
              />
            </div>

            {/* Inventory */}
            <div>
              <label htmlFor="inventory_count" className="block text-sm font-medium text-black mb-1">
                Inventory Count *
              </label>
              <input
                type="number"
                id="inventory_count"
                name="inventory_count"
                value={formData.inventory_count}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-gray-600"
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-black">
                Product is active (visible to customers)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/vendor/products"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : isUploadingImage ? 'Uploading Image...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Product Image
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product image? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentImage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
