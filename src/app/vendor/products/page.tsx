'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { Product, Database } from '@/types';
import { 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  Search,
  Filter,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function VendorProducts() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [vendorData, setVendorData] = useState<any>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get vendor ID first
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        return;
      }

      if (!vendor) {
        console.warn('No vendor found for user:', user.id);
        return;
      }

      setVendorData(vendor);

      // Fetch products for this vendor with no-store cache for real-time data
      let query = supabase
        .from('products')
        .select('*', { count: 'exact', head: false })
        .eq('vendor_id', (vendor as any).id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus === 'active') {
        query = query.eq('is_active', true);
      } else if (filterStatus === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Execute query with real-time data fetching (no cache)
      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, [user?.id, filterStatus]);

  const checkVendorAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is a vendor - remove subscription requirement for now
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_vendor')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        router.push('/vendor');
        return;
      }
      
      if (!(profile as any)?.is_vendor) {
        router.push('/vendor');
        return;
      }

      await fetchProducts();
      
      // Additional refresh to ensure we have the latest data after navigation
      setTimeout(() => {
        fetchProducts();
      }, 200);
    } catch (error) {
      console.error('Error checking vendor access:', error);
      router.push('/vendor');
    } finally {
      setLoading(false);
    }
  }, [user, router, fetchProducts]);

  useEffect(() => {
    checkVendorAccess();
  }, [checkVendorAccess]);

  // Additional effect to handle immediate refresh when page becomes visible
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // This event fires when the user navigates back to the page
      if (event.persisted && user?.id) {
        // Force immediate refresh to get latest data
        fetchProducts();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [fetchProducts, user?.id]);

  // Add a listener for navigation events to refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchProducts();
      }
    };

    const handleFocus = () => {
      if (user?.id) {
        fetchProducts();
      }
    };

    // Listen for navigation events (when user comes back from edit page)
    const handleNavigation = () => {
      if (user?.id) {
        // Small delay to ensure any server-side revalidation has taken effect
        setTimeout(() => {
          fetchProducts();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handleNavigation);
    
    // Also check for route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [fetchProducts, user?.id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
      await fetchProducts();
    } finally {
      setIsRefreshing(false);
    }
  };


  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    setIsTogglingStatus(productId);
    
    // Status Values: Use boolean values for is_active column
    const newStatus = !currentStatus;
    
    console.log(`[DEBUG] Toggling product ${productId} from ${currentStatus} to ${newStatus}`);
    console.log(`[DEBUG] User ID: ${user?.id}`);
    console.log(`[DEBUG] Vendor ID: ${vendorData?.id}`);
    
    // Auth Debug: Check if auth.uid() matches vendor_id of the product
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('[DEBUG] Auth error:', authError);
      }
      
      if (!session) {
        console.error('[ERROR] No active session - user not authenticated');
        showError('You must be logged in to update products');
        return;
      }
      
      // Get the product to verify ownership
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('vendor_id')
        .eq('id', productId)
        .single() as { data: { vendor_id: string } | null, error: any };
      
      if (productError) {
        console.error('[ERROR] Failed to fetch product:', productError);
        showError('Failed to verify product ownership');
        return;
      }
      
      console.log(`[DEBUG] Product vendor_id: ${productData?.vendor_id}`);
      console.log(`[DEBUG] Auth user ID matches vendor_id: ${session.user.id === productData?.vendor_id}`);
      
      if (!vendorData?.id) {
        console.error('[ERROR] No vendor data available');
        showError('Vendor information not found');
        return;
      }
      
      // Optimistic UI Update: Update local state immediately
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, is_active: newStatus, status: newStatus ? 'active' : 'inactive', updated_at: new Date().toISOString() }
            : product
        )
      );

      // Update Logic: Target the 'is_active' column with boolean values
      console.log(`[DEBUG] Attempting database update with is_active column...`);
      
      const { data, error } = await (supabase
        .from('products') as any)
        .update({ is_active: newStatus })
        .eq('id', productId)
        .eq('vendor_id', vendorData.id);

      console.log(`[DEBUG] Update result:`, { data, error });

      // Prevent Revert: Only update if !error is true
      if (!error) {
        console.log(`[SUCCESS] Database update completed successfully`);
        // Show success toast
        const productName = products.find(p => p.id === productId)?.name || 'Product';
        success(`Product ${newStatus ? 'activated' : 'deactivated'}: ${productName}`);
        
        // Only refresh the list if !error is true
        console.log(`[DEBUG] Refreshing data after successful update...`);
        await fetchProducts();
      } else {
        console.error('[ERROR] Database update failed:', error);
        
        // Revert optimistic update on error
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, is_active: currentStatus, status: currentStatus ? 'active' : 'inactive', updated_at: new Date().toISOString() }
              : product
          )
        );
        
        // Show error in toast
        const errorMessage = error?.message || 'Failed to update product status';
        showError(`Failed to update product: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('[CATCH] Unexpected error in toggleProductStatus:', error);
      
      // Revert optimistic update on catch error
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, is_active: currentStatus, status: currentStatus ? 'active' : 'inactive', updated_at: new Date().toISOString() }
            : product
        )
      );
      
      // Show detailed error in toast
      const errorMessage = error?.message || 'Failed to update product status';
      showError(`Unexpected error: ${errorMessage}`);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const handleViewProduct = (productId: string) => {
    window.open(`/products/${productId}`, '_blank');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/vendor/products/edit/${productId}`);
  };

  const handleTrackOrders = async (productId: string) => {
    try {
      // Fetch orders containing this specific product with corrected query
      const { data, error } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('product_id', productId);

      if (error) {
        console.error('Detailed Order Error:', error.message, error.details);
        alert('Failed to fetch orders for this product.');
        return;
      }

      if (!data || data.length === 0) {
        // Show friendly toast message instead of error
        alert('No orders found for this product yet.');
        return;
      }

      // Format and display orders with proper typing
      const ordersList = data.map((item: any) => {
        const order = item.orders;
        return `
Order ID: #${order.id?.slice(0, 8) || 'N/A'}
Customer: ${order.customer_id?.slice(0, 8) || 'Unknown'}
Quantity: ${item.quantity}
Price: ${formatIndianCurrency(item.price)}
Total: ${formatIndianCurrency(order.total_amount)}
Status: ${order.status}
Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}
        `.trim();
      }).join('\n\n---\n\n');

      alert(`Orders for this product:\n\n${ordersList}`);
    } catch (error: any) {
      console.error('Detailed Order Error:', error?.message || error, error?.details);
      alert('Failed to track orders. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatIndianCurrency = (amount: number) => {
    return `Rs.${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-black">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Package className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">My Products</h1>
          <p className="text-black opacity-80 mb-6">
            Please sign in to manage your products and inventory.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/')}
              className="border border-gray-300 text-black hover:bg-gray-50 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-red-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">My Products</h2>
            <p className="text-black opacity-80">
              Manage your product inventory and listings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-3 rounded-lg font-medium flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh products list"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/vendor/products/new"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black mb-1">Total Products</p>
              <p className="text-3xl font-bold text-black">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black mb-1">Active Products</p>
              <p className="text-3xl font-bold text-green-600">
                {products.filter(p => p.is_active).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black mb-1">Inactive Products</p>
              <p className="text-3xl font-bold text-gray-600">
                {products.filter(p => !p.is_active).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-black placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                filterStatus === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                filterStatus === 'active'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Active ({products.filter(p => p.is_active).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                filterStatus === 'inactive'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Inactive ({products.filter(p => !p.is_active).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Price</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Stock</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black line-clamp-1">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-black">
                        {formatIndianCurrency(product.price)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`text-sm font-medium ${
                        product.inventory_count > 10 
                          ? 'text-green-600' 
                          : product.inventory_count > 0 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {product.inventory_count} units
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        disabled={isTogglingStatus === product.id}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 relative ${
                          product.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-md'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {isTogglingStatus === product.id ? (
                          <>
                            {/* Loading Overlay: Add loading spinner on the badge while update is in progress */}
                            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                            </div>
                            <span className="opacity-0">Loading...</span>
                          </>
                        ) : product.is_active ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewProduct(product.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View product page"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTrackOrders(product.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                          title="Track orders"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first product to your store'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                href="/vendor/products/new"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Product
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
