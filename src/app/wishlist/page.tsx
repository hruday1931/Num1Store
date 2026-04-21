'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useWishlist, useCart } from '@/contexts';
import { Product } from '@/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { wishlistItems, loading: wishlistLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const { success, error } = useToast();

  // Removed authentication redirect - allow browsing without signin

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) {
      error('Please sign in to manage your wishlist');
      return;
    }
    try {
      await removeFromWishlist(productId);
      success('Item removed from wishlist');
      // Refresh the page to update wishlist state
      router.refresh();
    } catch (err: unknown) {
      console.error('Error removing from wishlist:', err);
      error('Failed to remove item from wishlist');
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      error('Please sign in to add items to cart');
      return;
    }
    try {
      await addToCart(productId);
      success('Item added to cart successfully!');
      // Refresh the page to update header cart counter
      router.refresh();
    } catch (err: unknown) {
      console.error('Error adding to cart:', err);
      error('Failed to add item to cart');
    }
  };

  if (loading || wishlistLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="mt-2 text-gray-600">
                Sign in to view and manage your wishlist
              </p>
            </div>
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to view your wishlist</h2>
              <p className="text-gray-600 mb-6">Save your favorite items and never lose track of what you love</p>
              <div className="space-x-4">
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/products')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="mt-2 text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
            </p>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">Start adding items you love to your wishlist</p>
              <Button
                onClick={() => router.push('/products')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/products/${item.product_id}`} className="block">
                    <div className="h-64 bg-gray-100 rounded-t-lg overflow-hidden">
                      {item.products?.images && item.products.images.length > 0 ? (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link href={`/products/${item.product_id}`} className="block">
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors cursor-pointer">{item.products?.name || 'Product Name Not Available'}</h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.products?.description || 'Product description not available'}</p>
                    <p className="text-2xl font-bold text-green-600 mb-4">₹{(item.products?.price || 0).toFixed(2)}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item.product_id)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => handleRemoveFromWishlist(item.product_id)}
                        size="sm"
                        variant="outline"
                        className="p-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
