'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Store, MapPin, Star } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { supabaseClient } from '@/utils/supabase/client';

interface Vendor {
  id: string;
  store_name: string;
  store_description: string;
  store_logo: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = supabaseClient();

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter(vendor =>
      vendor.store_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_approved', true)
        .order('store_name');

      if (error) {
        console.error('Error fetching vendors:', error);
        return;
      }

      setVendors(data || []);
      setFilteredVendors(data || []);
    } catch (error) {
      console.error('Error:', error);
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
            <p className="mt-4 text-gray-600">Loading vendors...</p>
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
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white mt-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Our <span className="text-yellow-400">Vendors</span>
              </h1>
              <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
                Discover amazing products from our trusted and verified vendors
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search vendors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-16">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No vendors found' : 'No vendors available at the moment.'}
              </h2>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try adjusting your search terms to find more vendors.'
                  : 'Check back soon to see our amazing vendors!'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  {searchQuery ? `Found ${filteredVendors.length} vendor${filteredVendors.length !== 1 ? 's' : ''}` : 'All Vendors'}
                </h2>
                <p className="text-gray-600 mt-2">
                  Browse our curated selection of trusted sellers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                  >
                    {/* Vendor Logo */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {vendor.store_logo ? (
                        <img
                          src={vendor.store_logo}
                          alt={vendor.store_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-green-100 rounded-full p-4">
                          <Store className="h-12 w-12 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Vendor Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-black mb-2 line-clamp-1">
                        {vendor.store_name}
                      </h3>
                      
                      {vendor.store_description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {vendor.store_description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Verified Vendor</span>
                      </div>

                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="block w-full bg-black text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                      >
                        Visit Store
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
