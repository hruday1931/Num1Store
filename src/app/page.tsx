import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Button } from '@/components/ui/button';
import { HeroSlider } from '@/components/hero/hero-slider';
import { CategoryBar } from '@/components/category-slider/category-bar';
import { FeaturedProducts } from '@/components/featured-products/featured-products';
import { ArrowRight, ShoppingBag, Store, Users, Star, CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

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
        {/* Hero Slider */}
        <HeroSlider />
        
        {/* Category Bar with Suspense for instant loading */}
        <Suspense fallback={<CategoryBarLoading />}>
          <CategoryBar />
        </Suspense>
        
        {/* Featured Products with Suspense for instant loading */}
        <Suspense fallback={<FeaturedProductsLoading />}>
          <FeaturedProducts />
        </Suspense>
      </main>
      
      <Footer />
      <BottomNavigation />
    </div>
  );
}
