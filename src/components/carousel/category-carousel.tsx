'use client';

import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { id: 1, name: 'Electronics', icon: '📱', color: 'bg-blue-100' },
  { id: 2, name: 'Fashion', icon: '👗', color: 'bg-pink-100' },
  { id: 3, name: 'Home & Garden', icon: '🏡', color: 'bg-green-100' },
  { id: 4, name: 'Sports', icon: '⚽', color: 'bg-orange-100' },
  { id: 5, name: 'Books', icon: '📚', color: 'bg-purple-100' },
  { id: 6, name: 'Toys', icon: '🧸', color: 'bg-yellow-100' },
  { id: 7, name: 'Beauty', icon: '💄', color: 'bg-red-100' },
  { id: 8, name: 'Automotive', icon: '🚗', color: 'bg-gray-100' },
];

export function CategoryCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      loop: true,
      dragFree: false,
      containScroll: 'trimSnaps',
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (!autoplay) return;

    const onMouseEnter = () => autoplay.stop();
    const onMouseLeave = () => autoplay.play();

    const emblaNode = emblaApi.rootNode();
    emblaNode.addEventListener('mouseenter', onMouseEnter);
    emblaNode.addEventListener('mouseleave', onMouseLeave);

    return () => {
      emblaNode.removeEventListener('mouseenter', onMouseEnter);
      emblaNode.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [emblaApi]);

  return (
    <section className="py-20 bg-[#E6E6FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse through our wide range of product categories
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 md:gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex-none w-32 md:w-40 lg:w-48 cursor-pointer group"
                >
                  <div className={`${category.color} rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:scale-105`}>
                    <div className="text-4xl md:text-5xl text-center mb-3">
                      {category.icon}
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-gray-800 text-center group-hover:text-gray-900">
                      {category.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Previous category"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Next category"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
}
