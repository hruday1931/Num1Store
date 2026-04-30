'use client';

import Link from 'next/link';
import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Button } from '@/components/ui/button';
import { HeroSlider } from '@/components/hero/hero-slider';
import { CategoryBar } from '@/components/category-slider/category-bar';
import { FeaturedProducts } from '@/components/featured-products/featured-products';
import { ArrowRight, ShoppingBag, Store, Users, Star, CheckCircle, RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">This section failed to load properly.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading components
function CategoryBarLoading() {
  return (
    <div className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <div className="w-16 h-1 bg-green-500 mx-auto rounded-full"></div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-24 animate-pulse">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl mb-3 mx-auto"></div>
              <div className="h-4 bg-gray-800 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedProductsLoading() {
  return (
    <div className="bg-[#F0FFF0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <div className="w-20 h-1 bg-green-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 animate-pulse">
              <div className="bg-white rounded-lg p-4">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pb-16 md:pb-0">
        {/* Hero Slider with error boundary - loaded immediately */}
        <ErrorBoundary>
          <HeroSlider />
        </ErrorBoundary>
        
        {/* Category Bar with streaming for instant loading */}
        <ErrorBoundary>
          <Suspense fallback={<CategoryBarLoading />}>
            <CategoryBar />
          </Suspense>
        </ErrorBoundary>
        
        {/* Featured Products with streaming for instant loading */}
        <ErrorBoundary>
          <Suspense fallback={<FeaturedProductsLoading />}>
            <FeaturedProducts />
          </Suspense>
        </ErrorBoundary>
      </main>
      
      <Footer />
      <BottomNavigation />
    </div>
  );
}
