'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts';
import { ShoppingBag, Package, Heart, CreditCard, MapPin, Clock } from 'lucide-react';
import { Order, Product } from '@/types';

interface OrderDisplay {
  id: number;
  orderNumber: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
}

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  vendor: string;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { success, error } = useToast();

  useEffect(() => {
    // Fetch customer orders and wishlist from API
    const fetchCustomerData = async () => {
      // TODO: Implement API calls to fetch customer data
      setOrders([
        { 
          id: 1, 
          orderNumber: 'ORD-001', 
          date: '2024-01-15', 
          total: 129.99, 
          status: 'delivered' as const,
          items: 3
        },
        { 
          id: 2, 
          orderNumber: 'ORD-002', 
          date: '2024-01-20', 
          total: 89.99, 
          status: 'processing' as const,
          items: 2
        },
      ]);
      
      setWishlist([
        { id: 1, name: 'Wireless Headphones', price: 89.99, vendor: 'TechStore' },
        { id: 2, name: 'Smart Watch', price: 199.99, vendor: 'GadgetHub' },
      ]);
    };

    if (user?.role === 'customer') {
      fetchCustomerData();
    }
  }, [user]);

  if (!user || user.role !== 'customer') {
    if (!user) {
      // Show empty state for non-logged in users
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
              <p className="text-gray-600 mb-6">
                Please sign in to view your customer dashboard.
              </p>
              <div className="space-x-4">
                <Button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => window.location.href = '/products'}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Browse Products
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
    
    // Show role mismatch for logged in users
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
            <p className="text-gray-600 mb-6">
              Sign in as a customer to access your dashboard.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => window.location.href = '/products'}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Browse Products
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.user_metadata?.full_name || 'Customer'}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wishlist</p>
                <p className="text-2xl font-bold text-gray-900">{wishlist.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Address</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Methods</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.date}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{order.items} items</p>
                        <p className="text-lg font-semibold text-gray-900">§{order.total}</p>
                      </div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wishlist */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Wishlist</h2>
                <Heart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="divide-y divide-gray-200">
                {wishlist.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm font-semibold text-gray-900">§{item.price}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{item.vendor}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Package className="h-4 w-4 mr-2" />
              Track Orders
            </Button>
            <Button variant="outline" className="justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Manage Addresses
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Methods
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
