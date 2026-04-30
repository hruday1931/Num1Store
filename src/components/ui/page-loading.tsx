'use client';

import React from 'react';

export function PageLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header placeholder */}
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse"></div>
      
      {/* Main content placeholder */}
      <main className="flex-1">
        {/* Hero section placeholder */}
        <div className="relative w-full h-[480px] md:h-[400px] lg:h-[480px] bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white text-xl font-medium">Loading Num1Store...</div>
          </div>
        </div>
        
        {/* Category bar placeholder */}
        <div className="bg-gray-50 border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="h-8 bg-gray-300 rounded-lg w-48 mx-auto mb-2 animate-pulse"></div>
                <div className="w-16 h-1 bg-gray-300 mx-auto rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-24 animate-pulse">
                  <div className="w-20 h-20 bg-gray-300 rounded-2xl mb-3 mx-auto"></div>
                  <div className="h-4 bg-gray-300 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Featured products placeholder */}
        <div className="bg-[#F0FFF0] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="h-10 bg-gray-300 rounded-lg w-56 mx-auto mb-2 animate-pulse"></div>
              <div className="w-20 h-1 bg-gray-300 mx-auto rounded-full animate-pulse"></div>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-64 animate-pulse">
                  <div className="bg-white rounded-lg p-4">
                    <div className="aspect-square bg-gray-300 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer placeholder */}
      <div className="h-32 bg-gray-100 border-t border-gray-200 animate-pulse"></div>
    </div>
  );
}
