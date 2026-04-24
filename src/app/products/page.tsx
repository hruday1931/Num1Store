'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { ProductCard } from '@/components/products';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Loader2, Package, Filter, ChevronDown, X } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Read category and search from URL and update state
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching products from Supabase...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setError(`Failed to load products: ${error.message}`);
        return;
      }

      console.log('Products data received:', data?.length || 0, 'items');

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

      setProducts(processedData);
      setFilteredProducts(processedData);
      console.log('Processed products:', processedData.length, 'items');
    } catch (err) {
      console.error('Unexpected error fetching products:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  
  const categories = ['all', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Gaming', 'electronics', 'fashion', 'home-living', 'beauty', 'sports', 'toys-games'];
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-1000', label: 'Under ₹1000' },
    { value: '1000-2500', label: '₹1000 - ₹2500' },
    { value: '2500-5000', label: '₹2500 - ₹5000' },
    { value: '5000+', label: 'Over ₹5000' }
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category - handle both slugs and names
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        const productCategory = product.category.toLowerCase();
        const selectedCategoryLower = selectedCategory.toLowerCase();
        
        // Direct match
        if (productCategory === selectedCategoryLower) {
          return true;
        }
        
        // Slug to name mapping
        const slugToName: Record<string, string> = {
          'electronics': 'electronics',
          'fashion': 'fashion',
          'home-living': 'home',
          'beauty': 'beauty',
          'sports': 'sports',
          'toys-games': 'gaming'
        };
        
        const mappedName = slugToName[selectedCategoryLower];
        if (mappedName && productCategory === mappedName) {
          return true;
        }
        
        // Check if product category contains the selected category
        return productCategory.includes(selectedCategoryLower) || 
               selectedCategoryLower.includes(productCategory);
      });
    }

    // Filter by price range
    if (priceRange !== 'all') {
      if (priceRange === '0-1000') {
        filtered = filtered.filter(product => product.price < 1000);
      } else if (priceRange === '1000-2500') {
        filtered = filtered.filter(product => product.price >= 1000 && product.price < 2500);
      } else if (priceRange === '2500-5000') {
        filtered = filtered.filter(product => product.price >= 2500 && product.price < 5000);
      } else if (priceRange === '5000+') {
        filtered = filtered.filter(product => product.price >= 5000);
      }
    }

    // Sort products
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // 'newest' is already the default order from the database

    setFilteredProducts(filtered);
  }, [products, selectedCategory, priceRange, sortBy, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('newest');
    setSearchQuery('');
    // Update URL to remove search parameter
    window.history.replaceState({}, '', '/products');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E6E6FA]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E6E6FA]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Products</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-[#E6E6FA]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h2>
              <p className="text-gray-600 mb-4">
                There are currently no products available. Check back later!
              </p>
              <button
                onClick={fetchProducts}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6E6FA]">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Collection'}
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-3 rounded-full"></div>
            </h1>
            <p className="text-gray-600 mt-4">
              {searchQuery 
                ? `Found ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} matching your search`
                : 'Discover amazing products from our trusted vendors'
              }
            </p>
            <div className="text-sm text-gray-500 mt-2">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors sm:hidden"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {isFilterOpen ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map(category => {
                    if (category === 'all') {
                      return (
                        <label key="all" className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            value="all"
                            checked={selectedCategory === 'all'}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mr-2 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-600">
                            All Categories
                          </span>
                        </label>
                      );
                    }
                    
                    // Map slugs to display names
                    const displayNames: Record<string, string> = {
                      'electronics': 'Electronics',
                      'fashion': 'Fashion',
                      'home': 'Home & Living',
                      'beauty': 'Beauty',
                      'sports': 'Sports',
                      'gaming': 'Toys & Games',
                      'home-living': 'Home & Living',
                      'toys-games': 'Toys & Games'
                    };
                    
                    return (
                      <label key={category} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-2 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-600">
                          {displayNames[category] || category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                <div className="space-y-2">
                  {priceRanges.map(range => (
                    <label key={range.value} className="flex items-center">
                      <input
                        type="radio"
                        name="price"
                        value={range.value}
                        checked={priceRange === range.value}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No Products Found' : 'No Products Found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? `No products match "${searchQuery}". Try different keywords or browse all products.`
                    : 'Try adjusting your filters to see more products.'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  {searchQuery ? 'Browse All Products' : 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E6E6FA]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
