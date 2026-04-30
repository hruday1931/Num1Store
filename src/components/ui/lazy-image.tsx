'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallback?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false,
  fallback = '/images/placeholder-product.svg'
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      setImageLoaded(true);
      return;
    }

    const img = document.createElement('img');
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      setImageSrc(fallback);
      setImageLoaded(true);
    };
  }, [src, fallback, priority]);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-70'}`}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
