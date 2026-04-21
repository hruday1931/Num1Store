'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { safeFetch } from '@/utils/fetch-wrapper';
import { 
  ShoppingBasket, 
  Laptop, 
  Shirt, 
  Home as HomeIcon, 
  Sparkles, 
  Gamepad2, 
  Heart, 
  Book, 
  Car, 
  Baby,
  Utensils,
  Dumbbell,
  Music,
  Camera,
  Watch,
  Smartphone,
  Headphones,
  Coffee,
  Palette,
  Plane
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
}

const iconMap: Record<string, any> = {
  ShoppingBasket,
  Laptop,
  Shirt,
  Home: HomeIcon,
  Sparkles,
  Gamepad2,
  Heart,
  Book,
  Car,
  Baby,
  Utensils,
  Dumbbell,
  Music,
  Camera,
  Watch,
  Smartphone,
  Headphones,
  Coffee,
  Palette,
  Plane,
  shopping_basket: ShoppingBasket,
  laptop: Laptop,
  shirt: Shirt,
  home: HomeIcon,
  sparkles: Sparkles,
  gamepad2: Gamepad2,
  heart: Heart,
  book: Book,
  car: Car,
  baby: Baby,
  utensils: Utensils,
  dumbbell: Dumbbell,
  music: Music,
  camera: Camera,
  watch: Watch,
  smartphone: Smartphone,
  headphones: Headphones,
  coffee: Coffee,
  palette: Palette,
  plane: Plane,
};

const categoryColors: Record<string, { bg: string; hover: string; text: string }> = {
  electronics: { bg: 'bg-blue-900', hover: 'hover:bg-blue-800', text: 'text-blue-400' },
  fashion: { bg: 'bg-pink-900', hover: 'hover:bg-pink-800', text: 'text-pink-400' },
  home: { bg: 'bg-green-900', hover: 'hover:bg-green-800', text: 'text-green-400' },
  beauty: { bg: 'bg-purple-900', hover: 'hover:bg-purple-800', text: 'text-purple-400' },
  sports: { bg: 'bg-orange-900', hover: 'hover:bg-orange-800', text: 'text-orange-400' },
  gaming: { bg: 'bg-indigo-900', hover: 'hover:bg-indigo-800', text: 'text-indigo-400' },
  books: { bg: 'bg-yellow-900', hover: 'hover:bg-yellow-800', text: 'text-yellow-400' },
  automotive: { bg: 'bg-red-900', hover: 'hover:bg-red-800', text: 'text-red-400' },
  baby: { bg: 'bg-cyan-900', hover: 'hover:bg-cyan-800', text: 'text-cyan-400' },
  food: { bg: 'bg-amber-900', hover: 'hover:bg-amber-800', text: 'text-amber-400' },
  fitness: { bg: 'bg-lime-900', hover: 'hover:bg-lime-800', text: 'text-lime-400' },
  music: { bg: 'bg-rose-900', hover: 'hover:bg-rose-800', text: 'text-rose-400' },
  photography: { bg: 'bg-teal-900', hover: 'hover:bg-teal-800', text: 'text-teal-400' },
  accessories: { bg: 'bg-violet-900', hover: 'hover:bg-violet-800', text: 'text-violet-400' },
  default: { bg: 'bg-gray-800', hover: 'hover:bg-gray-700', text: 'text-gray-400' },
};

export function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await safeFetch('/api/categories');
        if (data.categories) {
          console.log('Categories loaded:', data.categories);
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to mock data for testing
        setCategories([
          { id: '1', name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech', icon_name: 'Laptop' },
          { id: '2', name: 'Fashion', slug: 'fashion', description: 'Clothing and style', icon_name: 'Shirt' },
          { id: '3', name: 'Home', slug: 'home', description: 'Home essentials', icon_name: 'Home' },
          { id: '4', name: 'Beauty', slug: 'beauty', description: 'Beauty products', icon_name: 'Sparkles' },
          { id: '5', name: 'Sports', slug: 'sports', description: 'Sports & fitness', icon_name: 'Dumbbell' },
          { id: '6', name: 'Gaming', slug: 'gaming', description: 'Video games', icon_name: 'Gamepad2' },
          { id: '7', name: 'Books', slug: 'books', description: 'Books & media', icon_name: 'Book' },
          { id: '8', name: 'Automotive', slug: 'automotive', description: 'Car accessories', icon_name: 'Car' },
          { id: '9', name: 'Baby', slug: 'baby', description: 'Baby products', icon_name: 'Baby' },
          { id: '10', name: 'Food', slug: 'food', description: 'Food & drinks', icon_name: 'Utensils' },
          { id: '11', name: 'Music', slug: 'music', description: 'Music & audio', icon_name: 'Music' },
          { id: '12', name: 'Photography', slug: 'photography', description: 'Cameras', icon_name: 'Camera' },
          { id: '13', name: 'Accessories', slug: 'accessories', description: 'Fashion accessories', icon_name: 'Watch' },
          { id: '14', name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones', icon_name: 'Smartphone' },
          { id: '15', name: 'Audio', slug: 'audio', description: 'Audio equipment', icon_name: 'Headphones' },
          { id: '16', name: 'Coffee', slug: 'coffee', description: 'Coffee & tea', icon_name: 'Coffee' },
          { id: '17', name: 'Art', slug: 'art', description: 'Art & craft', icon_name: 'Palette' },
          { id: '18', name: 'Travel', slug: 'travel', description: 'Travel gear', icon_name: 'Plane' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const renderCategoryIcon = (iconName: string) => {
    console.log('Rendering icon for:', iconName); // Debug log
    const IconComponent = iconMap[iconName] || iconMap[iconName.toLowerCase()] || ShoppingBasket;
    
    if (!IconComponent) {
      console.log('Icon not found for:', iconName, 'using default');
      return <ShoppingBasket className="h-8 w-8" />;
    }
    
    return <IconComponent className="h-8 w-8" />;
  };

  const getCategoryColor = (slug: string) => {
    return categoryColors[slug] || categoryColors.default;
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <div className="w-16 h-1 bg-green-500 mx-auto rounded-full"></div>
          </div>
          <div className="flex gap-2">
            <button className="category-nav-prev w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="category-nav-next w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category Slider */}
        {loading ? (
          // Loading skeleton
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-24 animate-pulse">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl mb-3 mx-auto"></div>
                <div className="h-4 bg-gray-800 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={2}
            navigation={{
              nextEl: '.category-nav-next',
              prevEl: '.category-nav-prev',
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 6,
                spaceBetween: 32,
              },
              1280: {
                slidesPerView: 8,
                spaceBetween: 32,
              },
            }}
            className="category-swiper"
          >
            {categories.map((category) => {
              const colors = getCategoryColor(category.slug);
              return (
                <SwiperSlide key={category.id}>
                  <a
                    href={`/products?category=${category.slug}`}
                    className="group block text-center transition-all duration-300 transform hover:scale-105"
                    title={category.description}
                  >
                    {/* Category Icon Container */}
                    <div className={`w-20 h-20 ${colors.bg} ${colors.hover} rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gray-400/20`}>
                      <div className={`${colors.text} transition-colors duration-300 flex items-center justify-center`}>
                        {renderCategoryIcon(category.icon_name)}
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                      {category.name}
                    </span>
                  </a>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>
    </div>
  );
}
