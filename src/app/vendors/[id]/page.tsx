'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/products';
import { Store, Package, MapPin, Star, ArrowLeft } from 'lucide-react';
import { supabaseClient } from '@/utils/supabase/client';
import { Product } from '@/types';

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  phone_number?: string;
  pickup_address?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}


export default function VendorPage() {
  const params = useParams();
  const vendorId = params.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = supabaseClient();

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vendor data
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .eq('is_approved', true)
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        setError('Vendor not found');
        return;
      }

      if (!vendorData) {
        setError('Vendor not found');
        return;
      }

      setVendor(vendorData);

      // Fetch vendor's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        // Don't set error for products, just show empty state
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendor store...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-black mb-2">Vendor Not Found</h1>
            <p className="text-gray-600 mb-6">
              The vendor store you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/vendors"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Vendor Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
              {/* Vendor Logo */}
              <div className="flex-shrink-0">
                {vendor.store_logo ? (
                  <div className="w-24 h-24 md:w-32 md:h-32 relative rounded-lg overflow-hidden border-4 border-white shadow-lg">
                    <Image
                      src={vendor.store_logo}
                      alt={vendor.store_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                    <Store className="h-12 w-12 md:h-16 md:w-16 text-green-600" />
                  </div>
                )}
              </div>

              {/* Vendor Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                  {vendor.store_name}
                </h1>
                
                {vendor.store_description && (
                  <p className="text-lg text-green-100 mb-4 max-w-2xl">
                    {vendor.store_description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                  <div className="flex items-center text-green-100">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Verified Vendor</span>
                  </div>
                  
                  <div className="flex items-center text-green-100">
                    <Package className="h-4 w-4 mr-1" />
                    <span>{products.length} Products</span>
                  </div>
                  
                  <div className="flex items-center text-green-100">
                    <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>4.5 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/vendors"
            className="inline-flex items-center text-black hover:text-gray-600 font-medium transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Vendors
          </Link>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">
              Products from {vendor.store_name}
            </h2>
            <p className="text-gray-600">
              Browse all products offered by this vendor
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">No Products Available</h3>
              <p className="text-gray-600">
                This vendor hasn't added any products yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
