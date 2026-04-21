'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { Order, OrderItem, Database } from '@/types';
import { Package, Calendar, DollarSign, ArrowRight, ShoppingBag, X } from 'lucide-react';
import { supabaseClient } from '@/utils/supabase/client';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const { error, success } = useToast();

  useEffect(() => {
    if (!loading && user) {
      fetchOrders();
    } else if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const supabase = supabaseClient();
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        error('Failed to fetch orders: ' + ordersError.message);
        return;
      }

      const ordersWithItems = await Promise.all(
        (ordersData as Order[] || []).map(async (order: Order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            return { ...order, order_items: [] } as Order;
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

          return { ...order, order_items: itemsWithProducts } as Order;
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const canCancelOrder = (status: string) => {
    return status === 'pending' || status === 'processing';
  };

  const handleCancelOrder = async (order: Order) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setCancellingOrderId(orderToCancel.id);
    try {
      const supabase = supabaseClient();
      
      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderToCancel.id)
        .eq('customer_id', user?.id!);

      if (updateError) {
        error('Failed to cancel order: ' + updateError.message);
        return;
      }

      success('Order cancelled successfully');
      setShowCancelDialog(false);
      setOrderToCancel(null);
      
      // Refresh orders list
      await fetchOrders();
    } catch (err) {
      error('Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setOrderToCancel(null);
  };

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="mt-2 text-gray-600">
                Sign in to view your order history
              </p>
            </div>
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to view your orders</h2>
              <p className="text-gray-600 mb-6">Your order history will appear here once you sign in</p>
              <div className="space-x-4">
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-2 text-gray-600">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} in your history
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {order.order_items?.map((item: OrderItem) => (
                        <div key={item.id} className="flex gap-4">
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

                  {/* Order Actions */}
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        <Link href={`/orders/${order.id}/track`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Track Order
                          </Button>
                        </Link>
                        {canCancelOrder(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOrder(order)}
                            disabled={cancellingOrderId === order.id}
                            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 disabled:opacity-50"
                          >
                            {cancellingOrderId === order.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel Order
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Download Invoice
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping */}
          {orders.length > 0 && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => router.push('/')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Cancel Order Confirmation Dialog */}
      {showCancelDialog && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
                  <p className="text-sm text-gray-600">Order #{orderToCancel.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-900">₹{orderToCancel.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orderToCancel.status)}`}>
                    {orderToCancel.status.charAt(0).toUpperCase() + orderToCancel.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={closeCancelDialog}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Keep Order
                </Button>
                <Button
                  onClick={confirmCancelOrder}
                  disabled={cancellingOrderId === orderToCancel.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {cancellingOrderId === orderToCancel.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Order'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
