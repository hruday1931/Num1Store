'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { 
  Home, 
  Grid3X3, 
  Search, 
  ShoppingBag, 
  User,
  ShoppingCart 
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  protected?: boolean;
}

export function BottomNavigation() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const { warning } = useToast();
  const [isVisible, setIsVisible] = useState(true);

  // Hide bottom navigation on certain pages
  const hiddenRoutes = ['/auth/signin', '/auth/signup', '/admin', '/seller'];
  const shouldHide = hiddenRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    setIsVisible(!shouldHide);
  }, [pathname, shouldHide]);

  const handleProtectedClick = (e: React.MouseEvent, feature: string) => {
    if (!user) {
      e.preventDefault();
      warning(`Please sign in to use ${feature}`);
    }
  };

  const navigation: NavItem[] = [
    { 
      name: 'Home', 
      href: '/', 
      icon: Home 
    },
    { 
      name: 'Categories', 
      href: '/products', 
      icon: Grid3X3 
    },
    { 
      name: 'Search', 
      href: '/search', 
      icon: Search 
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      icon: ShoppingBag,
      protected: true 
    },
    { 
      name: 'Profile', 
      href: user ? '/profile' : '/auth/signin', 
      icon: User 
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:hidden">
      <div className="flex flex-row justify-around items-center h-14">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const needsAuth = item.protected && !user;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => item.protected && handleProtectedClick(e, item.name.toLowerCase())}
              className={`
                flex flex-col items-center justify-center transition-colors duration-200 py-1
                ${isActive 
                  ? 'text-black' 
                  : needsAuth 
                    ? 'text-gray-400' 
                    : 'text-black'
                }
              `}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.name === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center min-w-[12px] text-[10px]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Add padding for safe area on iOS devices */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
}
