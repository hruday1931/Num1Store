'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  borderColor: 'pink' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  borderColor 
}: StatsCardProps) {
  const borderColors = {
    pink: 'border-l-pink-500',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    yellow: 'border-l-yellow-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500'
  };

  const iconColors = {
    pink: 'text-pink-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}
                </span>
                <span className="text-xs text-gray-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg bg-gray-50 ${iconColors[borderColor]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
