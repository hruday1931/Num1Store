'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, ShoppingBag, TrendingUp, Plus, Eye, Store } from 'lucide-react';
import { Product } from '@/types';

interface SellerProduct {
  id: number;
  name: string;
  price: number;
  inventory: number;
  status: 'active' | 'inactive';
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [products, setProducts] = useState<SellerProduct[]>([]);

  useEffect(() => {
    // Fetch seller stats and products from API
    const fetchSellerData = async () => {
      // TODO: Implement API calls to fetch seller data
      setStats({
        totalProducts: 45,
        totalOrders: 234,
        totalRevenue: 12500,
        pendingOrders: 12
      });
      
      setProducts([
        { id: 1, name: 'Wireless Headphones', price: 89.99, inventory: 15, status: 'active' as const },
        { id: 2, name: 'Smart Watch', price: 199.99, inventory: 8, status: 'active' as const },
        { id: 3, name: 'Laptop Stand', price: 34.99, inventory: 0, status: 'inactive' as const },
      ]);
    };

    if (user?.role === 'seller') {
      fetchSellerData();
    }
  }, [user]);

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Access Required</h1>
          <p className="text-gray-600 mb-6">
            {!user ? 'Please sign in to access your seller dashboard.' : 'You need a seller account to access this page.'}
          </p>
          <div className="space-x-4">
            {!user ? (
              <Button
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = '/vendor'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Become a Seller
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <DashboardSidebar userRole="seller" />
      
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.full_name || 'Seller'}
              </h1>
              <p className="text-gray-600 mt-2">Manage your products and orders</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Products"
              value={stats.totalProducts}
              icon={Package}
              borderColor="blue"
              trend={{ value: "8%", isPositive: true }}
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              borderColor="green"
              trend={{ value: "12%", isPositive: true }}
            />
            <StatsCard
              title="Revenue"
              value={`§${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              borderColor="yellow"
              trend={{ value: "15%", isPositive: true }}
            />
            <StatsCard
              title="Pending Orders"
              value={stats.pendingOrders}
              icon={TrendingUp}
              borderColor="orange"
              trend={{ value: "3%", isPositive: false }}
            />
          </div>

        {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        §{product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.inventory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
