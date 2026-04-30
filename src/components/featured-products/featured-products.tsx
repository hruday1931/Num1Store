'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { supabase, refreshSupabaseClient } from '@/lib/supabase';
import { Product } from '@/types';
import { ShoppingCart, Heart, Star, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';

interface FeaturedProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isBuyLoading, setIsBuyLoading] = useState(false);
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  
  // Check if product is in wishlist
  useEffect(() => {
    setIsWishlisted(isInWishlist(product.id));
  }, [isInWishlist, product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      warning('Please sign in to add items to cart');
      return;
    }
    
    setIsCartLoading(true);
    try {
      await addToCart(product.id);
      success('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      error('Failed to add to cart. Please try again.');
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      warning('Please sign in to purchase items');
      return;
    }
    
    setIsBuyLoading(true);
    try {
      await addToCart(product.id);
      success('Added to cart! Redirecting to checkout...');
      // Redirect to cart immediately
      window.location.href = '/cart';
    } catch (err) {
      console.error('Error adding to cart:', err);
      error('Failed to add to cart. Please try again.');
    } finally {
      setIsBuyLoading(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      warning('Please sign in to add items to wishlist');
      return;
    }
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        success(`${product.name} removed from wishlist!`);
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
        success(`${product.name} added to wishlist!`);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      error('Failed to update wishlist. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
      {/* Product Link Wrapper */}
      <Link href={`/products/${product.id}`} className="block">
      {/* Product Image */}
      <div className="relative w-full h-40 overflow-hidden bg-gray-50">
        {product.images && product.images.length > 0 && !imageError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Image
              src="/images/placeholder-product.svg"
              alt="No product image"
              fill
              className="object-contain opacity-50"
            />
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={handleAddToWishlist}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          />
        </button>

        {/* Stock Status */}
        {product.inventory_count <= 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <div className="min-h-[2.5rem]">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 font-sans">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-bold text-emerald-600">
            {formatPrice(product.price)}
          </div>
          
          {/* Rating */}
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-xs text-gray-600">4.5</span>
          </div>
        </div>

        {/* Stock Count */}
        {product.inventory_count > 0 && product.inventory_count <= 5 && (
          <div className="mt-1 text-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-800">
              Only {product.inventory_count} left!
            </span>
          </div>
        )}
      </div>
      </Link>
      
      {/* Action Buttons - Outside Link */}
      <div className="p-3 pt-0">
        <div className="flex flex-row w-full gap-1">
          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.inventory_count <= 0 || isCartLoading || isBuyLoading}
            className="flex-1 h-11 min-h-[44px] bg-[#10b981] hover:bg-[#059669] text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md font-bold text-xs uppercase shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-row items-center justify-center gap-1"
          >
            {isCartLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <>
                <ShoppingCart className="h-3 w-3" />
                <span>{product.inventory_count <= 0 ? 'OUT' : 'CART'}</span>
              </>
            )}
          </button>

          {/* Buy Now Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={product.inventory_count <= 0 || isCartLoading || isBuyLoading}
            className="flex-1 h-11 min-h-[44px] bg-[#db2777] hover:bg-[#be185d] text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md font-bold text-xs uppercase shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-row items-center justify-center gap-1"
          >
            {isBuyLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                <span>{product.inventory_count <= 0 ? 'OUT' : 'BUY'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async (refreshSchema = false) => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Featured products loading timeout - using fallback data');
      setProducts([
        {
          id: '1',
          vendor_id: 'demo-vendor',
          name: 'Sample Product 1',
          description: 'This is a sample product for demonstration',
          price: 999,
          category: 'Electronics',
          images: ['/images/placeholder-product.svg'],
          inventory_count: 10,
          rating: 4.5,
          status: 'active',
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      setError(null);
      setLoading(false);
    }, 800); // Reduced to 0.8 second timeout for faster loading for faster loading

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching featured products from Supabase...', { refreshSchema });
      
      // Refresh schema cache if requested
      if (refreshSchema) {
        console.log('Refreshing Supabase schema cache...');
        refreshSupabaseClient();
        // Wait a moment for the new client to initialize
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Fetch latest products (same query as products page) with caching - only active products
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6); // Reduced from 8 to 6 for faster loading

      // Handle schema cache issues by trying once more with a fresh query
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('Schema cache issue detected, retrying with fresh connection...');
        // Wait a moment and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResult = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6); // Reduced from 8 to 6 for faster loading
        data = retryResult.data;
        error = retryResult.error;
      }

      // If still has column errors, fall back to basic query
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('Column still missing, falling back to basic query');
        const fallbackResult = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6); // Reduced from 8 to 6 for faster loading
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching featured products:', error);
        setError(`Failed to load featured products: ${error.message}`);
        // Use fallback data on error
        setProducts([
          {
            id: '1',
            vendor_id: 'demo-vendor',
            name: 'Sample Product 1',
            description: 'This is a sample product for demonstration',
            price: 999,
            category: 'Electronics',
            images: ['/images/placeholder-product.svg'],
            inventory_count: 10,
            rating: 4.5,
            status: 'active',
            is_active: true,
            is_featured: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        return;
      }

      console.log('Featured products data received:', data?.length || 0, 'items');

      // Process and validate data
      const processedData = (data || []).map((item: any): Product => ({
        id: item.id || '',
        vendor_id: item.vendor_id || '',
        name: item.name || 'Unknown Product',
        description: item.description || '',
        price: Number(item.price) || 0,
        category: item.category || 'General',
        images: Array.isArray(item.images) ? item.images : ['/images/placeholder-product.svg'],
        inventory_count: Number(item.inventory_count) || 0,
        rating: item.rating ? Number(item.rating) : undefined,
        status: item.status || 'active',
        is_active: item.is_active ?? true,
        is_featured: item.is_featured ?? false,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      })); // Only active products are fetched from database

      // If no products found, use fallback data
      if (processedData.length === 0) {
        setProducts([
          {
            id: '1',
            vendor_id: 'demo-vendor',
            name: 'Sample Product 1',
            description: 'This is a sample product for demonstration',
            price: 999,
            category: 'Electronics',
            images: ['/images/placeholder-product.svg'],
            inventory_count: 10,
            rating: 4.5,
            status: 'active',
            is_active: true,
            is_featured: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } else {
        setProducts(processedData);
      }
      
      console.log('Processed featured products:', processedData.length, 'items');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Unexpected error fetching featured products:', err);
      setError('An unexpected error occurred. Please try again later.');
      // Use fallback data on any error
      setProducts([
        {
          id: '1',
          vendor_id: 'demo-vendor',
          name: 'Sample Product 1',
          description: 'This is a sample product for demonstration',
          price: 999,
          category: 'Electronics',
          images: ['/images/placeholder-product.svg'],
          inventory_count: 10,
          rating: 4.5,
          status: 'active',
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  
  if (loading) {
    return (
      <div className="bg-[#F0FFF0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto rounded-full"></div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-64 animate-pulse">
                <div className="bg-white rounded-lg p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F0FFF0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => fetchFeaturedProducts(true)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#F0FFF0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600">No featured products available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F0FFF0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Featured Products Slider */}
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            nextEl: '.featured-nav-next',
            prevEl: '.featured-nav-prev',
          }}
          breakpoints={{
            480: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 32,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 40,
            },
          }}
          className="featured-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <FeaturedProductCard
                product={product}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-2 mt-6">
          <button className="featured-nav-prev w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="featured-nav-next w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
