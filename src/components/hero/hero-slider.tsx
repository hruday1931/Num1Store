'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string;
  active: boolean;
}

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export function HeroSlider() {
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*')
          .eq('active', true);

        if (error) {
          console.error('Error fetching hero banners:', error);
          // Fallback to default banners if Supabase fails
          setHeroBanners([
            {
              id: '1',
              title: 'Electronics Week',
              subtitle: 'Best deals on gadgets & tech',
              image_url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&h=600&fit=crop&auto=format&q=80',
              button_text: 'Shop Now',
              active: true
            }
          ]);
        } else {
          setHeroBanners(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroBanners();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full h-[480px] md:h-[400px] lg:h-[480px] bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="relative w-full h-[480px] md:h-[400px] lg:h-[480px]">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 5000, // Increased to 5 seconds for better UX
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
        }}
        className="w-full h-full"
      >
        {heroBanners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full h-full">
              {/* Background Image with Dark Overlay */}
              <div className="absolute inset-0">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority={index === 0} // Prioritize first image
                  sizes="100vw"
                />
                {/* Dark Linear Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/50"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="text-center md:text-left max-w-2xl">
                    {/* Num1Store Logo */}
                    <div className="flex justify-center md:justify-start mb-6">
                      <div className="w-16 h-16 bg-black border border-gray-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-2xl flex">
                          <span className="text-green-500">N</span>
                          <span className="text-white">1</span>
                          <span className="text-yellow-400">S</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Slide Content */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                      {banner.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-8">
                      {banner.subtitle}
                    </p>
                    
                    {/* CTA Button */}
                    <a 
                      href="#"
                      className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      {banner.button_text}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Arrows */}
      <div className="swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg">
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <div className="swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg">
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Pagination Dots */}
      <div className="swiper-pagination absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2"></div>
    </div>

        </React.Fragment>
  );
}
