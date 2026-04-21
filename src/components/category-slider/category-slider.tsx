'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Cpu, 
  Shirt, 
  Home, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  Sparkles, 
  Utensils, 
  Car, 
  Heart, 
  ShoppingBag, 
  Smartphone, 
  Headphones, 
  Camera, 
  Watch, 
  Package,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import 'swiper/css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_name?: string;
  is_active: boolean;
  sort_order: number;
}

// Icon mapping for categories with Lucide React components
const iconMap: Record<string, any> = {
  'Cpu': Cpu,
  'Shirt': Shirt,
  'Home': Home,
  'Dumbbell': Dumbbell,
  'BookOpen': BookOpen,
  'Gamepad2': Gamepad2,
  'Sparkles': Sparkles,
  'Utensils': Utensils,
  'Car': Car,
  'Heart': Heart,
  'ShoppingBag': ShoppingBag,
  'Smartphone': Smartphone,
  'Headphones': Headphones,
  'Camera': Camera,
  'Watch': Watch,
  'Package': Package
};

// Color palette for category backgrounds
const categoryColors: Record<string, string> = {
  'Electronics': 'bg-blue-500',
  'Fashion': 'bg-pink-500',
  'Home & Living': 'bg-green-500',
  'Sports': 'bg-orange-500',
  'Books': 'bg-purple-500',
  'Toys & Games': 'bg-red-500',
  'Beauty': 'bg-rose-500',
  'Food & Grocery': 'bg-yellow-500',
  'default': 'bg-indigo-500'
};

export function CategorySlider() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset loading state when navigation changes
  useEffect(() => {
    setClickedCategory(null);
  }, [pathname, searchParams]);

  const fetchCategories = async () => {
    try {
      console.log('Starting to fetch categories from Supabase...');
      
      // Check if supabase is properly configured
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        console.error('Category fetch error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Fallback to mock data if database fails
        console.log('Falling back to mock categories due to error');
        setCategories(getMockCategories());
      } else {
        console.log(`Successfully fetched ${data?.length || 0} categories from database`);
        console.log('Categories data:', data);
        // If no categories found, show mock categories
        setCategories((data && data.length > 0) ? data : getMockCategories());
      }
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      setCategories(getMockCategories());
    } finally {
      setLoading(false);
    }
  };

  const getMockCategories = (): Category[] => [
    { id: '1', name: 'Electronics', slug: 'electronics', icon_name: 'Cpu', is_active: true, sort_order: 1 },
    { id: '2', name: 'Fashion', slug: 'fashion', icon_name: 'Shirt', is_active: true, sort_order: 2 },
    { id: '3', name: 'Home & Living', slug: 'home-living', icon_name: 'Home', is_active: true, sort_order: 3 },
    { id: '4', name: 'Sports', slug: 'sports', icon_name: 'Dumbbell', is_active: true, sort_order: 4 },
    { id: '5', name: 'Books', slug: 'books', icon_name: 'BookOpen', is_active: true, sort_order: 5 },
    { id: '6', name: 'Toys & Games', slug: 'toys-games', icon_name: 'Gamepad2', is_active: true, sort_order: 6 },
    { id: '7', name: 'Beauty', slug: 'beauty', icon_name: 'Sparkles', is_active: true, sort_order: 7 },
    { id: '8', name: 'Food & Grocery', slug: 'food-grocery', icon_name: 'Utensils', is_active: true, sort_order: 8 }
  ];

  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return Package;
    return iconMap[iconName] || Package;
  };

  const getCategoryColor = (categoryName: string) => {
    return categoryColors[categoryName] || categoryColors['default'];
  };

  if (loading) {
    return (
      <section className="py-16 bg-[#E6E6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-600">Browse our wide selection of products</p>
            </div>
            <a
              href="/categories"
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <span className="text-sm font-medium">View All</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          
          <div className="animate-pulse">
            <div className="flex justify-center space-x-8 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#E6E6FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-600">Browse our wide selection of products</p>
          </div>
          <a
            href="/categories"
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={2}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 25,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 30,
            },
            1280: {
              slidesPerView: 6,
              spaceBetween: 35,
            },
          }}
          className="category-swiper"
        >
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon_name);
            const bgColor = getCategoryColor(category.name);
            
            return (
              <SwiperSlide key={category.id}>
                <Link
                  href={`/products?category=${category.slug}`}
                  onClick={() => setClickedCategory(category.id)}
                  className={`group flex flex-col items-center space-y-4 p-3 transition-all duration-300 hover:scale-105 relative ${
                    clickedCategory === category.id ? 'scale-95' : ''
                  }`}
                >
                  {/* Loading overlay */}
                  {clickedCategory === category.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 rounded-full flex items-center justify-center z-10">
                      <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                    </div>
                  )}
                  
                  {/* Category Icon Circle with colored background */}
                  <div className={`relative w-20 h-20 md:w-24 md:h-24 ${bgColor} rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 border-2 border-white border-opacity-20`}>
                    <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-sm" />
                  </div>

                  {/* Category Name */}
                  <span className="text-sm md:text-base font-semibold text-black transition-colors duration-300 text-center">
                    {category.name}
                  </span>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
