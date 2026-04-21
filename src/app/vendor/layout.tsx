'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Store, LayoutDashboard, Package, ClipboardList, Settings, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [vendorData, setVendorData] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchVendorData = useCallback(async () => {
    if (user?.id) {
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('store_name, phone_number')
          .eq('user_id', user.id)
          .single();
        
        if (vendor) {
          setVendorData(vendor);
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  // Listen for vendor data updates from settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vendorDataUpdated') {
        fetchVendorData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchVendorData]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/vendor/dashboard' },
    { id: 'products', label: 'My Products', icon: Package, path: '/vendor/products' },
    { id: 'orders', label: 'Orders', icon: ClipboardList, path: '/vendor/orders' },
    { id: 'settings', label: 'Account Settings', icon: Settings, path: '/vendor/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center">
              <Store className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-white font-medium">
                {vendorData?.store_name || 'My Store'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="relative w-72 bg-gray-900 shadow-2xl">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Store className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <h1 className="text-lg font-bold text-white">
                        {vendorData?.store_name || 'My Online Store'}
                      </h1>
                      <p className="text-xs text-gray-400 mt-1">Store Management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {!vendorData?.store_name && (
                  <div className="p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      <Link href="/vendor/settings" className="text-orange-400 hover:text-orange-300 underline font-medium">
                        Set your store name
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        router.push(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeMenu === item.id
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area with flex container */}
      <div className="flex flex-1">
        {/* Desktop Sidebar - Professional Dark Color */}
        <aside className="hidden lg:block w-64 bg-gray-900 shadow-xl border-r border-gray-800 flex-shrink-0">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <div className="flex items-center mb-8">
                <Store className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {vendorData?.store_name || 'My Online Store'}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">Store Management</p>
                </div>
              </div>
              {!vendorData?.store_name && (
                <div className="mb-6 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    <Link href="/vendor/settings" className="text-orange-400 hover:text-orange-300 underline font-medium">
                      Set your store name
                    </Link>
                  </p>
                </div>
              )}

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        router.push(item.path);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeMenu === item.id
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto p-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main dashboard content with proper padding */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
