'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { Search, ArrowLeft, ShoppingBag, Filter } from 'lucide-react';
import { supabaseClient } from '@/utils/supabase/client';
import { Product } from '@/types';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('search') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const supabase = supabaseClient();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchLower = query.toLowerCase();
        
        let queryBuilder = supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        // Search in name, description, and category
        queryBuilder = queryBuilder.or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%,category.ilike.%${searchLower}%`);

        // Apply sorting
        switch (sortBy) {
          case 'name':
            queryBuilder = queryBuilder.order('name', { ascending: true });
            break;
          case 'price_low':
            queryBuilder = queryBuilder.order('price', { ascending: true });
            break;
          case 'price_high':
            queryBuilder = queryBuilder.order('price', { ascending: false });
            break;
          case 'created_at':
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
            break;
          default:
            queryBuilder = queryBuilder.order('name', { ascending: true });
        }

        const { data, error } = await queryBuilder;

        if (error) {
          console.error('Error fetching products:', error);
          setError('Failed to fetch products. Please try again.');
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, sortBy]);

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {query ? `Search Results for "${query}"` : 'Search Products'}
                </h1>
              </div>
            </div>
            
            {products.length > 0 && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="created_at">Newest First</option>
                </select>
              </div>
            )}
          </div>
          
          {query && (
            <p className="text-gray-600">
              Found {products.length} product{products.length !== 1 ? 's' : ''} matching your search
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && query && products.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No results found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching "{query}". Try searching with different keywords.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button className="w-full sm:w-auto">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse All Products
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty Search */}
        {!loading && !error && !query && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Search for Products</h2>
              <p className="text-gray-600 mb-6">
                Use the search bar above to find products you're looking for.
              </p>
            </div>
            
            <Link href="/products">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse All Products
              </Button>
            </Link>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
