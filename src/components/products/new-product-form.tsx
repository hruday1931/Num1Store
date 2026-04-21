'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabaseClient } from '@/utils/supabase/client';
import { ImageManager } from './image-manager';

interface VendorData {
  id: string;
}

export function NewProductForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as File[]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  
  const checkStorageConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabaseClient().storage
        .from('product-images')
        .list('', { limit: 1 });
      
      if (error) {
        console.error('Storage connection check failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Storage connection error:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get the current user using Supabase auth
      const { data: { user: authUser }, error: authError } = await supabaseClient().auth.getUser();
      
      if (authError || !authUser?.id) {
        console.error('Auth Error:', authError);
        // Redirect to sign-in instead of just throwing an error
        router.push('/auth/signin');
        return;
      }

      console.log('Current user ID:', authUser.id);
      console.log('Using singleton Supabase client for product creation');
      
      // Get vendor ID for current user
      const { data: userVendor, error: vendorError } = await supabaseClient()
        .from('vendors')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (vendorError || !userVendor) {
        console.error('Vendor fetch error:', vendorError);
        throw new Error('Vendor account not found. Please set up your vendor profile first.');
      }
      
      const vendorId = (userVendor as VendorData).id;
      console.log('Found vendor for current user:', vendorId);

      // Check storage connection before uploading images
      if (formData.images.length > 0) {
        const isStorageConnected = await checkStorageConnection();
        if (!isStorageConnected) {
          throw new Error('Storage connection failed. Please try again later.');
        }
      }

      // Upload images if any
      const imageUrls: string[] = [];
      for (const image of formData.images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${vendorId}/${fileName}`;

        const { error: uploadError } = await supabaseClient().storage
          .from('product-images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabaseClient().storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      // Create product with proper vendor_id
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        inventory_count: parseInt(formData.stock),
        vendor_id: vendorId, // Use the current user's vendor ID
        images: imageUrls,
        is_active: true
      };
      
      console.log('Creating product with data:', productData);
      console.log('Vendor ID being used:', vendorId);
      console.log('User ID:', authUser.id);
      
      const { error: productError, data: productResult } = await supabaseClient()
        .from('products')
        .insert(productData as any)
        .select();
        
      console.log('Product insertion result:', { 
        productError, 
        productResult, 
        errorType: typeof productError,
        resultType: typeof productResult,
        errorKeys: productError ? Object.keys(productError) : 'null',
        resultLength: productResult ? productResult.length : 'null/undefined'
      });

      // Check if there's actually an error (not null/undefined/empty object)
      if (productError && productError !== null && Object.keys(productError).length > 0) {
        console.error('Product Creation Error Details:', productError);
        console.error('Full Error Object:', JSON.stringify(productError, null, 2));
        console.error('Error Code:', productError.code);
        console.error('Error Message:', productError.message);
        console.error('Error Details:', productError.details);
        console.error('Product Data Being Inserted:', productData);
        console.error('Vendor ID:', vendorId);
        console.error('User ID:', authUser.id);
        
        let errorMessage = 'Failed to create product: ';
        
        if (productError.code === '42501') {
          errorMessage += 'RLS permission denied. Check if your vendor subscription is active and you have insert privileges on the products table.';
        } else if (productError.message && productError.message.includes('row-level security')) {
          errorMessage += 'Row Level Security policy violation. Please check your vendor status and subscription.';
        } else if (productError.message) {
          errorMessage += productError.message;
        } else {
          errorMessage += 'Unknown error occurred.';
        }
        
        throw new Error(errorMessage);
      } else if (!productResult || productResult.length === 0) {
        // No error but also no result - this is unexpected
        console.error('Unexpected: No error and no product result');
        console.error('Product Data Being Inserted:', productData);
        throw new Error('Product creation failed: No data returned from database');
      } else {
        console.log('Product created successfully:', productResult);
      }

      // Show success message and redirect
      setSuccess('Product Created Successfully!');
      alert('Product Created Successfully!');
      router.push('/vendor/products');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="!text-black !bg-white border-2 border-gray-400 p-2 w-full"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="!text-black !bg-white border-2 border-gray-400 p-2 w-full"
            placeholder="Describe your product"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-black mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="!text-black !bg-white border-2 border-gray-400 p-2 w-full"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-black mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="!text-black !bg-white border-2 border-gray-400 p-2 w-full"
            >
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports & Outdoors</option>
              <option value="books">Books</option>
              <option value="toys">Toys & Games</option>
              <option value="food">Food & Beverages</option>
              <option value="health">Health & Beauty</option>
              <option value="automotive">Automotive</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-black mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              required
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              className="!text-black !bg-white border-2 border-gray-400 p-2 w-full"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Product Images
          </label>
          <ImageManager
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/vendor/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
