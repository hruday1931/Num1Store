import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Fallback categories for when Supabase is unavailable
const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech', icon_name: 'Laptop' },
  { id: '2', name: 'Fashion', slug: 'fashion', description: 'Clothing and style', icon_name: 'Shirt' },
  { id: '3', name: 'Home', slug: 'home', description: 'Home essentials', icon_name: 'Home' },
  { id: '4', name: 'Beauty', slug: 'beauty', description: 'Beauty products', icon_name: 'Sparkles' },
  { id: '5', name: 'Sports', slug: 'sports', description: 'Sports & fitness', icon_name: 'Dumbbell' },
  { id: '6', name: 'Gaming', slug: 'gaming', description: 'Video games', icon_name: 'Gamepad2' },
  { id: '7', name: 'Books', slug: 'books', description: 'Books & media', icon_name: 'Book' },
  { id: '8', name: 'Automotive', slug: 'automotive', description: 'Car accessories', icon_name: 'Car' },
];

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon_name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      // Return fallback data instead of error
      console.log('Using fallback categories due to Supabase error');
      return NextResponse.json({ categories: FALLBACK_CATEGORIES }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    return NextResponse.json({ categories: categories || FALLBACK_CATEGORIES }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    // Return fallback data instead of error
    console.log('Using fallback categories due to unexpected error');
    return NextResponse.json({ categories: FALLBACK_CATEGORIES }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
