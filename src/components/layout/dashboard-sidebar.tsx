'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Store,
  Users,
  TrendingUp
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

interface DashboardSidebarProps {
  userRole: 'admin' | 'seller' | 'customer';
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const adminMenuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/admin'
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-5 w-5" />,
      href: '/dashboard/admin/users'
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: <Store className="h-5 w-5" />,
      href: '/dashboard/admin/vendors'
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package className="h-5 w-5" />,
      href: '/dashboard/admin/products'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/dashboard/admin/orders'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/dashboard/admin/analytics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/dashboard/admin/settings'
    }
  ];

  const sellerMenuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/seller'
    },
    {
      id: 'products',
      label: 'My Products',
      icon: <Package className="h-5 w-5" />,
      href: '/vendor/products'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/dashboard/seller/orders'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/dashboard/seller/analytics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/dashboard/seller/settings'
    }
  ];

  const customerMenuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard/customer'
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/dashboard/customer/orders'
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: <Package className="h-5 w-5" />,
      href: '/dashboard/customer/wishlist'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/dashboard/customer/settings'
    }
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : 
                   userRole === 'seller' ? sellerMenuItems : 
                   customerMenuItems;

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white z-50 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-purple-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'block'}`}>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-purple-900 font-bold text-lg">N1S</span>
              </div>
              <div>
                <h2 className="font-semibold text-white">Dashboard</h2>
                <p className="text-xs text-purple-200 capitalize">{userRole}</p>
              </div>
            </div>
            
            {/* Toggle buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors group"
                >
                  <span className="flex-shrink-0 text-purple-200 group-hover:text-white">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1 text-left text-white group-hover:text-white">
                      {item.label}
                    </span>
                  )}
                  {item.badge && !isCollapsed && (
                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-purple-700">
          {!isCollapsed && (
            <div className="mb-3">
              <p className="text-sm text-purple-200">Welcome back,</p>
              <p className="text-white font-medium truncate">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors group"
          >
            <LogOut className="h-5 w-5 text-purple-200 group-hover:text-white" />
            {!isCollapsed && (
              <span className="text-white group-hover:text-white">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}
