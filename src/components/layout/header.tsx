'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useCart } from '@/contexts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts';
import { ShoppingCart, User, Menu, X, Home, Package, Store, Heart, LogIn, Search, Briefcase, Info } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { error } = useToast();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProtectedClick = (e: React.MouseEvent, feature: string) => {
    if (!user) {
      e.preventDefault();
      error(`Please sign in to use ${feature}`);
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About Us', href: '/about', icon: Info },
  ];

  const actionIcons = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Become a Vendor', href: '/vendor/dashboard', icon: Store },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();
      // Add to recent searches
      const updatedSearches = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      // Navigate to search page with query parameter using Next.js router
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setIsMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(search)}`);
  };

  const userNavigation = [
    { name: 'Dashboard', href: user?.role === 'admin' ? '/dashboard/admin' : user?.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer' },
    { name: 'My Orders', href: '/orders' },
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <header className="bg-pink-500 shadow-md border-b border-pink-600 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm flex">
                  <span className="text-green-500">N</span>
                  <span className="text-white">1</span>
                  <span className="text-yellow-400">S</span>
                </span>
              </div>
              <span className="text-xl font-bold text-black flex">
                <span className="text-green-500">Num</span>
                <span className="text-white">1</span>
                <span className="text-yellow-400">Store</span>
              </span>
            </Link>
          </div>

          {/* Search Bar - Center */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search products..."
                  className={`w-full px-4 py-2 pr-10 rounded-lg border transition-all ${
                    isSearchFocused
                      ? 'border-green-400 ring-2 ring-green-400 ring-opacity-20'
                      : 'border-gray-300'
                  } bg-white text-black placeholder-gray-500 focus:outline-none`}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Action Icons */}
            {actionIcons.map((item) => {
              const Icon = item.icon;
              const isProtected = item.name === 'Wishlist';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="p-2 text-white hover:text-green-400 transition-colors"
                  title={item.name}
                  onClick={(e) => isProtected && handleProtectedClick(e, item.name.toLowerCase())}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              );
            })}
            
            <Link 
              href="/cart" 
              className="relative p-2 text-white hover:text-green-400"
              onClick={(e) => handleProtectedClick(e, 'cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.user_metadata?.full_name || user.email}</span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={(e) => handleProtectedClick(e, item.name.toLowerCase())}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin" className="p-2 text-white hover:text-green-400 transition-colors" title="Sign In">
                  <LogIn className="h-5 w-5" />
                  <span className="sr-only">Sign In</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Search Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 text-black hover:bg-pink-600 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5 text-black" />
            </button>
            
            {/* Vendor Icon */}
            <Link 
              href="/vendor/dashboard" 
              className="p-2 text-black hover:bg-pink-600 rounded-lg transition-colors"
              onClick={(e) => handleProtectedClick(e, 'vendor dashboard')}
            >
              <Briefcase className="h-5 w-5 text-black" />
            </Link>
            
            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className="relative p-2 text-black hover:bg-pink-600 rounded-lg transition-colors"
              onClick={(e) => handleProtectedClick(e, 'cart')}
            >
              <ShoppingCart className="h-5 w-5 text-black" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-black hover:bg-pink-600 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-black" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-pink-400">
            {/* Mobile Search */}
            <div className="px-2 pt-2 pb-3 sm:px-3">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:ring-opacity-20"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
            
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-white hover:text-green-400 hover:bg-pink-500 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-600">
              {user ? (
                <div className="px-2 space-y-1">
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-white hover:text-green-400 hover:bg-pink-500 rounded-md"
                      onClick={(e) => {
                        handleProtectedClick(e, item.name.toLowerCase());
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-white hover:text-green-400 hover:bg-pink-500 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-2">
                  <Link href="/auth/signin" className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-white hover:text-green-400 hover:bg-pink-500 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white h-full">
            {/* Search Header */}
            <div className="bg-pink-500 px-4 py-3 flex items-center space-x-3">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-black hover:bg-pink-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-black" />
              </button>
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:ring-opacity-20"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-black mb-3">Recent Searches</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 text-black hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Search className="h-4 w-4 text-black" />
                      <span className="text-black">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-3">Popular Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Electronics', 'Fashion', 'Home', 'Beauty'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleRecentSearchClick(category)}
                    className="px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
