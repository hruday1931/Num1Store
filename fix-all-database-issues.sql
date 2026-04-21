-- Complete Database Fix for Num1Store
-- Run this entire script in Supabase SQL Editor

-- ===========================================
-- FIX 1: Add is_featured column to products
-- ===========================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Mark some existing products as featured (optional)
UPDATE products SET is_featured = TRUE WHERE 
  name ILIKE '%headphones%' OR 
  name ILIKE '%coffee%' OR 
  name ILIKE '%watch%' OR
  name ILIKE '%smart%' OR
  created_at > NOW() - INTERVAL '30 days'
LIMIT 5;

-- ===========================================
-- FIX 2: Create categories table
-- ===========================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for categories (public read access for active categories)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, icon_name, sort_order, is_active) VALUES
  ('Electronics', 'electronics', 'Gadgets, devices, and tech accessories', '/images/categories/electronics.jpg', 'Cpu', 1, true),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', '/images/categories/fashion.jpg', 'Shirt', 2, true),
  ('Home & Living', 'home-living', 'Furniture, decor, and household items', '/images/categories/home.jpg', 'Home', 3, true),
  ('Sports', 'sports', 'Fitness equipment and athletic gear', '/images/categories/sports.jpg', 'Dumbbell', 4, true),
  ('Books', 'books', 'Literature, textbooks, and reading materials', '/images/categories/books.jpg', 'BookOpen', 5, true),
  ('Toys & Games', 'toys-games', 'Children toys, board games, and puzzles', '/images/categories/toys.jpg', 'Gamepad2', 6, true),
  ('Beauty', 'beauty', 'Cosmetics, skincare, and personal care', '/images/categories/beauty.jpg', 'Sparkles', 7, true),
  ('Food & Grocery', 'food-grocery', 'Fresh food, snacks, and beverages', '/images/categories/food.jpg', 'Utensils', 8, true),
  ('Automotive', 'automotive', 'Car parts, accessories, and tools', '/images/categories/automotive.jpg', 'Car', 9, true),
  ('Health', 'health', 'Medicine, supplements, and wellness products', '/images/categories/health.jpg', 'Heart', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if is_featured column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'is_featured';

-- Check if categories table exists and has data
SELECT COUNT(*) as category_count FROM categories WHERE is_active = true;

-- Show sample categories
SELECT name, slug, icon_name, sort_order FROM categories WHERE is_active = true ORDER BY sort_order LIMIT 5;

-- Show featured products (if any)
SELECT name, price, is_featured FROM products WHERE is_featured = true LIMIT 3;
