'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Product, Database } from '@/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, ArrowLeft, Star, Package, Truck, Shield, Share2, Check, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      // Check if product is in wishlist
      const checkWishlist = () => {
        // This will be handled by the wishlist context
      };
      checkWishlist();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        setError('Product not found');
        return;
      }

      if (data) {
        const productData = data as Database['public']['Tables']['products']['Row'];
        const processedProduct: Product = {
          id: productData.id,
          vendor_id: productData.vendor_id || '',
          name: productData.name || 'Unknown Product',
          description: productData.description || '',
          price: Number(productData.price) || 0,
          category: productData.category || 'General',
          images: Array.isArray(productData.images) ? productData.images : ['/images/placeholder-product.svg'],
          inventory_count: Number(productData.inventory_count) || 0,
          rating: productData.rating ? Number(productData.rating) : undefined,
          is_active: productData.is_active ?? true,
          status: productData.is_active ? 'active' : 'inactive',
          is_featured: productData.is_featured ?? false,
          created_at: productData.created_at || new Date().toISOString(),
          updated_at: productData.updated_at || new Date().toISOString()
        };

        setProduct(processedProduct);
        setSelectedImage(processedProduct.images[0] || '/images/placeholder-product.svg');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!user) {
      // Show authentication prompt instead of redirecting
      showError('Please sign in to add items to cart');
      return;
    }
    
    try {
      await addToCart(product.id, quantity);
      success(`Added ${quantity} × ${product.name} to cart!`);
      // Refresh the page to update header cart counter
      router.refresh();
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add to cart. Please try again.');
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    
    if (!user) {
      warning('Please sign in to add items to wishlist');
      return;
    }
    
    try {
      const inWishlist = isInWishlist(product.id);
      if (inWishlist) {
        await removeFromWishlist(product.id);
        success(`Removed ${product.name} from wishlist!`);
      } else {
        await addToWishlist(product.id);
        success(`Added ${product.name} to wishlist!`);
      }
      // Refresh the page to update wishlist state
      router.refresh();
    } catch (error) {
      console.error('Error updating wishlist:', error);
      showError('Failed to update wishlist. Please try again.');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      // Add to cart first (works for both authenticated and guest users)
      await addToCart(product.id, quantity);
      success(`Added ${quantity} × ${product.name} to cart! Redirecting to checkout...`);
      // Refresh the page to update header cart counter
      router.refresh();
      // Redirect to checkout page (guest checkout supported)
      router.push('/checkout');
    } catch (error) {
      console.error('Error in buy now:', error);
      showError('Failed to process purchase. Please try again.');
    }
  };

  const handleShare = async () => {
    if (product) {
      const url = window.location.href;
      const title = product.name;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: `Check out ${title} on Num1Store`,
            url
          });
        } catch (err) {
          // Share failed, continue with fallback
          console.warn('Share failed:', err);
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          success('Product link copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy link:', err);
          showError('Failed to copy link');
        }
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/products">
              <Button className="bg-green-600 hover:bg-green-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-green-600">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Product Images */}
          <div className="space-y-4 flex flex-col items-center">
            {/* Main Image */}
            <div className="w-full aspect-square max-w-[500px] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="relative w-full h-full">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
            
            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`flex-shrink-0 aspect-square w-20 h-20 lg:w-full lg:h-auto bg-gray-50 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        selectedImage === image 
                          ? 'border-orange-500 shadow-lg scale-105' 
                          : 'border-transparent hover:border-orange-300'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 80px, 100px"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              {/* Product Name and Actions */}
              <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3 font-serif">{product.name}</h1>
                {/* Category */}
                <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                  {product.category}
                </div>
              </div>
              
              {/* Wishlist and Share Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="p-3 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                  title="Share product"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </Button>
                <Button
                  onClick={handleAddToWishlist}
                  variant="outline"
                  className="p-3 border-gray-300 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                  title="Add to wishlist"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors duration-200 ${
                      product && isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
                    }`}
                  />
                </Button>
              </div>
            </div>

              {/* Price and Rating */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
                <div className="text-lg text-gray-500 line-through">
                  {formatPrice(product.price * 1.2)}
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  20% OFF
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (product.rating || 4.5)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-lg font-medium text-gray-700">
                  {product.rating || '4.5'}
                </span>
                <span className="ml-1 text-sm text-gray-500">(23 reviews)</span>
              </div>
            </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
              <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
                <Truck className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Free Delivery</span>
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Secure Payment</span>
              </div>
              <div className="flex items-center bg-purple-50 px-4 py-2 rounded-lg">
                <Package className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">7 Days Replacement</span>
              </div>
            </div>

              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Description</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-4">
                {product.inventory_count > 0 ? (
                  <div className="flex items-center text-green-600">
                    <Package className="h-5 w-5 mr-2" />
                    <span>In Stock ({product.inventory_count} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <Package className="h-5 w-5 mr-2" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.inventory_count > 0 && (
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity:
                  </label>
                  <div className="flex items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <div className="px-4 py-2 bg-white min-w-[60px] text-center font-bold text-gray-900 flex items-center justify-center">
                      {quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.inventory_count, quantity + 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                      disabled={quantity >= product.inventory_count}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.inventory_count <= 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg animate-pulse hover:animate-none"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {product.inventory_count <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  
                  <Button
                    onClick={handleBuyNow}
                    disabled={product.inventory_count <= 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg animate-pulse hover:animate-none"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {product.inventory_count <= 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>
                </div>
              
                {/* Stock Status with Enhanced Styling */}
                {product.inventory_count > 0 ? (
                  <div className="flex items-center justify-center bg-green-50 px-4 py-3 rounded-xl">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      {product.inventory_count > 10 ? 'In Stock' : `Only ${product.inventory_count} left in stock!`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center bg-red-50 px-4 py-3 rounded-xl">
                    <Package className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

            </div>
            </div>
            {/* Product Features */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Buy From Us?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <Truck className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Free Shipping</h4>
                  <p className="text-sm text-gray-600">On all orders above ₹500</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <Shield className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Secure Payment</h4>
                  <p className="text-sm text-gray-600">100% secure transactions</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <Package className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Quality Assured</h4>
                  <p className="text-sm text-gray-600">Premium quality products</p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <Link href="/products">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
