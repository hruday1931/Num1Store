'use client';

import { NewProductForm } from '@/components/products/new-product-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No automatic redirect - let the user choose to sign in
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Product</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to add new products to your store.
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
            Add New Product
          </h1>
          <p className="mt-2 text-gray-600">
            Fill in the details below to add a new product to your store.
          </p>
        </div>

        {/* Product Form */}
        <NewProductForm />
      </div>
    </div>
  );
}
