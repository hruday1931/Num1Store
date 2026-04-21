
-- Complete Database Fix for Num1Store
-- Run this entire script in your Supabase SQL Editor

-- ==========================================
-- FIX PRODUCTS TABLE
-- ==========================================

-- Add missing columns to products table if they don't exist
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorized';
        RAISE NOTICE 'Added category column to products table';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to products table';
    END IF;
    
    -- Add inventory_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'inventory_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added inventory_count column to products table';
    END IF;
    
    -- Add images column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'images'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added images column to products table';
    END IF;
    
    -- Add vendor_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'vendor_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES vendors(id);
        RAISE NOTICE 'Added vendor_id column to products table';
    END IF;
END $$;

-- Update existing products with proper data
UPDATE products SET 
    category = CASE 
        WHEN name ILIKE '%headphone%' OR name ILIKE '%watch%' THEN 'Electronics'
        WHEN name ILIKE '%coffee%' THEN 'Food'
        WHEN name ILIKE '%yoga%' OR name ILIKE '%shoe%' THEN 'Sports'
        ELSE 'Uncategorized'
    END,
    is_active = COALESCE(is_active, TRUE),
    inventory_count = COALESCE(inventory_count, 50),
    images = COALESCE(images, ARRAY['/images/placeholder.jpg']);

-- ==========================================
-- CREATE CATEGORIES TABLE
-- ==========================================

-- Create categories table if it doesn't exist
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

-- Create policies for categories (public read access for active categories)
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

-- Create index for better performance
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

-- ==========================================
-- FIX PRODUCTS TABLE POLICIES
-- ==========================================

-- Ensure RLS is enabled and policies are correct
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;

-- Create policies for public read access
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);

-- Create policies for vendors
CREATE POLICY "Vendors can view own products" ON products 
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can insert own products" ON products 
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can delete own products" ON products 
FOR DELETE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Verify products table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify categories table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 'Products:' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Categories:' as table_name, COUNT(*) as count FROM categories;

-- Show sample products
SELECT id, name, category, price, is_active, created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Show sample categories
SELECT id, name, slug, is_active, sort_order
FROM categories 
ORDER BY sort_order
LIMIT 10;
