'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { Order, OrderItem } from '@/types';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  ShoppingBag,
  MapPin,
  Truck,
  CheckCircle,
  Circle,
  ArrowLeft
} from 'lucide-react';
import { supabaseClient } from '@/utils/supabase/client';

const trackingSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Circle },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

export default function OrderTrackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);
  const [shiprocketTracking, setShiprocketTracking] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const { error, success } = useToast();

  useEffect(() => {
    if (!loading && user) {
      fetchOrder();
    } else if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, orderId]);

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!user || !orderId) return;

    const supabase = supabaseClient();
    
    // Subscribe to order changes
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order status updated:', payload.new);
          setOrder(prevOrder => {
            if (!prevOrder) return null;
            return { ...prevOrder, ...payload.new };
          });
        }
      )
      .subscribe();

    setRealtimeSubscription(subscription);

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user, orderId]);

  const fetchOrder = async (forceRefresh = false) => {
    if (!user || !orderId) return;

    if (forceRefresh) {
      setLoadingOrder(true);
    }
    try {
      const supabase = supabaseClient();
      
      // First try to fetch order as customer - force fresh data
      let { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('customer_id', user.id)
        .single();

      // Type assertion to fix TypeScript inference
      let typedOrderData = orderData as Order | null;

      // If not found as customer, check if user is a vendor with products in this order
      if (orderError || !typedOrderData) {
        // Only proceed to vendor check if the error is "not found", not other errors
        if (orderError && orderError.code !== 'PGRST116') {
          throw orderError;
        }
        // Get vendor info for this user
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (vendorData) {
          // Get order items for this order
          const { data: orderItemsData } = await (supabase
            .from('order_items') as any)
            .select('product_id')
            .eq('order_id', orderId);

          if (orderItemsData && orderItemsData.length > 0) {
            // Check if any of these products belong to this vendor
            const productIds = (orderItemsData as any[]).map(item => item.product_id);
            const { data: vendorProducts } = await (supabase
              .from('products') as any)
              .select('id')
              .eq('vendor_id', (vendorData as any).id)
              .in('id', productIds)
              .limit(1);

            if (vendorProducts && vendorProducts.length > 0) {
              // Vendor has access, fetch the order without user_id restriction
              const { data: vendorOrderData, error: vendorOrderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

              if (!vendorOrderError && vendorOrderData) {
                typedOrderData = vendorOrderData as Order;
                orderError = null;
              }
            }
          }
        }
      }

      if (orderError) {
        error('Failed to fetch order: ' + (orderError.message || 'Unknown error'));
        return;
      }

      if (!typedOrderData) {
        error('Order not found');
        router.push('/orders');
        return;
      }

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        setOrder({ ...typedOrderData!, order_items: [] });
        return;
      }

      const itemsWithProducts = await Promise.all(
        (itemsData || []).map(async (item: any) => {
          try {
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.product_id)
              .single();

            return { ...item, product: productError ? null : productData };
          } catch {
            return { ...item, product: null };
          }
        })
      );

      setOrder({ ...typedOrderData!, order_items: itemsWithProducts });
      
      // If order has AWB code, fetch Shiprocket tracking
      if (typedOrderData.awb_code) {
        fetchShiprocketTracking();
      }
    } catch (err) {
      error('Failed to fetch order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleRefresh = () => {
    fetchOrder(true);
    if (order?.awb_code) {
      fetchShiprocketTracking();
    }
  };

  const fetchShiprocketTracking = async () => {
    if (!order?.awb_code) return;
    
    setLoadingTracking(true);
    try {
      const response = await fetch('/api/shiprocket/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      const result = await response.json();

      if (result.success) {
        setShiprocketTracking(result.trackingData);
        if (result.statusUpdated) {
          success('Tracking status updated successfully!');
        }
      } else {
        console.error('Failed to fetch Shiprocket tracking:', result.error);
      }
    } catch (error) {
      console.error('Error fetching Shiprocket tracking:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

  const getCurrentStepIndex = (status?: string) => {
    if (!status) return 0;
    const index = trackingSteps.findIndex(step => step.key === status);
    return index >= 0 ? index : 0;
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order not found</h2>
              <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button
                onClick={() => router.push('/orders')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-purple-100 pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/orders')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loadingOrder || loadingTracking}
                className="border-green-600 text-green-600 hover:bg-green-50 h-11 min-h-[44px]"
              >
                <Package className="w-4 h-4 mr-2" />
                {loadingOrder || loadingTracking ? 'Refreshing...' : 'Refresh Status'}
              </Button>
          </div>

          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
                <p className="text-gray-600 mt-1">Order ID: #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
              </div>
            </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(order.created_at)}
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
          </div>

          {/* Tracking Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Delivery Progress</h2>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="absolute left-0 top-5 w-full h-0.5 bg-gray-200"></div>
              <div 
                className="absolute left-0 top-5 h-0.5 bg-green-600 transition-all duration-300"
                style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
              ></div>
              
              <div className="relative flex justify-between overflow-x-auto">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[60px] px-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 touch-target ${
                        isActive 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`mt-2 text-xs font-medium text-center ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-green-900">
                    {shiprocketTracking?.shipment_status?.toUpperCase() || trackingSteps[currentStepIndex].label}
                  </p>
                  {shiprocketTracking?.shipment_status && (
                    <p className="text-sm text-green-700 mt-1">
                      Shiprocket Status: {shiprocketTracking.shipment_status}
                    </p>
                  )}
                  {shiprocketTracking?.tracking_data?.current_location && (
                    <p className="text-sm text-green-700 mt-1">
                      Current Location: {shiprocketTracking.tracking_data.current_location}
                    </p>
                  )}
                  {order.current_location && !shiprocketTracking?.tracking_data?.current_location && (
                    <p className="text-sm text-green-700 mt-1">
                      Current Location: {order.current_location}
                    </p>
                  )}
                  {order.awb_code && (
                    <p className="text-sm text-green-700 mt-1">
                      AWB Code: {order.awb_code}
                    </p>
                  )}
                  {order.estimated_delivery && (
                    <p className="text-sm text-green-700 mt-1">
                      Estimated Delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shiprocket Tracking Details */}
            {shiprocketTracking && shiprocketTracking.tracking_data && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Live Tracking Details</h3>
                <div className="space-y-3">
                  {shiprocketTracking.tracking_data.tracking_history?.map((track: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{track.activity}</p>
                        <p className="text-xs text-gray-600">{track.location}</p>
                        <p className="text-xs text-gray-500">{new Date(track.date).toLocaleString()}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      <p>No detailed tracking information available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          {order.current_location && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Location</h2>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Map View</p>
                  <p className="text-sm text-gray-500 mt-1">Location: {order.current_location}</p>
                  <p className="text-xs text-gray-400 mt-2">Map integration coming soon</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.order_items?.map((item: OrderItem) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <Link href={`/products/${item.product_id}`} className="block">
                      <h4 className="font-medium text-gray-900 hover:text-green-600 transition-colors cursor-pointer">
                        {item.product?.name || 'Product Name Not Available'}
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.product?.description || 'Product description not available'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                      <span className="font-medium text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
}
