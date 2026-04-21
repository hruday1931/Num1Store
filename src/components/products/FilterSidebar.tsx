'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';

type Filters = {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
};

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  products: Product[];
}

export default function FilterSidebar({ filters, onFilterChange, products }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState(filters.priceRange);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(product => product.category)));

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({
      ...filters,
      categories: newCategories
    });
  };

  const handlePriceRangeChange = (index: number, value: number) => {
    const newRange: [number, number] = [...priceRange] as [number, number];
    newRange[index] = value;
    setPriceRange(newRange);
    
    onFilterChange({
      ...filters,
      priceRange: newRange
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    onFilterChange({
      categories: [],
      priceRange: [0, 1000],
      minRating: 0
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear All
        </Button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Min: ₹{priceRange[0]}</label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[0]}
              onChange={(e) => handlePriceRangeChange(0, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Max: ₹{priceRange[1]}</label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[1]}
              onChange={(e) => handlePriceRangeChange(1, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {filters.categories.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {category}
                <button
                  onClick={() => handleCategoryChange(category)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
