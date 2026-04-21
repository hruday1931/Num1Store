'use client';

import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react';

const featuredProducts = [
  {
    id: 1,
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.5,
    reviews: 128,
    badge: 'Best Seller'
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    price: 249.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 89,
    badge: 'New'
  },
  {
    id: 3,
    name: 'Organic Skincare Set',
    price: 89.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
    rating: 4.7,
    reviews: 203,
    badge: 'Limited'
  },
  {
    id: 4,
    name: 'Professional Camera Lens',
    price: 599.99,
    originalPrice: 799.99,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 56,
    badge: 'Premium'
  },
  {
    id: 5,
    name: 'Yoga Mat Premium',
    price: 39.99,
    originalPrice: 49.99,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop',
    rating: 4.6,
    reviews: 167,
    badge: 'Popular'
  },
  {
    id: 6,
    name: 'Coffee Maker Deluxe',
    price: 149.99,
    originalPrice: 189.99,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    rating: 4.4,
    reviews: 234,
    badge: 'Sale'
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="text-sm text-gray-600 ml-1">({rating})</span>
    </div>
  );
}

export function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      loop: true,
      dragFree: false,
      containScroll: 'trimSnaps',
      slidesToScroll: 1,
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
    <section className="py-20 bg-[#F0FFF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of trending products
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex-none w-64 md:w-72 lg:w-80 group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        aria-label="Add to wishlist"
                      >
                        <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
                      </button>
                      {product.badge && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-6">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="mb-3">
                        <StarRating rating={product.rating} />
                        <span className="text-xs text-gray-500 ml-2">
                          ({product.reviews} reviews)
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        {product.originalPrice && (
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Previous product"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Next product"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
}
