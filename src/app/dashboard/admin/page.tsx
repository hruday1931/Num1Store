'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Fetch admin stats from API
    const fetchStats = async () => {
      // TODO: Implement API call to fetch admin statistics
      setStats({
        totalUsers: 1250,
        totalVendors: 156,
        totalProducts: 3420,
        totalOrders: 8900,
        totalRevenue: 125000
      });
    };

    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">
            {!user ? 'Please sign in to access the admin dashboard.' : 'You don\'t have permission to access this page.'}
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
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back to Home
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
      <DashboardSidebar userRole="admin" />
      
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.user_metadata?.full_name || 'Admin'}
            </h1>
            <p className="text-gray-600 mt-2">Manage your marketplace from here</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              borderColor="blue"
              trend={{ value: "12%", isPositive: true }}
            />
            <StatsCard
              title="Vendors"
              value={stats.totalVendors.toLocaleString()}
              icon={Store}
              borderColor="green"
              trend={{ value: "8%", isPositive: true }}
            />
            <StatsCard
              title="Products"
              value={stats.totalProducts.toLocaleString()}
              icon={Package}
              borderColor="purple"
              trend={{ value: "15%", isPositive: true }}
            />
            <StatsCard
              title="Orders"
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingBag}
              borderColor="orange"
              trend={{ value: "5%", isPositive: true }}
            />
            <StatsCard
              title="Revenue"
              value={`§${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              borderColor="yellow"
              trend={{ value: "18%", isPositive: true }}
            />
          </div>

        {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Manage Users</span>
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Approve Vendors</span>
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">View Reports</span>
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New vendor registration</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New order placed</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Product review submitted</p>
                    <p className="text-xs text-gray-500">12 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
