'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/contexts';
import { supabaseClient } from '@/utils/supabase/client';
import { Store, ClipboardList, ArrowLeft, Truck, CreditCard, Eye, Package, RefreshCw, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  business_license?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  vendor_id: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  shipment_id?: number;
  awb_code?: string;
  courier_name?: string;
  shiprocket_order_id?: string;
  pickup_status?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
}

interface OrderWithItems extends Order {
  items: {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }[];
}

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [shiprocketLoading, setShiprocketLoading] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);
  const [labelLoading, setLabelLoading] = useState<string | null>(null);
  
  const supabase = supabaseClient();

  const fetchOrders = async (vendorId: string) => {
    setOrdersLoading(true);
    try {
      // First, get all products for this vendor
      const { data: vendorProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('vendor_id', vendorId);

      if (productsError) {
        console.error('Error fetching vendor products:', productsError);
        return;
      }

      if (!vendorProducts || vendorProducts.length === 0) {
        console.log('No products found for vendor:', vendorId);
        setOrders([]);
        return;
      }

      const products = vendorProducts as Product[];
      const productIds = products.map(p => p.id);
      const productMap = new Map(products.map(p => [p.id, p.name]));

      // Get order items for these products
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
        return;
      }

      if (!orderItems || orderItems.length === 0) {
        console.log('No order items found for vendor products');
        setOrders([]);
        return;
      }

      const items = orderItems as OrderItem[];
      // Get order details for these order items
      const orderIds = [...new Set(items.map(item => item.order_id))];
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      // Group order items by order and combine with order details
      const orderMap = new Map<string, OrderWithItems>();
      (orders as Order[])?.forEach(order => {
        orderMap.set(order.id, {
          ...order,
          items: []
        });
      });

      items.forEach(item => {
        const order = orderMap.get(item.order_id);
        if (order) {
          const productName = productMap.get(item.product_id) || 'Unknown Product';
          order.items.push({
            id: item.id,
            product_name: productName,
            quantity: item.quantity,
            price: item.price
          });
        }
      });

      setOrders(Array.from(orderMap.values()));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, selectedStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await (supabase
        .from('orders') as any)
        .update({ status: selectedStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        showError('Failed to update order status');
        return;
      }

      // Update local state for immediate refresh
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: selectedStatus } : order
        )
      );

      success('Status updated successfully!');
      
      // If status is changed to 'Processing', show ship order button
      if (selectedStatus === 'processing') {
        success('Order status updated to Processing. Click "Ship Order" to create shipment.');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    setShiprocketLoading(orderId);
    try {
      const response = await fetch('/api/shiprocket/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Shipment creation failed:', result);
        
        // Handle empty error object
        const errorMessage = result.error || 'Unknown error occurred';
        const displayMessage = errorMessage === 'Unknown error occurred' 
          ? 'Failed to create shipment. Please check if the order has complete customer address information.'
          : `Failed to create shipment: ${errorMessage}`;
        
        showError(displayMessage);
        return;
      }

      // Update local state with shipment data
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                shipment_id: result.shipment.shipment_id,
                awb_code: result.shipment.awb_code,
                courier_name: result.shipment.courier_name,
                pickup_status: 'scheduled',
                estimated_delivery: result.shipment.etd
              }
            : order
        )
      );

      success('Shipment created successfully! Pickup request generated automatically.');
    } catch (error) {
      console.error('Shipment creation error:', error);
      showError('Failed to create shipment');
    } finally {
      setShiprocketLoading(null);
    }
  };

  const handleDownloadLabel = async (orderId: string, shipmentId: number) => {
    setLabelLoading(orderId);
    try {
      const response = await fetch('/api/shiprocket/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipmentId }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Label generation failed:', result);
        showError(`Failed to generate label: ${result.error}`);
        return;
      }

      // Open label URL in new tab
      window.open(result.label.label_url, '_blank');
      success('Shipping label downloaded successfully!');
    } catch (error) {
      console.error('Label download error:', error);
      showError('Failed to download shipping label');
    } finally {
      setLabelLoading(null);
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    setTrackingLoading(orderId);
    try {
      const response = await fetch('/api/shiprocket/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Tracking update failed:', result);
        showError(`Failed to update tracking: ${result.error}`);
        return;
      }

      // Update local state with tracking information
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                awb_code: result.awbCode,
                status: result.orderStatus,
                estimated_delivery: result.trackingData?.etd
              }
            : order
        )
      );

      success('Tracking information updated successfully!');
    } catch (error) {
      console.error('Tracking update error:', error);
      showError('Failed to update tracking information');
    } finally {
      setTrackingLoading(null);
    }
  };

  useEffect(() => {
    const checkVendorAccess = async () => {
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

        if (error || !(profile as any)?.is_vendor || (profile as any)?.subscription_status !== 'active') {
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
        } else if (vendor) {
          const vendorData: Vendor = vendor as Vendor;
          setVendorData(vendorData);
          // Fetch orders after getting vendor data
          await fetchOrders(vendorData.id);
        }
      } catch (error) {
        console.error('Error checking vendor access:', error);
        router.push('/vendor');
      } finally {
        setLoading(false);
      }
    };

    checkVendorAccess();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Vendor Orders</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to view and manage your customer orders.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-red-50 to-rose-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/vendor/dashboard')}
          className="flex items-center text-gray-700 hover:text-red-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <div>
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                <Store className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {vendorData?.store_name || 'My Online Store'} Orders
                </h2>
                <p className="text-gray-600 mt-1">
                  View and manage customer orders efficiently
                </p>
              </div>
            </div>
          </div>
          {!vendorData?.store_name && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-sm text-amber-800">
                  Your store doesn't have a name yet. 
                  <Link href="/vendor/settings" className="ml-1 text-red-600 hover:text-red-700 underline font-semibold">
                    Update your store name in Settings
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Customer Orders</h3>
              <p className="text-gray-600 mt-1">View and manage orders for your products</p>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-xl">
              <span className="text-red-700 font-semibold">{orders.length} Orders</span>
            </div>
          </div>
        </div>

        {ordersLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Orders Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your customer orders will appear here once you start making sales. Keep promoting your products!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-50 to-rose-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    AWB Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Pickup Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        #ORD-{order.id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {order.items.map((item: any, index: number) => (
                          <div key={index} className="text-xs">
                            {item.product_name} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.payment_method === 'cod' ? (
                          <div className="flex items-center px-3 py-1 bg-blue-100 rounded-lg">
                            <Truck className="w-4 h-4 text-blue-700 mr-2" />
                            <span className="text-sm font-semibold text-blue-800">COD</span>
                          </div>
                        ) : (
                          <div className="flex items-center px-3 py-1 bg-green-100 rounded-lg">
                            <CreditCard className="w-4 h-4 text-green-700 mr-2" />
                            <span className="text-sm font-semibold text-green-800">Online</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.payment_status === 'paid' ? (
                          <span>Paid</span>
                        ) : (
                          <span>Unpaid</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        defaultValue={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="bg-white border-2 border-gray-200 text-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-semibold text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {updatingOrderId === order.id && (
                        <div className="inline-block ml-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.courier_name ? (
                        <span className="text-sm font-medium">{order.courier_name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.awb_code ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {order.awb_code}
                          </span>
                          <button
                            onClick={() => window.open(`https://shiprocket.in/tracking/${order.awb_code}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Track on Shiprocket"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        order.pickup_status === 'picked' 
                          ? 'bg-green-100 text-green-800'
                          : order.pickup_status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : order.pickup_status === 'requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.pickup_status ? order.pickup_status.charAt(0).toUpperCase() + order.pickup_status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            // Show order details with proper formatting
                            const items = order.items.map(item => 
                              `${item.product_name} × ${item.quantity} (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)})`
                            ).join('\n');
                            
                            alert(`Order Details for #ORD-${order.id.slice(-8)}\n\nItems:\n${items}\n\nTotal: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.total_amount)}\nPayment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}\nStatus: ${order.status}`);
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {!order.shipment_id && order.status !== 'pending' && order.status !== 'cancelled' ? (
                          <button
                            onClick={() => handleShipOrder(order.id)}
                            disabled={shiprocketLoading === order.id}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Ship Order"
                          >
                            {shiprocketLoading === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </button>
                        ) : order.shipment_id && order.awb_code ? (
                          <button
                            onClick={() => handleDownloadLabel(order.id, order.shipment_id!)}
                            disabled={labelLoading === order.id}
                            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Download Shipping Label"
                          >
                            {labelLoading === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
