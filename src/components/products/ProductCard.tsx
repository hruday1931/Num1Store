'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star, ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ 
  product 
}: ProductCardProps) {
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
      // Redirect to cart/checkout immediately
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
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
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
        {/* Category */}
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
          {product.category}
        </div>

        {/* Product Name */}
        <div className="min-h-[2.5rem]">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 font-sans">
            {product.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
          {product.description}
        </p>

        {/* Price and Rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-bold text-emerald-600">
            {formatPrice(product.price)}
          </div>
          
          {/* Rating Placeholder */}
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-600">4.5</span>
            <span className="ml-1 text-xs text-gray-400">(23)</span>
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
