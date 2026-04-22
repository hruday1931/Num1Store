import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ukipceixpshplkdinkre.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;
