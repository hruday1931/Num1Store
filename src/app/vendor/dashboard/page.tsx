'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  IndianRupee,
  ShoppingBag, 
  Star,
  Settings,
  Store
} from 'lucide-react';
import Link from 'next/link';

// TypeScript interfaces
interface OrderItem {
  price: number;
  quantity: number;
  order_id: string;
}

interface Product {
  id: string;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItemWithOrder {
  order_id: string;
  orders: Order;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [storeRating, setStoreRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingStats) {
      console.log('Already fetching dashboard stats, skipping...');
      return;
    }

    try {
      if (!user?.id) {
        console.log('No user ID available, skipping dashboard stats fetch');
        setActiveProducts(0);
        setTotalOrders(0);
        setTotalSales(0);
        setRecentOrders([]);
        return;
      }

      setIsFetchingStats(true);

      // First get the vendor record for this user
      let vendorId: string | null = null;
      try {
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (vendorError) {
          console.error('Error fetching vendor record:', vendorError);
          console.error('Vendor error details:', JSON.stringify(vendorError, null, 2));
          setActiveProducts(0);
          setTotalOrders(0);
          setTotalSales(0);
          setRecentOrders([]);
          return;
        }
        
        vendorId = (vendorRecord as { id: string })?.id || null;
        if (!vendorId) {
          console.warn('No vendor record found for user:', user.id);
          setActiveProducts(0);
          setTotalOrders(0);
          setTotalSales(0);
          setRecentOrders([]);
          return;
        }
      } catch (error) {
        console.error('Unexpected error fetching vendor record:', error);
        setActiveProducts(0);
        setTotalOrders(0);
        setTotalSales(0);
        setRecentOrders([]);
        return;
      }

      // Get active products count filtering by vendor ID (not user ID)
      // Using regular select instead of count to avoid RLS issues with head: true
      let vendorProductIds: string[] = [];
      let productsData: any[] | null = null;
      let productsError: any = null;

      // First try to get products with status filter (active products)
      let useFallback = false;
      
      // Validate vendorId before making any queries
      if (!vendorId) {
        console.warn('No vendorId available for products query');
        productsError = { message: 'No vendor ID available' };
      } else {
        try {
          const result = await supabase
            .from('products')
            .select('id')
            .eq('vendor_id', vendorId)
            .eq('status', 'active');
          
          productsData = result.data;
          productsError = result.error;
          
          // If status column doesn't exist, set fallback flag
          if (productsError && productsError.code === '42703' && productsError.message && productsError.message.includes('column products.status does not exist')) {
            console.warn('status column does not exist, using fallback query');
            useFallback = true;
          }
        } catch (error) {
          // If there's a catch error, use fallback
          console.warn('Error with status filter, using fallback query:', error);
          useFallback = true;
        }
      }

      // Use fallback query if needed
      if (useFallback) {
        // Validate vendorId before making query
        if (!vendorId) {
          console.warn('No vendorId available for fallback query');
          productsError = { message: 'No vendor ID available' };
        } else {
          try {
            const fallbackResult = await supabase
              .from('products')
              .select('id')
              .eq('vendor_id', vendorId);
            
            productsData = fallbackResult.data;
            productsError = fallbackResult.error;
          } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            productsError = fallbackError as any;
          }
        }
      }

      if (productsError) {
        // Only log detailed errors for non-column-missing issues
        if (!useFallback && (productsError.message || Object.keys(productsError).length > 0)) {
          console.error('Error fetching products count:', productsError);
          console.error('Products error details:', JSON.stringify(productsError, null, 2));
          console.error('Query details:', { vendorId });
        }
        setActiveProducts(0); // Handle error by setting count to 0
      } else {
        const productsCount = productsData ? productsData.length : 0;
        setActiveProducts(productsCount);
        vendorProductIds = productsData ? productsData.map((p: any) => p.id) : [];
      }

      // Only fetch orders if vendor has products
      if (vendorProductIds.length === 0) {
        setTotalOrders(0);
      } else {
        // Get total orders count (through order_items linking to vendor's products)
        const { data: vendorOrderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id')
          .in('product_id', vendorProductIds);

        if (orderItemsError) {
          console.error('Error fetching orders count:', orderItemsError);
          setTotalOrders(0);
        } else {
          const uniqueOrderIds = [...new Set((vendorOrderItems as OrderItem[])?.map(item => item.order_id) || [])];
          setTotalOrders(uniqueOrderIds.length);
        }
      }

      // Get recent orders (through order_items linking to vendor's products)
      if (vendorProductIds.length === 0) {
        console.log('No vendor products found, skipping recent orders fetch');
        setRecentOrders([]);
      } else {
        console.log('Fetching recent orders for vendorProductIds:', vendorProductIds);
        
        try {
          // Use the simpler approach without inner join to avoid column issues
          console.log('Using simplified approach for recent orders...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('order_items')
            .select('order_id')
            .in('product_id', vendorProductIds)
            .limit(5);

          if (fallbackError) {
            console.error('Order items query failed:', fallbackError);
            console.error('Order items error details:', JSON.stringify(fallbackError, null, 2));
            setRecentOrders([]);
          } else if (fallbackData && fallbackData.length > 0) {
            console.log('Order items data received:', fallbackData);
            const orderIds = [...new Set((fallbackData as OrderItem[]).map(item => item.order_id))];
            
            // Fetch the actual orders
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('id, customer_id, total_amount, status, created_at')
              .in('id', orderIds)
              .order('created_at', { ascending: false })
              .limit(5);

            if (ordersError) {
              console.error('Error fetching orders data:', ordersError);
              console.error('Orders error details:', JSON.stringify(ordersError, null, 2));
              setRecentOrders([]);
            } else {
              console.log('Orders data received:', ordersData);
              setRecentOrders(ordersData || []);
            }
          } else {
            console.log('No order items data returned');
            setRecentOrders([]);
          }
        } catch (error) {
          console.error('Unexpected error in recent orders fetch:', error);
          setRecentOrders([]);
        }
      }

      // Calculate total sales from order_items (through vendor's products)
      if (vendorProductIds.length === 0) {
        setTotalSales(0);
      } else {
        const { data: orderItems, error: salesError } = await supabase
          .from('order_items')
          .select('price, quantity')
          .in('product_id', vendorProductIds);
        
        if (salesError) {
          console.error('Error fetching sales data:', salesError);
          setTotalSales(0);
        } else if (orderItems && orderItems.length > 0) {
          const total = (orderItems as OrderItem[]).reduce((sum: number, item: OrderItem) => sum + (item.price * item.quantity), 0);
          setTotalSales(total);
        } else {
          setTotalSales(0);
        }
      }

      // Reviews table doesn't exist yet, set default values
      setStoreRating(0);
      setReviewCount(0);
    } catch (error) {
      console.error('Unexpected error fetching dashboard stats:', error);
    } finally {
      setIsFetchingStats(false);
    }
  }, [user?.id, isFetchingStats]);

  const checkVendorAccess = useCallback(async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is a vendor with active subscription
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_vendor, subscription_status')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          console.error('Profile error details:', JSON.stringify(error, null, 2));
          router.push('/vendor');
          return;
        }
        
        if (!(profile as any)?.is_vendor || (profile as any)?.subscription_status !== 'active') {
          console.warn('Access denied - Profile details:', {
            is_vendor: (profile as any)?.is_vendor,
            subscription_status: (profile as any)?.subscription_status,
            userId: user.id
          });
          router.push('/vendor');
          return;
        }

        // Get vendor data
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (vendorError) {
          console.error('Error fetching vendor data:', vendorError);
        } else {
          setVendorData(vendor);
        }

        // Fetch dashboard stats
        await fetchDashboardStats();
      } catch (error) {
        console.error('Error checking vendor access:', error);
        router.push('/vendor');
      } finally {
        setLoading(false);
      }
    }, [user, router, fetchDashboardStats]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vendorDataUpdated') {
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    checkVendorAccess();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkVendorAccess, refreshKey]);

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <Store className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">Vendor Dashboard</h1>
          <p className="text-black opacity-80 mb-6">
            Please sign in to access your vendor dashboard and manage your store.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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


  const formatIndianCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Welcome back, {vendorData?.store_name || 'My Online Store'}!
        </h2>
        <p className="text-black opacity-80 text-sm sm:text-base">
          Manage your store, products, and track your sales performance.
        </p>
        {!vendorData?.store_name && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your store doesn't have a name yet. 
              <Link href="/vendor/settings" className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium">
                Update your store name in Settings
              </Link>
            </p>
          </div>
        )}
      </div>

          {/* Statistics Grid - Mobile Optimized 2-column */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-black mb-1">Total Revenue</p>
              <p className="text-xl sm:text-3xl font-bold text-black">
                {formatIndianCurrency(totalSales)}
              </p>
              <p className="text-xs text-green-600 mt-1 sm:mt-2">{totalSales > 0 ? 'Sales calculated' : 'No sales yet'}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
              <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-black mb-1">Total Orders</p>
              <p className="text-xl sm:text-3xl font-bold text-black">{totalOrders}</p>
              <p className="text-xs text-blue-600 mt-1 sm:mt-2">{recentOrders.length > 0 ? `${recentOrders.length} recent` : 'No recent'} orders</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-black mb-1">Active Products</p>
              <p className="text-xl sm:text-3xl font-bold text-black">{activeProducts}</p>
              <p className="text-xs text-purple-600 mt-1 sm:mt-2">{activeProducts > 0 ? 'All active' : 'No products'}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Store Rating */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-black mb-1">Store Rating</p>
              <p className="text-xl sm:text-3xl font-bold text-black">{storeRating}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      i < Math.floor(storeRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-xs text-black ml-1 sm:ml-2">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6">Recent Orders</h3>
        
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-black">Order ID</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-black">Customer</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-black">Amount</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-black">Status</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-black hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-black">#{order.id?.slice(0, 8) || 'N/A'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-black">Customer</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-black">
                      {formatIndianCurrency(order.total_amount || 0)}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-black hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-black text-sm sm:text-base">No recent orders found</p>
            <p className="text-xs sm:text-sm text-black opacity-60 mt-1 sm:mt-2">Your recent orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
