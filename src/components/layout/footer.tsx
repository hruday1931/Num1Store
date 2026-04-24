'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Laptop, Shirt, Home as HomeIcon, Sparkles, Package, Gamepad2, ShoppingBasket, MessageCircle, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { safeFetch } from '@/utils/fetch-wrapper';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

const iconMap: Record<string, any> = {
  Laptop,
  Shirt,
  Home: HomeIcon,
  Sparkles,
  ShoppingBasket,
  Package,
  Gamepad2,
  Palette: Sparkles,
  Cpu: Laptop,
  Dumbbell: Package,
  BookOpen: Package,
  Utensils: Package,
  Car: Package,
  Heart: Sparkles,
};

const categoryColors: Record<string, { hover: string }> = {
  electronics: { hover: 'hover:text-green-400' },
  fashion: { hover: 'hover:text-pink-400' },
  home: { hover: 'hover:text-green-400' },
  'home-living': { hover: 'hover:text-green-400' },
  beauty: { hover: 'hover:text-pink-400' },
  'beauty-health': { hover: 'hover:text-pink-400' },
  sports: { hover: 'hover:text-blue-400' },
  gaming: { hover: 'hover:text-purple-400' },
  'toys-games': { hover: 'hover:text-purple-400' },
  books: { hover: 'hover:text-yellow-400' },
  'food-grocery': { hover: 'hover:text-orange-400' },
  automotive: { hover: 'hover:text-red-400' },
  health: { hover: 'hover:text-red-400' },
};

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use static categories for now - remove API call to prevent console errors
    setCategories([
      { id: '1', name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices', icon_name: 'Laptop' },
      { id: '2', name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', icon_name: 'Shirt' },
      { id: '3', name: 'Home', slug: 'home', description: 'Home and living', icon_name: 'Home' },
      { id: '4', name: 'Beauty', slug: 'beauty', description: 'Beauty and health', icon_name: 'Sparkles' },
      { id: '5', name: 'Sports', slug: 'sports', description: 'Sports and fitness', icon_name: 'Package' },
      { id: '6', name: 'Gaming', slug: 'gaming', description: 'Games and consoles', icon_name: 'Gamepad2' },
    ]);
    setLoading(false);
  }, []);

  const renderCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || ShoppingBasket;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (slug: string) => {
    return categoryColors[slug] || { hover: 'hover:text-green-400' };
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg flex">
                  <span className="text-green-500">N</span>
                  <span className="text-white">1</span>
                  <span className="text-yellow-400">S</span>
                </span>
              </div>
              <span className="text-2xl font-bold text-white flex">
                <span className="text-green-500">Num</span>
                <span className="text-white">1</span>
                <span className="text-yellow-400">Store</span>
              </span>
            </div>
            <p className="text-gray-300 mb-3 max-w-md text-base leading-relaxed">
              Your trusted multi-vendor marketplace connecting quality sellers with discerning customers. 
              Shop thousands of products from verified vendors.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-400 transition-colors duration-200">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop by Category */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Shop by Category</h3>
            <ul className="space-y-1">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <li key={index} className="flex items-center space-x-2 animate-pulse">
                    <div className="h-4 w-4 bg-gray-700 rounded"></div>
                    <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  </li>
                ))
              ) : (
                categories.map((category) => {
                  const color = getCategoryColor(category.slug);
                  return (
                    <li key={category.id}>
                      <Link 
                        href={`/products?category=${category.slug}`} 
                        className={`flex items-center space-x-2 text-gray-300 ${color.hover} transition-colors group`}
                        title={category.description}
                      >
                        <div className="group-hover:scale-110 transition-transform duration-200">
                          {renderCategoryIcon(category.icon_name)}
                        </div>
                        <span>{category.name}</span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-gray-300 hover:text-white transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href="mailto:support@num1store.com" className="text-gray-300 hover:text-white transition-colors">support@num1store.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">123 Market St, Commerce City, ST 12345</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-4 pt-3">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Num1Store. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-gray-400 hover:text-white text-sm transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
